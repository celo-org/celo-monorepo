import BigNumber from 'bignumber.js'
import { values } from 'lodash'
import sleep from 'sleep-promise'
import * as util from 'util'
import Web3 from 'web3'
import Contract from 'web3/eth/contract'
import { TransactionObject } from 'web3/eth/types'
import { TransactionReceipt } from 'web3/types'
import * as ContractList from '../contracts/index'
import { GasPriceMinimum as GasPriceMinimumType } from '../types/GasPriceMinimum'
import { GoldToken } from '../types/GoldToken'
import { StableToken } from '../types/StableToken'
import { getGasPriceMinimumContract } from './contracts'
import { getGoldTokenAddress } from './erc20-utils'
import { Logger } from './logger'

const gasInflateFactor = 1.3

export function selectContractByAddress(contracts: Contract[], address: string) {
  const addresses = contracts.map((contract) => contract.options.address)
  const index = addresses.indexOf(address)
  if (index < 0) {
    return null
  }
  return contracts[index]
}

/**
 * Util function to send a transaction and log it's progression
 * Throws error on tx failure
 *
 * TODO(ashishb): This function won't work with locally signed transactions.
 * I am not fixing it since we are going to move to contractkit soon and
 * for now, mobile app only uses sendTransactionAsync function which works
 * with locally signed transactions.
 */
// tslint:disable:ban-types
export async function sendTransaction(
  tag: string,
  name: string,
  tx: TransactionObject<any>,
  txParams: any = {},
  onTransactionHash?: Function,
  onReceipt?: Function,
  onConfirmation?: Function,
  onError?: Function
) {
  Logger.debug(`contract-utils@sendTransaction`, `${tag}/Initiating send transaction for ${name}`)

  const estGas: BigNumber = new BigNumber(
    Math.round((await tx.estimateGas({ ...txParams })) * gasInflateFactor)
  )

  Logger.debug(
    `contract-utils@sendTransaction`,
    `${tag}/Sending transaction for ${name}, with params: ${JSON.stringify({
      gas: estGas,
      ...txParams,
    })}`
  )

  return tx
    .send({
      ...txParams,
      gas: estGas.toString(),
      // Hack to prevent web3 from adding the suggested gold gas price, allowing geth to add
      // the suggested price in the selected gasCurrency.
      gasPrice: '0',
    })
    .on('transactionHash', (hash: string) => {
      Logger.debug(`${tag}/Tx hash received for ${name}`, hash)
      if (onTransactionHash) {
        onTransactionHash(hash)
      }
    })
    .on('receipt', (receipt: TransactionReceipt) => {
      Logger.debug(`contract-utils@sendTransaction`, `${tag}/Tx receipt received for ${name}`)
      if (onReceipt) {
        onReceipt(receipt)
      }
    })
    .on('confirmation', (confirmationNumber: number, receipt: TransactionReceipt) => {
      // Web3 calls this 24 times. We won't log them all
      if (confirmationNumber === 0 || confirmationNumber === 24) {
        Logger.debug(
          `contract-utils@sendTransaction`,
          `${tag}/Tx confirmation number ${confirmationNumber} received for ${name}`
        )
      }
      if (onConfirmation) {
        onConfirmation(confirmationNumber, receipt)
      }
    })
    .on('error', (error: any) => {
      Logger.error(
        `contract-utils@sendTransaction`,
        `${tag}/Tx transaction failed for ${name}, error: ${error}`
      )
      if (onError) {
        onError(error)
      }
      // When the error is thrown in here, it is not possible to catch the error
      // at all.
    })
}

export type TxLogger = (event: SendTransactionLogEvent) => void

export function emptyTxLogger(_event: SendTransactionLogEvent) {
  return
}

interface TxPromiseResolvers {
  receipt: (receipt: TransactionReceipt) => void
  transactionHash: (transactionHash: string) => void
  confirmation: (confirmation: boolean) => void
}

type PromiseRejection = (error: Error) => void
interface TxPromiseReject {
  receipt: PromiseRejection
  transactionHash: PromiseRejection
  confirmation: PromiseRejection
}

export interface TxPromises {
  receipt: Promise<TransactionReceipt>
  transactionHash: Promise<string>
  confirmation: Promise<boolean>
}

export function awaitConfirmation(txPromises: TxPromises) {
  return txPromises.confirmation
}

// Couldn't figure out how to make it generic
export type SendTransaction<T> = (
  tx: TransactionObject<any>,
  account: string,
  txId?: string
) => Promise<T>

export enum SendTransactionLogEventType {
  Started,
  EstimatedGas,
  ReceiptReceived,
  TransactionHashReceived,
  Confirmed,
  Failed,
  Exception,
}

