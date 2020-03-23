import {
  ensureLeading0x,
  isHexString,
  normalizeAddressWith0x,
  trimLeading0x,
} from '@celo/utils/lib/address'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import * as ethUtil from 'ethereumjs-util'
import { EncodedTransaction, Tx } from 'web3-core'
import { Address } from '../base'
import { EIP712TypedData, generateTypedDataHash } from '../utils/sign-typed-data-utils'
import { encodeTransaction, rlpEncodedTx } from '../utils/signing-utils'
import { AppEth } from './ledger-types'
import { Wallet } from './wallet'

export const CELO_BASE_DERIVATION_PATH = "44'/52752'/0'/0"
const ADDRESS_QTY = 5

export class LedgerWallet implements Wallet {
  // Account addresses are hex-encoded, lower case alphabets
  private readonly addressDerivationPath = new Map<Address, string>()
  private addressesRetrieved = false
  private setupFinished = false
  private appEth: AppEth | undefined

  /**
   * @param derivationPathIndexes number array of "address_index" for the base derivation path.
   * Default: Array[0..9].
   * Example: [3, 99, 53] will retrieve the derivation paths of
   * [`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`]
   * @param baseDerivationPath base derivation path. Default: "44'/52752'/0'/0"
   * @param devicePath path to the ledger device, otherwise will use the first one it finds
   */
  constructor(
    readonly derivationPathIndexes: number[] = Array.from(Array(ADDRESS_QTY).keys()),
    readonly baseDerivationPath: string = CELO_BASE_DERIVATION_PATH,
    readonly devicePath: string = ''
  ) {
    const validDPs = derivationPathIndexes.reduce(
      (valid, currentValue) => valid && Number.isInteger(currentValue) && currentValue >= 0,
      true
    )
    if (!validDPs) {
      throw new Error('ledger-wallet: Invalid address index')
    }
    this.setup()
      .then(() => (this.setupFinished = true))
      .catch((error) => error)
  }

  async setup() {
    if (this.setupFinished) {
      return
    }
    if (!this.appEth) {
      const transport = await TransportNodeHid.open(this.devicePath)
      this.appEth = new AppEth(transport)
    }
    if (!this.addressesRetrieved) {
      await this.retrieveAccounts()
      this.addressesRetrieved = true
    }
    this.setupFinished = true
  }

  private async retrieveAccounts() {
    const pairAddresses = await this.retrieveAccountsFromLedger()
    pairAddresses.forEach((pair) =>
      this.addressDerivationPath.set(normalizeAddressWith0x(pair.address), pair.derivationPath)
    )
  }

  private async retrieveAccountsFromLedger() {
    const addresses = []
    // Each address must be retrieved synchronously, (ledger lock)
    for (const value of this.derivationPathIndexes) {
      const derivationPath = `${this.baseDerivationPath}/${value}`
      const addressInfo = await this.appEth!.getAddress(derivationPath)
      addresses.push({ address: addressInfo.address, derivationPath })
    }
    return addresses
  }

  private setupRequired() {
    if (!this.setupFinished) {
      throw new Error('ledger-wallet needs to run setup first')
    }
  }

  getAccounts(): Address[] {
    this.setupRequired()
    return Array.from(this.addressDerivationPath.keys())
  }

  hasAccount(address?: string) {
    this.setupRequired()
    if (address) {
      return this.addressDerivationPath.has(normalizeAddressWith0x(address))
    } else {
      return false
    }
  }

  async signTransaction(txParams: Tx): Promise<EncodedTransaction> {
    this.setupRequired()
    const rlpEncoded = rlpEncodedTx(txParams)

    const signature = await this.appEth!.signTransaction(
      this.getDerivationPathFor(txParams.from!.toString()),
      trimLeading0x(rlpEncoded.rlpEncode) // the ledger requires the rlpEncode without the leading 0x
    )
    signature.v = ensureLeading0x(signature.v)
    signature.r = ensureLeading0x(signature.r)
    signature.s = ensureLeading0x(signature.s)

    return encodeTransaction(rlpEncoded, signature)
  }

  /**
   * @param address Address of the account to sign with
   * @param data Hex string message to sign
   * @return Signature hex string (order: rsv)
   */
  async signPersonalMessage(address: string, data: string): Promise<string> {
    this.setupRequired()
    if (!isHexString(data)) {
      throw Error('ledger-wallet@signPersonalMessage: Expected data has to be an Hex String ')
    }
    const path = this.getDerivationPathFor(address)
    const sig = await this.appEth!.signPersonalMessage(path, trimLeading0x(data))

    const rpcSig = ethUtil.toRpcSig(sig.v, ethUtil.toBuffer(sig.r), ethUtil.toBuffer(sig.s))
    return rpcSig
  }

  /**
   * @param address Address of the account to sign with
   * @param data the typed data object
   * @return Signature hex string (order: rsv)
   */
  async signTypedData(address: Address, typedData: EIP712TypedData): Promise<string> {
    this.setupRequired()
    if (typedData === undefined) {
      throw Error('ledger-wallet@signTypedData: TypedData Missing')
    }
    const dataBuff = generateTypedDataHash(typedData)

    const path = this.getDerivationPathFor(address)
    const sig = await this.appEth!.signPersonalMessage(path, trimLeading0x(dataBuff.toString()))

    const rpcSig = ethUtil.toRpcSig(sig.v, ethUtil.toBuffer(sig.r), ethUtil.toBuffer(sig.s))
    return rpcSig
  }

  private getDerivationPathFor(account: Address): string {
    if (account) {
      const maybeDP = this.addressDerivationPath.get(normalizeAddressWith0x(account))
      if (maybeDP != null) {
        return maybeDP
      }
    }
    throw Error(`ledger-wallet@getDerivationPathFor: Derivation Path not found for ${account}`)
  }
}
