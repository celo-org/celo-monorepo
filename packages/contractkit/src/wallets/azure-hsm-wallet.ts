import { Address } from '@celo/utils/lib/address'
import debugFactory from 'debug'
import { AzureKeyVaultClient } from '../utils/azure-key-vault-client'
import { getAddressFromPublicKey } from '../utils/signing-utils'
import { RemoteWallet } from './remote-wallet'
import { AzureHSMSigner } from './signers/azure-hsm-signer'
import { Signer } from './signers/signer'
import { Wallet } from './wallet'

const debug = debugFactory('kit:wallet:aws-hsm-wallet')

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
    for (const key of keys) {
      try {
        const address = await this.getAddressFromKeyName(key)
        addressToSigner.set(address, new AzureHSMSigner(this.keyVaultClient, key))
      } catch (e) {
        // Safely ignore non-secp256k1 keys
        if (!e.message.includes('Invalid secp256k1')) {
          throw e
        } else {
          debug(`Ignoring non-secp256k1 key ${key}`)
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
    return getAddressFromPublicKey(publicKey)
  }
}