interface Started {
  type: SendTransactionLogEventType.Started
}
const Started: Started = { type: SendTransactionLogEventType.Started }

interface Confirmed {
  type: SendTransactionLogEventType.Confirmed
}
const Confirmed: Confirmed = { type: SendTransactionLogEventType.Confirmed }

export type SendTransactionLogEvent =
  | Started
  | EstimatedGas
  | ReceiptReceived
  | TransactionHashReceived
  | Confirmed
  | Failed
  | Exception

interface EstimatedGas {
  type: SendTransactionLogEventType.EstimatedGas
  gas: number
}

function EstimatedGas(gas: number): EstimatedGas {
  return { type: SendTransactionLogEventType.EstimatedGas, gas }
}

interface ReceiptReceived {
  type: SendTransactionLogEventType.ReceiptReceived
  receipt: TransactionReceipt
}

function ReceiptReceived(receipt: TransactionReceipt): ReceiptReceived {
  return { type: SendTransactionLogEventType.ReceiptReceived, receipt }
}

interface TransactionHashReceived {
  type: SendTransactionLogEventType.TransactionHashReceived
  hash: string
}

function TransactionHashReceived(hash: string): TransactionHashReceived {
  return { type: SendTransactionLogEventType.TransactionHashReceived, hash }
}

interface Failed {
  type: SendTransactionLogEventType.Failed
  error: Error
}

function Failed(error: Error): Failed {
  return { type: SendTransactionLogEventType.Failed, error }
}

interface Exception {
  type: SendTransactionLogEventType.Exception
  error: Error
}

function Exception(error: Error): Exception {
  return { type: SendTransactionLogEventType.Exception, error }
}

async function getGasPrice(
  web3: Web3,
  gasCurrency: string | undefined
): Promise<string | undefined> {
  // Gold Token
  if (gasCurrency === undefined) {
    return String(await web3.eth.getGasPrice())
  }
  const gasPriceMinimum: GasPriceMinimumType = await getGasPriceMinimumContract(web3)
  const gasPrice: string = await gasPriceMinimum.methods.getGasPriceMinimum(gasCurrency).call()
  Logger.debug('contract-utils@getGasPrice', `Gas price is ${gasPrice}`)
  return String(parseInt(gasPrice, 10) * 10)
}

// Maps account address to current nonce. This ensures that transactions
// being sent too close to each other do not end up having the
// same nonce. This does not have to be persisted across app restarts since
// nonce calculation will be correct over the order of seconds (restart time).
const currentNonce = new Map<string, number>()

/**
 * sendTransactionAsync mainly abstracts the sending of a transaction in a promise like
 * interface. Use the higher-order sendTransactionFactory as a consumer to configure
 * logging and promise resolution
 * TODO: Should probably renamed to sendTransaction once we remove the current
 *       sendTransaction
 * @param tx The transaction object itself
 * @param account The address from which the transaction should be sent
 * @param gasCurrencyContract The contract instance of the Token in which to pay gas for
 * @param logger An object whose log level functions can be passed a function to pass
 *               a transaction ID
 */
export async function sendTransactionAsync<T>(
  tx: TransactionObject<T>,
  account: string,
  gasCurrencyContract: StableToken | GoldToken,
  logger: TxLogger = emptyTxLogger,
  estimatedGas?: number | undefined
): Promise<TxPromises> {
  // @ts-ignore
  const resolvers: TxPromiseResolvers = {}
  // @ts-ignore
  const rejectors: TxPromiseReject = {}

  const receipt: Promise<TransactionReceipt> = new Promise((resolve, reject) => {
    resolvers.receipt = resolve
    rejectors.receipt = reject
  })

  const transactionHash: Promise<string> = new Promise((resolve, reject) => {
    resolvers.transactionHash = resolve
    rejectors.transactionHash = reject
  })

  const confirmation: Promise<boolean> = new Promise((resolve, reject) => {
    resolvers.confirmation = resolve
    rejectors.confirmation = reject
  })

  const rejectAll = (error: Error) => {
    values(rejectors).map((reject) => {
      // @ts-ignore
      reject(error)
    })
  }

  try {
    logger(Started)
    const txParams: any = {
      from: account,
      gasCurrency: gasCurrencyContract._address,
      gasPrice: '0',
    }

    if (estimatedGas === undefined) {
      estimatedGas = Math.round((await tx.estimateGas(txParams)) * gasInflateFactor)
      logger(EstimatedGas(estimatedGas))
    }

    tx.send({
      from: account,
      // @ts-ignore
      gasCurrency: gasCurrencyContract._address,
      gas: estimatedGas,
      // Hack to prevent web3 from adding the suggested gold gas price, allowing geth to add
      // the suggested price in the selected gasCurrency.
      gasPrice: '0',
    })
      .on('receipt', (r: TransactionReceipt) => {
        logger(ReceiptReceived(r))
        if (resolvers.receipt) {
          resolvers.receipt(r)
        }
      })
      .on('transactionHash', (txHash: string) => {
        logger(TransactionHashReceived(txHash))

        if (resolvers.transactionHash) {
          resolvers.transactionHash(txHash)
        }
      })
      .on('confirmation', (confirmationNumber: number) => {
        if (confirmationNumber > 1) {
          // "confirmation" event is called for 24 blocks.
          // if check to avoid polluting the logs and trying to remove the standby notification more than once
          return
        }
        logger(Confirmed)

        if (resolvers.confirmation) {
          resolvers.confirmation(true)
        }
      })
      .on('error', (error: Error) => {
        logger(Failed(error))
        rejectAll(error)
      })
  } catch (error) {
    logger(Exception(error))
    rejectAll(error)
  }

  return {
    receipt,
    transactionHash,
    confirmation,
  }
}

