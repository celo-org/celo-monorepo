import { AzureKeyVaultClient } from '@celo/contractkit/lib/utils/azure-key-vault-client'
import { ErrorMessage } from '@celo/phone-number-privacy-common'
import logger from '../common/logger'
import config from '../config'
import { KeyProviderBase } from './key-provider-base'

export class AzureKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore() {
    try {
      const { vaultName, secretName } = config.keystore.azure

      const keyVaultClient = new AzureKeyVaultClient(vaultName)
      const privateKey = await keyVaultClient.getSecret(secretName)
      this.setPrivateKey(privateKey)
    } catch (error) {
      logger.error('Error retrieving key', error)
      throw new Error(ErrorMessage.KEY_FETCH_ERROR)
    }
  }
}
