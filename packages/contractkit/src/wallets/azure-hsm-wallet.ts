import { Address } from '@celo/utils/lib/address'
import { AzureHSMSigner } from './signers/remote-azure-signer'
import { AzureKeyVaultClient } from './signers/azure-key-vault-client'
// @ts-ignore-next-line
import { BN } from 'bn.js'
import { Wallet } from './wallet'
import { RemoteWallet } from './remote-wallet'
import { Signer } from './signers/signer'
import * as ethUtil from 'ethereumjs-util'

// Azure Key Vault implementation of a RemoteWallet
export class AzureHSMWallet extends RemoteWallet implements Wallet {
  private readonly keyVaultClient: AzureKeyVaultClient

  constructor(vaultName: string) {
    super()
    this.keyVaultClient = new AzureKeyVaultClient(vaultName)
  }

  protected async loadAccountSigners(): Promise<Map<Address, Signer>> {
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

  /**
   * Returns the EVM address for the given key
   * Useful for initially getting the 'from' field given a keyName
   * @param keyName Azure KeyVault key name
   */
  async getAddressFromKeyName(keyName: string): Promise<Address> {
    const publicKey = await this.keyVaultClient.getPublicKey(keyName)
    const pkBuffer = publicKey.toBuffer()
    if (!ethUtil.isValidPublic(pkBuffer, true)) {
      throw new Error(`Invalid secp256k1 public key for keyname ${keyName}`)
    }
    const address = ethUtil.pubToAddress(pkBuffer, true)
    return '0x' + address.toString('hex')
  }
}
