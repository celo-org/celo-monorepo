import { AzureKeyVaultClient } from '@celo/contractkit/src/utils/azure-key-vault-client'
import threshold from 'blind-threshold-bls'
import { ErrorMessages } from '../common/error-utils'
import logger from '../common/logger'
import config from '../config'

let privateKey: string

/*
 * Computes the BLS signature for a blinded message (e.g. phone number).
 */
export async function computeBlindedSignature(base64BlindedMessage: string) {
  try {
    logger.debug('b64 blinded msg', base64BlindedMessage)
    if (!privateKey) {
      privateKey = await getPrivateKey()
    }
    const keyBuffer = Buffer.from(privateKey, 'base64')
    const msgBuffer = Buffer.from(base64BlindedMessage, 'base64')

    logger.debug('Calling theshold sign')
    const signedMsg = threshold.sign(keyBuffer, msgBuffer)
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

/**
 * Get privateKey from KeyVault
 */
async function getPrivateKey(): Promise<string> {
  // Set environment variables for service principal auth
  process.env.AZURE_CLIENT_ID = config.keyVault.azureClientID
  process.env.AZURE_CLIENT_SECRET = config.keyVault.azureClientSecret
  process.env.AZURE_TENANT_ID = config.keyVault.azureTenant

  const vaultName = config.keyVault.azureVaultName
  const keyVaultClient = new AzureKeyVaultClient(vaultName)
  const secretName = config.keyVault.azureSecretName
  return keyVaultClient.getSecret(secretName)
}
