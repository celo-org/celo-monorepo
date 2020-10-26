import { Address, normalizeAddressWith0x, sleep } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { CeloTransactionObject, ContractKit } from '@celo/contractkit'
import {
  MetaTransactionWalletWrapper,
  toRawTransaction,
} from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { hashMessage } from '@celo/utils/lib/signatureUtils'
import { TransactionReceipt } from 'web3-core'
import {
  deployWallet,
  getDistributedBlindedPepper,
  GetDistributedBlindedPepperResp,
  requestSubsidisedAttestations,
  startSession,
  StartSessionPayload,
  submitMetaTransaction,
} from './actions'
import { KomenciClient } from './client'
import {
  AuthenticationFailed,
  FetchError,
  FetchErrorTypes,
  InvalidWallet,
  LoginSignatureError,
  TxError,
  TxErrorTypes,
  TxEventNotFound,
  TxRevertError,
  TxTimeoutError,
} from './errors'
import { retry } from './retry'
import { verifyWallet } from './verifyWallet'

const TAG = 'KomenciKit'

interface KomenciOptions {
  url: string
  token?: string
  txRetryTimeoutMs: number
  txPollingIntervalMs: number
}

const DEFAULT_OPTIONS: Pick<KomenciOptions, 'txRetryTimeoutMs' | 'txPollingIntervalMs'> = {
  txRetryTimeoutMs: 20000,
  txPollingIntervalMs: 100,
}

export type KomenciOptionsInput = Omit<KomenciOptions, keyof typeof DEFAULT_OPTIONS> &
  Partial<KomenciOptions>

export class KomenciKit {
  private client: KomenciClient
  private options: KomenciOptions
  private externalAccount: string

  constructor(
    private contractKit: ContractKit,
    externalAccount: string,
    options: KomenciOptionsInput
  ) {
    this.externalAccount = normalizeAddressWith0x(externalAccount)
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    }

