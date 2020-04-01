import { Tx } from 'web3/eth/types'
import { EncodedTransaction } from 'web3/types'
import { Address } from '../base'
import { signTransaction } from '../utils/signing-utils'
import { RemoteAKVSigner } from '../utils/signers'
import { AzureKeyVaultClient } from '../utils/azure-key-vault-client'
// @ts-ignore-next-line
import { BN } from 'bn.js'
import { Wallet } from './wallet'
import { RemoteWallet } from './remote-wallet'
import { EIP712TypedData } from '../utils/sign-typed-data-utils'

// Azure Key Vault implementation of a RemoteWallet
export class AzureHSMWallet extends RemoteWallet implements Wallet {
  private readonly keyVaultClient: AzureKeyVaultClient

  constructor(vaultName: string) {
    super()
    this.keyVaultClient = new AzureKeyVaultClient(vaultName)
  }

  protected async retrieveAccounts(): Promise<Map<Address, string>> {
    const keys = await this.keyVaultClient.getKeys()
    const addressToKeyName = new Map<Address, string>()
    keys.forEach(async (key) => {
      addressToKeyName.set(await this.getAddressFromKeyName(key), key)
    })
    return addressToKeyName
  }

  public async signTransaction(txParams: Tx): Promise<EncodedTransaction> {
    this.initializationRequired()
    const address = txParams.from!.toString()
    const keyName = this.getNativeKeyPathFor(address)
    const remoteSigner = new RemoteAKVSigner(this.keyVaultClient, keyName)
    return await signTransaction(txParams, remoteSigner)
  }

  /**
   * @param address Address of the account to sign with
   * @param data Hex string message to sign
   * @return Signature hex string (order: rsv)
   */
  async signPersonalMessage(address: string, data: string): Promise<string> {
    this.initializationRequired()

    const keyName = this.getNativeKeyPathFor(address)
    const remoteSigner = new RemoteAKVSigner(this.keyVaultClient, keyName)
    return await remoteSigner.signPersonalMessage(data)
  }

  /**
   * @param address Address of the account to sign with
   * @param data the typed data object
   * @return Signature hex string (order: rsv)
   */
  async signTypedData(address: Address, typedData: EIP712TypedData): Promise<string> {
    this.initializationRequired()

    const keyName = this.getNativeKeyPathFor(address)
    const remoteSigner = new RemoteAKVSigner(this.keyVaultClient, keyName)
    return await remoteSigner.signTypedData(typedData)
  }

  /**
   * Returns the EVM address for the given key
   * Useful for initially getting the 'from' field given a keyName
   * @param keyName Azure KeyVault key name
   */
  async getAddressFromKeyName(keyName: string): Promise<string> {
    const publicKey = await this.keyVaultClient.getPublicKey(keyName)
    return AzureKeyVaultClient.getAddressFromPublicKey(publicKey)
  }
}
