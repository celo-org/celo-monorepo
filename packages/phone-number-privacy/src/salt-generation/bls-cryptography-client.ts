import { AzureKeyVaultClient } from '@celo/contractkit/src/utils/azure-key-vault-client'
import { BLINDBLS } from 'bls12377js-blind'
import config from '../config'

export class BLSCryptographyClient {
  /*
   * Computes the BLS Salt for the blinded phone number.
   */
  public static async computeBLSSalt(queryPhoneNumber: string) {
    try {
      const privateKey = await BLSCryptographyClient.getPrivateKey()
      const pkBuff = new Buffer(privateKey)
      return BLINDBLS.computePRF(pkBuff, new Buffer(queryPhoneNumber))
    } catch (e) {
      console.error('Failed to compute salt', e)
      throw e
    }
  }

  private static privateKey: string

  /**
   * Get singleton privateKey
   */
  private static async getPrivateKey(): Promise<string> {
    if (BLSCryptographyClient.privateKey) {
      return BLSCryptographyClient.privateKey
    }

    const vaultName = config.keyVault.azureVaultName
    const keyVaultClient = new AzureKeyVaultClient(vaultName)
    const secretName = config.keyVault.azureSecretName
    return keyVaultClient.getSecret(secretName)
  }
}