    this.client = new KomenciClient(this.options.url, this.options.token)
  }

  /**
   * startSession: uses the /v1/startSession endpoint to start a Komenci session
   * It results in a token that is saved in the client automatically and
   * will be used on subsequent requests.
   *
   * @param captchaToken - an unspent captcha token
   * @return Result<token, error>
   */
  startSession = async (
    captchaToken: string
  ): Promise<Result<string, FetchError | AuthenticationFailed | LoginSignatureError>> => {
    const signatureResp = await this.getLoginSignature()
    if (!signatureResp.ok) {
      return signatureResp
    }

    const payload: StartSessionPayload = {
      externalAccount: this.externalAccount,
      captchaResponseToken: captchaToken,
      signature: signatureResp.result,
    }

    const resp = await this.client.exec(startSession(payload))

    if (resp.ok) {
      this.client.setToken(resp.result.token)
      return Ok(resp.result.token)
    } else if (resp.error.errorType === FetchErrorTypes.Unauthorised) {
      return Err(new AuthenticationFailed())
    }

    return resp
  }

  /**
   * getDistributedBlindedPepper: uses the /v1/distributedBlindedPepper endpoint to
   * request the identifier and pepper associated with a phone number in a fee-less scenario
   *
   * @param e164Number - phone number
   * @param clientVersion
   * @returns the identifier and the pepper
   */
  getDistributedBlindedPepper = async (
    e164Number: string,
    clientVersion: string
  ): Promise<Result<GetDistributedBlindedPepperResp, FetchError>> => {
    return this.client.exec(getDistributedBlindedPepper({ e164Number, clientVersion }))
  }

  /**
   * deployWallet: uses the /v1/deployWallet endpoint to deploy a MetaTransactionWallet Proxy
   * pointing it to the implementation passed as an argument
   * The function takes care of waiting for retrying, waiting for receipt and log parsing
   *
   * @param implementationAddress the implementation address Valora requires
   * @returns the wallet address
   */
  @retry({
    tries: 3,
    bailOnErrorTypes: [
      FetchErrorTypes.Unauthorised,
      FetchErrorTypes.ServiceUnavailable,
      TxErrorTypes.Revert,
    ],
    onRetry: (_args, error, attempt) => {
      console.debug(`${TAG}/deployWallet attempt#${attempt} error: `, error)
    },
  })
  public async deployWallet(
    implementationAddress: string
  ): Promise<Result<string, FetchError | TxError | InvalidWallet>> {
    const resp = await this.client.exec(deployWallet({ implementationAddress }))
    if (resp.ok) {
      if (resp.result.status === 'deployed') {
        return Ok(resp.result.walletAddress)
      } else {
        const txHash = resp.result.txHash
        const receiptResult = await this.waitForReceipt(txHash)
        if (receiptResult.ok) {
          const receipt = receiptResult.result
          if (!receipt.status) {
            // TODO: Possible to extract reason?
            return Err(new TxRevertError(txHash, ''))
          }

          const deployer = await this.contractKit.contracts.getMetaTransactionWalletDeployer(
            resp.result.deployerAddress
          )
          const events = await deployer.getPastEvents(deployer.eventTypes.WalletDeployed, {
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
          })

          const deployWalletLog = events.find(
            (event) => normalizeAddressWith0x(event.returnValues.owner) === this.externalAccount
          )

          if (deployWalletLog === undefined) {
            return Err(new TxEventNotFound(txHash, deployer.events.WalletDeployed.name))
          }

          const walletStatus = await verifyWallet(
            this.contractKit,
            deployWalletLog,
            implementationAddress,
            this.externalAccount
          )

          if (!walletStatus.ok) {
            return walletStatus
          }

          return Ok(deployWalletLog.returnValues.wallet)
        }

        return receiptResult
      }
    } else {
      return resp
    }
  }

  /**
   * requestAttestations: uses the /v1/requestSubsidisedAttestations endpoint
   * in order to request attestations.
   * It constructs and passes in two meta transactions (approve, request)
   * which are executed in batch in Komenci.
   *
   * @param identifier - phone number identifier
   * @param walletAddress - MetaTransactionWallet address requesting attestations
   * @param attestationsRequested - the number of attestations
   * @return TransactionReceipt of the batch transaction
   */
  @retry({
    tries: 3,
    bailOnErrorTypes: [
      FetchErrorTypes.Unauthorised,
      FetchErrorTypes.ServiceUnavailable,
      TxErrorTypes.Revert,
    ],
    onRetry: (_args, error, attempt) => {
      console.debug(`${TAG}/requestAttestations attempt#${attempt} error: `, error)
    },
  })
  public async requestAttestations(
    identifier: string,
    walletAddress: string,
    attestationsRequested: number
  ): Promise<Result<TransactionReceipt, FetchError | TxError>> {
    const attestations = await this.contractKit.contracts.getAttestations()
    const wallet = await this.getWallet(walletAddress)
    let nonce = await wallet.nonce()

    const approveTx = await attestations.approveAttestationFee(attestationsRequested)
    const approveTxSig = await wallet.signMetaTransaction(approveTx.txo, nonce++)
    const approveMetaTx = wallet.executeMetaTransaction(approveTx.txo, approveTxSig)

    const requestTx = await attestations.request(identifier, attestationsRequested)
    const requestTxSig = await wallet.signMetaTransaction(requestTx.txo, nonce++)
    const requestMetaTx = wallet.executeMetaTransaction(requestTx.txo, requestTxSig)

    const resp = await this.client.exec(
      requestSubsidisedAttestations({
        identifier,
        attestationsRequested,
        walletAddress,
        transactions: {
          request: toRawTransaction(requestMetaTx.txo),
          approve: toRawTransaction(approveMetaTx.txo),
        },
      })
    )

    if (resp.ok) {
      const txHash = resp.result.txHash
      return this.waitForReceipt(txHash)
    }

    return resp
  }

  /**
   * selectIssuers: just wraps the `submitMetaTransaction` action in order
   * to execute Attestations.selectIssuers(identifier)
   * TODO: I'm not sure if we need this. Valora can call submitMetaTransaction
   *
   * @param identifier - the phone number identifier
   * @param walletAddress - MetaTransactionWallet address requesting attestations
   */
  public async selectIssuers(
    identifier: string,
    walletAddress: string
  ): Promise<Result<TransactionReceipt, FetchError | TxError>> {
    const attestations = await this.contractKit.contracts.getAttestations()
    await attestations.waitForSelectingIssuers(identifier, walletAddress)
    return this.submitMetaTransaction(walletAddress, attestations.selectIssuers(identifier))
  }

  /**
   * completeAttestation: just wraps the `submitMetaTransaction` action in order
   * to execute Attestations.complete(identifier, walletAddress, issuer, code)
   * TODO: I'm not sure if we need this. Valora can call submitMetaTransaction
   *
   * @param identifier - the phone number identifier
   * @param walletAddress - MetaTransactionWallet address requesting attestations
   * @param issuer - the issuer ID
   * @param code - the code
   */
  public async completeAttestation(
    identifier: string,
    walletAddress: string,
    issuer: Address,
    code: string
  ): Promise<Result<TransactionReceipt, FetchError | TxError>> {
    const attestations = await this.contractKit.contracts.getAttestations()
    return this.submitMetaTransaction(
      walletAddress,
      await attestations.complete(identifier, walletAddress, issuer, code)
    )
  }

  /**
   * submitMetaTransaction: uses the /v1/submitMetaTransaction endpoint
   * It receives a wallet address and transaction (as a CeloTransactionObject)
   * and creates a signature and passes everything to Komenci for execution
   *
   * @param walletAddress - the MTW that should execute the transaction
   * @param tx - the transaction to be executed
   * @param nonce - optional nonce to be used for signing the meta-tx
   */
  @retry({
    tries: 3,
    bailOnErrorTypes: [
      FetchErrorTypes.Unauthorised,
      FetchErrorTypes.ServiceUnavailable,
      TxErrorTypes.Revert,
    ],
    onRetry: (_args, error, attempt) => {
      console.debug(`${TAG}/submitMetaTransaction attempt#${attempt} error: `, error)
    },
  })
  public async submitMetaTransaction(
    walletAddress: string,
    tx: CeloTransactionObject<any>,
    nonce?: number
  ): Promise<Result<TransactionReceipt, FetchError | TxError>> {
    const wallet = await this.getWallet(walletAddress)
    const signature = await wallet.signMetaTransaction(tx.txo, nonce)
    const rawMetaTx = toRawTransaction(wallet.executeMetaTransaction(tx.txo, signature).txo)

    const resp = await this.client.exec(submitMetaTransaction(rawMetaTx))
    if (resp.ok) {
      const txHash = resp.result.txHash
      return this.waitForReceipt(txHash)
    }

    return resp
  }

  /**
   * Utility function used to wait for a transaction to finalise and return the receipt
   *
   * @param txHash - the hash of the transaction to watch
   * @private
   */
  private async waitForReceipt(txHash: string): Promise<Result<TransactionReceipt, TxError>> {
    let receipt: TransactionReceipt | null = null
    let waited = 0
    while (receipt == null && waited < this.options.txRetryTimeoutMs) {
      receipt = await this.contractKit.web3.eth.getTransactionReceipt(txHash)
      if (receipt == null) {
        await sleep(this.options.txPollingIntervalMs)
        waited += this.options.txPollingIntervalMs
      }
    }

    if (receipt == null) {
      return Err(new TxTimeoutError())
    }

    return Ok(receipt)
  }

  /**
   * Utility function used to instantiate a MetaTransactionWalletWrapper cached by address
   *
   * @param txHash - the hash of the transaction to watch
   * @private
   */
  _wallet?: MetaTransactionWalletWrapper
  private async getWallet(address: string): Promise<MetaTransactionWalletWrapper> {
    if (this._wallet === undefined || this._wallet.address !== address) {
      this._wallet = await this.contractKit.contracts.getMetaTransactionWallet(address)
    }
    return this._wallet
  }

  /**
   * Used to create a signature for a login message that allows the server to verify that the
   * externalAccount passed in is actually owned by the caller.
   *
   * TODO: In order to increase security and prevent replay attacks we should introduce a nonce
   * Flow would be:
   * 1. KomenciKit asks for a nonce from Komenci
   * 2. Komenci saves the nonce in state, associated with the external account requesting it
   * 3. KomenciKit signs a message containing the nonce and uses it to call startSession
   *
   * @param externalAccount
   * @returns the signature of the login message
   * @private
   */
  private async getLoginSignature(): Promise<Result<string, LoginSignatureError>> {
    try {
      const signature = await this.contractKit.web3.eth.sign(
        hashMessage(`komenci:login:${this.externalAccount}`),
        this.externalAccount
      )
      return Ok(signature)
    } catch (e) {
      return Err(new LoginSignatureError(e))
    }
  }
}
