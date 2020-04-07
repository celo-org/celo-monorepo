import { Address, ensureLeading0x } from '@celo/utils/lib/address'
import { AzureHSMSigner } from './signers/azure-hsm-signer'
import { AzureKeyVaultClient } from './signers/azure-key-vault-client'
import { Wallet } from './wallet'
import { RemoteWallet } from './remote-wallet'
import { Signer } from './signers/signer'
import * as ethUtil from 'ethereumjs-util'

// Azure Key Vault implementation of a RemoteWallet
export class AzureHSMWallet extends RemoteWallet implements Wallet {
  private readonly vaultName: string
  private keyVaultClient: AzureKeyVaultClient | undefined

  constructor(vaultName: string) {
    super()
    this.vaultName = vaultName
  }

  protected async loadAccountSigners(): Promise<Map<Address, Signer>> {
    if (!this.keyVaultClient) {
      this.keyVaultClient = this.generateNewKeyVaultClient(this.vaultName)
    }
    const keys = await this.keyVaultClient.getKeys()
    const addressToSigner = new Map<Address, Signer>()
    for (let key of keys) {
      try {
        const address = await this.getAddressFromKeyName(key)
        addressToSigner.set(address, new AzureHSMSigner(this.keyVaultClient, key))
      } catch (e) {
        // Safely ignore non-secp256k1 keys
        const message = e.message
        if (!message.includes('Invalid secp256k1')) {
          throw e
        }
      }
    }
    return addressToSigner
  }

  // Extracted for testing purpose
  private generateNewKeyVaultClient(vaultName: string) {
    return new AzureKeyVaultClient(vaultName)
  }

  /**
   * Returns the EVM address for the given key
   * Useful for initially getting the 'from' field given a keyName
   * @param keyName Azure KeyVault key name
   */
  async getAddressFromKeyName(keyName: string): Promise<Address> {
    if (!this.keyVaultClient) {
      throw new Error('AzureHSMWallet needs to be initialized first')
    }
    const publicKey = await this.keyVaultClient!.getPublicKey(keyName)
    const pkBuffer = publicKey.toBuffer()
    if (!ethUtil.isValidPublic(pkBuffer, true)) {
      throw new Error(`Invalid secp256k1 public key for keyname ${keyName}`)
    }
    const address = ethUtil.pubToAddress(pkBuffer, true)
    return ensureLeading0x(address.toString('hex'))
  }
}
