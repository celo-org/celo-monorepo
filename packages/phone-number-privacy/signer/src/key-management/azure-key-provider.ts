import { AzureKeyVaultClient } from '@celo/contractkit/lib/utils/azure-key-vault-client'
import { ErrorMessage } from '@celo/phone-number-privacy-common'
import logger from '../common/logger'
import config from '../config'
import { KeyProviderBase } from './key-provider-base'

export class AzureKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore() {
    try {
      const { clientID, clientSecret, tenant, vaultName, secretName } = config.keystore.azure

      // Set environment variables for service principal auth
      // The lib relies on these
      process.env.AZURE_CLIENT_ID = clientID
      process.env.AZURE_CLIENT_SECRET = clientSecret
      process.env.AZURE_TENANT_ID = tenant

      const keyVaultClient = new AzureKeyVaultClient(vaultName)
      const privateKey = await keyVaultClient.getSecret(secretName)
      this.setPrivateKey(privateKey)
    } catch (error) {
      logger.error('Error retrieving key', error)
      throw new Error(ErrorMessage.KEY_FETCH_ERROR)
    }
  }
}
