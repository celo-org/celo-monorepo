import * as ethUtil from 'ethereumjs-util'
import Web3 from 'web3'
import { PartialTxParams } from './missing-tx-params-populator'
import { EIP712TypedData, generateTypedDataHash } from './sign_typed_data_utils'
import { signTransaction } from './signing-utils'

export interface IWallet {
  addAccount: (privateKey: string) => void
  getAccounts: () => string[]
  hasAccount: (address: string) => boolean
  signTransactionAsync: (txParams: PartialTxParams) => Promise<string>
  signTypedDataAsync: (address: string, typedData: EIP712TypedData) => Promise<string>
  signPersonalMessageAsync: (data: string, address: string) => Promise<string>
}

export class Wallet implements IWallet {
  // Account addresses are hex-encoded, lower case alphabets
  private readonly accountAddressToPrivateKey = new Map<string, string>()

  addAccount(privateKey: string) {
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    privateKey = '0x' + this.getPrivateKeyWithout0xPrefix(privateKey)
    const accountAddress = this.generateAccountAddressFromPrivateKey(privateKey).toLowerCase()
    if (this.accountAddressToPrivateKey.has(accountAddress)) {
      return
    }
    this.accountAddressToPrivateKey.set(accountAddress, privateKey)
  }

  getAccounts(): string[] {
    // TODO FORWARD also to node
    return Array.from(this.accountAddressToPrivateKey.keys())
  }

  hasAccount(address: string) {
    return this.accountAddressToPrivateKey.has(address)
  }

  async signTransactionAsync(txParams: PartialTxParams): Promise<string> {
    const signedTx = await signTransaction(txParams, this.getPrivateKeyFor(txParams.from))
    const rawTransaction = signedTx.rawTransaction.toString('hex')
    return rawTransaction
  }

  /**
   * Sign a personal Ethereum signed message. The signing address will be calculated from the private key.
   * The address must be provided it must match the address calculated from the private key.
   * If you've added this Subprovider to your app's provider, you can simply send an `eth_sign`
   * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
   * If you are not using this via a ProviderEngine instance, you can call it directly.
   * @param data Hex string message to sign
   * @param address Address of the account to sign with
   * @return Signature hex string (order: rsv)
   */
  async signPersonalMessageAsync(data: string, address: string): Promise<string> {
    // TODO add @celo/utils check hex string
    // assert.isHexString('data', data)

    const dataBuff = ethUtil.toBuffer(data)
    const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)
    const pk = this.getPrivateKeyFor(address)
    const pkBuffer = Buffer.from(pk, 'hex')

    const sig = ethUtil.ecsign(msgHashBuff, pkBuffer)
    const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s)
    return rpcSig
  }

  /**
   * Sign an EIP712 Typed Data message. The signing address will be calculated from the private key.
   * The address must be provided it must match the address calculated from the private key.
   * If you've added this Subprovider to your app's provider, you can simply send an `eth_signTypedData`
   * JSON RPC request, and this method will be called auto-magically.
   * If you are not using this via a ProviderEngine instance, you can call it directly.
   * @param address Address of the account to sign with
   * @param data the typed data object
   * @return Signature hex string (order: rsv)
   */
  async signTypedDataAsync(address: string, typedData: EIP712TypedData): Promise<string> {
    if (typedData === undefined) {
      throw new Error('TypedData Missing')
    }
    const pk = this.getPrivateKeyFor(address)
    const pkBuffer = Buffer.from(pk, 'hex')

    const dataBuff = generateTypedDataHash(typedData)
    const sig = ethUtil.ecsign(dataBuff, pkBuffer)
    const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s)
    return rpcSig
  }

  private getPrivateKeyFor(account: string): string {
    if (account) {
      const maybePk = this.accountAddressToPrivateKey.get(account.toLowerCase())
      if (maybePk != null) {
        return maybePk
      }
    }
    throw new Error(`tx-signing@getPrivateKey: ForPrivate key not found for ${account}`)
  }

  private getPrivateKeyWithout0xPrefix(privateKey: string) {
    return privateKey.toLowerCase().startsWith('0x') ? privateKey.substring(2) : privateKey
  }

  private generateAccountAddressFromPrivateKey(privateKey: string): string {
    if (!privateKey.toLowerCase().startsWith('0x')) {
      privateKey = '0x' + privateKey
    }
    return new Web3().eth.accounts.privateKeyToAccount(privateKey).address
  }
}
