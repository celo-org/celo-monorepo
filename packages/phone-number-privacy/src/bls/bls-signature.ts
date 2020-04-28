import { AzureKeyVaultClient } from '@celo/contractkit/src/utils/azure-key-vault-client'
import threshold from 'blind-threshold-bls'
import { ErrorMessages } from '../common/error-utils'
import config from '../config'

let privateKey: string

/*
 * Computes the BLS signature for the blinded phone number.
 */
export async function computeBlindedSignature(base64BlindedMessage: string) {
  try {
    if (!privateKey) {
      privateKey = await getPrivateKey()
    }
    return Buffer.from(
      threshold.sign(
        new Uint8Array(new Buffer(privateKey, 'base64')),
        new Uint8Array(new Buffer(base64BlindedMessage, 'base64'))
      )
    ).toString('base64')
  } catch (e) {
    console.error(ErrorMessages.SIGNATURE_COMPUTATION_FAILURE, e)
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
