import {
  ensureLeading0x,
  isHexString,
  normalizeAddressWith0x,
  trimLeading0x,
} from '@celo/utils/lib/address'
import { TransportError, TransportStatusError } from '@ledgerhq/errors'
import Ledger from '@ledgerhq/hw-app-eth'
import debugFactory from 'debug'
import * as ethUtil from 'ethereumjs-util'
import { EncodedTransaction, Tx } from 'web3-core'
import { Address } from '../base'
import { EIP712TypedData, generateTypedDataHash } from '../utils/sign-typed-data-utils'
import {
  chainIdTransformationForSigning,
  encodeTransaction,
  rlpEncodedTx,
  signatureFormatter,
} from '../utils/signing-utils'
import { Wallet } from './wallet'

export const CELO_BASE_DERIVATION_PATH = "44'/52752'/0'/0"
const ADDRESS_QTY = 5

export enum AddressValidation {
  onlyInitialization,
  everyTransaction,
  oncePerAddress,
  never,
}

export async function newLedgerWalletWithSetup(
  transport: any,
  derivationPathIndexes?: number[],
  baseDerivationPath?: string,
  ledgerAddressValidation?: AddressValidation
): Promise<LedgerWallet> {
  const wallet = new LedgerWallet(
    derivationPathIndexes,
    baseDerivationPath,
    ledgerAddressValidation
  )
  await wallet.init(transport)
  return wallet
}

const debug = debugFactory('kit:wallet:ledger')

export class LedgerWallet implements Wallet {
  // Account addresses are hex-encoded, lower case alphabets
  private readonly addressDerivationPath = new Map<
    Address,
    { derivationPath: string; validated: boolean }
  >()
  private addressesRetrieved = false
  private setupFinished = false
  private setupLocked = false
  private ledger: any

  /**
   * @param derivationPathIndexes number array of "address_index" for the base derivation path.
   * Default: Array[0..9].
   * Example: [3, 99, 53] will retrieve the derivation paths of
   * [`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`]
   * @param baseDerivationPath base derivation path. Default: "44'/52752'/0'/0"
   */
  constructor(
    readonly derivationPathIndexes: number[] = Array.from(Array(ADDRESS_QTY).keys()),
    readonly baseDerivationPath: string = CELO_BASE_DERIVATION_PATH,
    readonly ledgerAddressValidation: AddressValidation = AddressValidation.oncePerAddress
  ) {
    const invalidDPs = derivationPathIndexes.some(
      (value) => !(Number.isInteger(value) && value >= 0)
    )
    if (invalidDPs) {
      throw new Error('ledger-wallet: Invalid address index')
    }
  }

  /**
   * @param transport Transport to connect the ledger device
   */
  async init(transport: any) {
    if (this.setupLocked) {
      throw new Error('ledger-wallet: initialization already running')
    }
    try {
      if (this.setupFinished) {
        return
      }
      this.setupLocked = true
      if (!this.ledger) {
        this.ledger = this.generateNewLedger(transport)
      }
      if (!this.addressesRetrieved) {
        debug('Fetching addresses from the ledger')
        await this.retrieveAccounts()
        this.addressesRetrieved = true
      }
      this.setupFinished = true
    } catch (error) {
      if (error instanceof TransportStatusError || error instanceof TransportError) {
        this.transportErrorFriendlyMessage(error)
      }
      throw error
    } finally {
      this.setupLocked = false
    }
  }

  // Extracted for testing purpose
  private generateNewLedger(transport: any) {
    return new Ledger(transport)
  }

  private async retrieveAccounts() {
    const pairAddresses = await this.retrieveAccountsFromLedger()
    pairAddresses.forEach((pair) =>
      this.addressDerivationPath.set(normalizeAddressWith0x(pair.address), {
        derivationPath: pair.derivationPath,
        validated: pair.validated,
      })
    )
  }

  private async retrieveAccountsFromLedger() {
    const addresses = []
    const validationRequired = this.validationRequired(false)
    // Each address must be retrieved synchronously, (ledger lock)
    for (const value of this.derivationPathIndexes) {
      const derivationPath = `${this.baseDerivationPath}/${value}`
      const addressInfo = await this.ledger!.getAddress(derivationPath, validationRequired)
      addresses.push({
        address: addressInfo.address,
        derivationPath,
        validated: validationRequired,
      })
    }
    return addresses
  }

