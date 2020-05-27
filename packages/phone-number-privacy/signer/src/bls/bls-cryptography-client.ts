import { AzureKeyVaultClient } from '@celo/contractkit/lib/utils/azure-key-vault-client'
import threshold from 'blind-threshold-bls'
import { ErrorMessages } from '../common/error-utils'
import logger from '../common/logger'
import config, { DEV_MODE, DEV_PRIVATE_KEY } from '../config'

export class BLSCryptographyClient {
  /*
   * Computes the BLS signature for the blinded phone number.
   */
  public static async computeBlindedSignature(base64BlindedMessage: string) {
    try {
      const privateKey = await BLSCryptographyClient.getPrivateKey()
      const keyBuffer = Buffer.from(privateKey, 'base64')
      const msgBuffer = Buffer.from(base64BlindedMessage, 'base64')

      logger.debug('Calling theshold sign')
      const signedMsg = threshold.signBlindedMessage(keyBuffer, msgBuffer)
      logger.debug('Back from threshold sign, parsing results')

      if (!signedMsg) {
        throw new Error('Empty threshold sign result')
      }

      return Buffer.from(signedMsg).toString('base64')
    } catch (e) {
      logger.error(ErrorMessages.SIGNATURE_COMPUTATION_FAILURE, e)
      throw e
    }
  }

  private static privateKey: string

  /**
   * Get singleton privateKey
   */
  private static async getPrivateKey(): Promise<string> {
    if (DEV_MODE) {
      return DEV_PRIVATE_KEY
    }

    if (BLSCryptographyClient.privateKey) {
      return BLSCryptographyClient.privateKey
    }

    // Set environment variables for service principal auth
    process.env.AZURE_CLIENT_ID = config.keyVault.azureClientID
    process.env.AZURE_CLIENT_SECRET = config.keyVault.azureClientSecret
    process.env.AZURE_TENANT_ID = config.keyVault.azureTenant

    const vaultName = config.keyVault.azureVaultName
    const keyVaultClient = new AzureKeyVaultClient(vaultName)
    const secretName = config.keyVault.azureSecretName
    BLSCryptographyClient.privateKey = await keyVaultClient.getSecret(secretName)
    return BLSCryptographyClient.privateKey
  }
}