/**
 * sendTransactionAsyncWithWeb3Signing is same as sendTransactionAsync except it fills
 * in the missing fields and locally signs the transaction. It will fail if the `from`
 * is not one of the account whose local signing keys are available. This method
 * should only be used in Zero sync (infura-like) mode where Geth is running
 * remotely.
 *
 * This separate function is temporary and contractkit uses a unified function
 * for both web3 (local) and remote (geth) siging.
 *
 * @param tx The transaction object itself
 * @param account The address from which the transaction should be sent
 * @param gasCurrencyContract The contract instance of the Token in which to pay gas for
 * @param logger An object whose log level functions can be passed a function to pass
 *               a transaction ID
 */
export async function sendTransactionAsyncWithWeb3Signing<T>(
  web3: Web3,
  tx: TransactionObject<T>,
  account: string,
  gasCurrencyContract: StableToken | GoldToken,
  logger: TxLogger = emptyTxLogger,
  estimatedGas?: number | undefined
): Promise<TxPromises> {
  const tag = 'contract-utils@sendTransactionAsyncWithWeb3Signing'
  // @ts-ignore
  const resolvers: TxPromiseResolvers = {}
  // @ts-ignore
  const rejectors: TxPromiseReject = {}

  const receipt: Promise<TransactionReceipt> = new Promise((resolve, reject) => {
    resolvers.receipt = resolve
    rejectors.receipt = reject
  })

  const transactionHash: Promise<string> = new Promise((resolve, reject) => {
    resolvers.transactionHash = resolve
    rejectors.transactionHash = reject
  })

  const confirmation: Promise<boolean> = new Promise((resolve, reject) => {
    resolvers.confirmation = resolve
    rejectors.confirmation = reject
  })

  const rejectAll = (error: Error) => {
    values(rejectors).map((reject) => {
      // @ts-ignore
      reject(error)
    })
  }

  try {
    logger(Started)
    const txParams: any = {
      from: account,
      gasCurrency: gasCurrencyContract._address,
      gasPrice: '0',
    }

    if (estimatedGas === undefined) {
      estimatedGas = Math.round((await tx.estimateGas(txParams)) * gasInflateFactor)
      logger(EstimatedGas(estimatedGas))
    }
    // Ideally, we should fill these fields in CeloProvider but as of now,
    // we don't have access to web3 inside it, so, in the short-term
    // fill the fields here.
    let gasCurrency = gasCurrencyContract._address
    const gasFeeRecipient = await web3.eth.getCoinbase()
    Logger.debug(tag, `Gas fee recipient is ${gasFeeRecipient}`)
    const gasPrice = await getGasPrice(web3, gasCurrency)
    if (gasCurrency === undefined) {
      gasCurrency = await getGoldTokenAddress(web3)
    }
    Logger.debug(tag, `Gas currency: ${gasCurrency}`)

    let recievedTxHash: string | null = null
    let alreadyInformedResolversAboutConfirmation = false
    const informAboutConfirmation = () => {
      // Don't inform more than once.
      if (alreadyInformedResolversAboutConfirmation) {
        Logger.debug(tag, `Already Informed Resolvers About Confirmation`)
        return
      }
      alreadyInformedResolversAboutConfirmation = true
      logger(Confirmed)
      if (resolvers.confirmation) {
        resolvers.confirmation(true)
      } else {
        Logger.debug(tag, 'resolver.confirmation is null')
      }
    }

    // Use pending transaction count, so that, multiple transactions can be sent without
    // waiting for the earlier ones to be confirmed.
    let nonce: number = await web3.eth.getTransactionCount(account, 'pending')
    if (!currentNonce.has(account)) {
      Logger.debug(tag, `Initializing current nonce for ${account} to ${nonce}`)
      currentNonce.set(account, nonce)
    } else if (nonce <= currentNonce.get(account)!) {
      const newNonce = currentNonce.get(account)!
      Logger.debug(
        'contract-utils@sendTransactionAsync',
        `nonce is ${nonce} which is less than existing known nonce (${currentNonce.get(
          account
        )}), setting it to ${newNonce}`
      )
      nonce = newNonce
    }
    Logger.debug(tag, `sendTransactionAsync@nonce is ${nonce}`)
    Logger.debug(tag, `sendTransactionAsync@sending from ${account}`)

    const celoTx = {
      from: account,
      nonce,
      // @ts-ignore
      gasCurrency,
      gas: estimatedGas,
      // Hack to prevent web3 from adding the suggested gold gas price, allowing geth to add
      // the suggested price in the selected gasCurrency.
      gasPrice,
      gasFeeRecipient,
    }
    // Increment and store nonce for the next call to sendTransaction.
    currentNonce.set(account, nonce + 1)
    try {
      await tx.send(celoTx)
    } catch (e) {
      Logger.debug(tag, `Ignoring error: ${util.inspect(e)}`)
      Logger.debug(tag, `error message: ${e.message}`)
      // Ideally, I want to only ignore error whose messsage contains
      // "Failed to subscribe to new newBlockHeaders" but seems like another wrapped
      // error (listed below) gets thrown and there is no way to catch that.
      // "Failed to subscribe to new newBlockHeaders" is thrown when the wallet kit is connected
      // to a remote node via https.
      // { [Error: [object Object]]
      //     line: 352771,
      //     column: 24,
      //     sourceURL: 'http://localhost:8081/index.delta?platform=android&dev=true&minify=false' }
      //     contract-utils@sendTransactionAsync: error: { [Error: Failed to subscribe to new newBlockHeaders to confi
      //     rm the transaction receipts.
      //     {
      //       "line": 352771,
      //       "column": 24,
      //       "sourceURL": "http://localhost:8081/index.delta?platform=android&dev=true&minify=false"
      //     }]
      //       line: 157373,
      //       column: 24,
      //       sourceURL: 'http://localhost:8081/index.delta?platform=android&dev=true&minify=false' }
      if (e.message.indexOf('Failed to subscribe to new newBlockHeaders') >= 0) {
        // Ignore this error
        Logger.warn(tag, `Expected error ignored: ${JSON.stringify(e)}`)
      } else {
        Logger.debug(tag, `Unexpected error ignored: ${util.inspect(e)}`)
      }
      const signedTxn = await web3.eth.signTransaction(celoTx)
      recievedTxHash = web3.utils.sha3(signedTxn.raw)
      Logger.info(tag, `Locally calculated recievedTxHash is ${recievedTxHash}`)
      logger(TransactionHashReceived(recievedTxHash))
      if (resolvers.transactionHash) {
        resolvers.transactionHash(recievedTxHash)
      }
    }
    // This code is required for infura-like setup.
    // When mobile client directly connects to the remote full node then
    // it gets `receipt` but not other notifications.
    let sleepTimeInSecs = 1
    for (let i = 0; i < 10; i++) {
      await sleep(sleepTimeInSecs * 1000)
      // Exponential backoff
      sleepTimeInSecs *= 2
      if (recievedTxHash === null) {
        continue
      }
      const txReceipt = await web3.eth.getTransactionReceipt(recievedTxHash)
      if (txReceipt === null) {
        continue
      }
      const txStatus = txReceipt.status
      Logger.info(tag, `Transaction status of hash ${recievedTxHash}: ${txStatus}`)
      if (txStatus === true) {
        informAboutConfirmation()
        break
      }
    }
  } catch (error) {
    Logger.warn(tag, `Transaction failed with error "${util.inspect(error)}"`)
    logger(Exception(error))
    rejectAll(error)
  }

  return {
    receipt,
    transactionHash,
    confirmation,
  }
}

export type CeloContract = Contract & { name: string }
export interface Contracts {
  [name: string]: CeloContract
}

export async function getContracts(web3: Web3): Promise<Contracts> {
  const contractListToExport = [
    'Attestations',
    'LockedGold',
    'Escrow',
    'Exchange',
    'GoldToken',
    'Governance',
    'Reserve',
    'SortedOracles',
    'StableToken',
    'Validators',
  ]

  const returnObj: Contracts = {}
  await Promise.all(
    Object.keys(ContractList)
      .filter((name) => contractListToExport.includes(name))
      .map(async (name) => {
        // @ts-ignore
        const instance = ContractList[name] as ContractList.StableToken
        const contract = await instance(web3)
        returnObj[name] = {
          name,
          ...contract,
        }
      })
  )

  return returnObj
}