  private validationRequired(initialized: boolean, validated?: boolean): boolean {
    if (!initialized) {
      return this.ledgerAddressValidation === AddressValidation.onlyInitialization
    }
    switch (this.ledgerAddressValidation) {
      case AddressValidation.never: {
        return false
      }
      case AddressValidation.everyTransaction: {
        return true
      }
      case AddressValidation.oncePerAddress: {
        return !validated
      }
    }
    return false
  }

  getAccounts(): Address[] {
    this.initializationRequired()
    return Array.from(this.addressDerivationPath.keys())
  }

  hasAccount(address?: string) {
    this.initializationRequired()
    if (address) {
      return this.addressDerivationPath.has(normalizeAddressWith0x(address))
    } else {
      return false
    }
  }

  async signTransaction(txParams: Tx): Promise<EncodedTransaction> {
    this.initializationRequired()
    try {
      const rlpEncoded = rlpEncodedTx(txParams)
      const path = await this.getDerivationPathFor(txParams.from!.toString())
      const signature = await this.ledger!.signTransaction(
        path,
        trimLeading0x(rlpEncoded.rlpEncode) // the ledger requires the rlpEncode without the leading 0x
      )
      // EIP155 support. check/recalc signature v value.
      const rv = parseInt(signature.v, 16)
      let cv = chainIdTransformationForSigning(rlpEncoded.transaction.chainId!)
      // tslint:disable-next-line: no-bitwise
      if (rv !== cv && (rv & cv) !== rv) {
        cv += 1 // add signature v bit.
      }
      signature.v = cv.toString(16)
      return encodeTransaction(rlpEncoded, signatureFormatter(signature))
    } catch (error) {
      if (error instanceof TransportStatusError) {
        this.transportErrorFriendlyMessage(error)
      }
      throw error
    }
  }

  /**
   * @param address Address of the account to sign with
   * @param data Hex string message to sign
   * @return Signature hex string (order: rsv)
   */
  async signPersonalMessage(address: string, data: string): Promise<string> {
    this.initializationRequired()
    try {
      if (!isHexString(data)) {
        throw Error('ledger-wallet@signPersonalMessage: Expected data has to be an Hex String ')
      }
      const path = await this.getDerivationPathFor(address)
      const sig = await this.ledger!.signPersonalMessage(path, trimLeading0x(data))
      const rpcSig = ethUtil.toRpcSig(
        sig.v,
        ethUtil.toBuffer(ensureLeading0x(sig.r)),
        ethUtil.toBuffer(ensureLeading0x(sig.s))
      )
      return rpcSig
    } catch (error) {
      if (error instanceof TransportStatusError) {
        this.transportErrorFriendlyMessage(error)
      }
      throw error
    }
  }

  /**
   * @param address Address of the account to sign with
   * @param data the typed data object
   * @return Signature hex string (order: rsv)
   */
  async signTypedData(address: Address, typedData: EIP712TypedData): Promise<string> {
    this.initializationRequired()
    try {
      if (typedData === undefined) {
        throw Error('ledger-wallet@signTypedData: TypedData Missing')
      }
      const dataBuff = generateTypedDataHash(typedData)

      const path = await this.getDerivationPathFor(address)
      const sig = await this.ledger!.signPersonalMessage(path, trimLeading0x(dataBuff.toString()))

      const rpcSig = ethUtil.toRpcSig(
        sig.v,
        ethUtil.toBuffer(ensureLeading0x(sig.r)),
        ethUtil.toBuffer(ensureLeading0x(sig.s))
      )
      return rpcSig
    } catch (error) {
      if (error instanceof TransportStatusError) {
        this.transportErrorFriendlyMessage(error)
      }
      throw error
    }
  }

  private async getDerivationPathFor(account: Address): Promise<string> {
    if (account) {
      const maybeDP = this.addressDerivationPath.get(normalizeAddressWith0x(account))
      if (maybeDP != null) {
        if (this.validationRequired(true, maybeDP.validated)) {
          await this.ledger!.getAddress(maybeDP.derivationPath, true)
          maybeDP.validated = true
        }
        return maybeDP.derivationPath
      }
    }
    throw Error(`ledger-wallet@getDerivationPathFor: Derivation Path not found for ${account}`)
  }

  private initializationRequired() {
    if (!this.setupFinished) {
      throw new Error('ledger-wallet needs to be initialized first')
    }
  }

  private transportErrorFriendlyMessage(error: any) {
    debug('Possible connection lost with the ledger')
    debug(`Error message: ${error.message}`)
    if (error.statusCode === 26368 || error.statusCode === 26628 || error.message === 'NoDevice') {
      throw new Error(
        `Possible connection lost with the ledger. Check if still on and connected. ${error.message}`
      )
    }
    throw error
  }
}
