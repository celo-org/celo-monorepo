import { AzureKeyVaultClient } from '@celo/contractkit/lib/utils/azure-key-vault-client'
import { ErrorMessage } from '@celo/phone-number-privacy-common'
import logger from '../common/logger'
import config from '../config'
import { KeyProviderBase } from './key-provider-base'

const snooze = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class AzureKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore() {
    try {
      const { clientID, clientSecret, tenant, vaultName, secretName } = config.keystore.azure

      process.env.AZURE_CLIENT_ID = clientID
      process.env.AZURE_CLIENT_SECRET = clientSecret
      process.env.AZURE_TENANT_ID = tenant

      await snooze(30000)
      const keyVaultClient = new AzureKeyVaultClient(vaultName)
      const privateKey = await keyVaultClient.getSecret(secretName)
      this.setPrivateKey(privateKey)
    } catch (error) {
      logger.error('Error retrieving key', error)
      throw new Error(ErrorMessage.KEY_FETCH_ERROR)
    }
  }
}
