import { ErrorMessage, rootLogger as logger } from '@celo/phone-number-privacy-common'
import { AzureKeyVaultClient } from '@celo/wallet-hsm-azure'
import config from '../config'
import { Key, KeyProviderBase } from './key-provider-base'

export class AzureKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore(key: Key) {
    try {
      const { vaultName } = config.keystore.azure

      const keyVaultClient = new AzureKeyVaultClient(vaultName)
      const privateKey = await keyVaultClient.getSecret(
        `${this.getCustomKeyName(key)}-${key.version}`
      )
      this.setPrivateKey(key, privateKey)
    } catch (err) {
      logger.info(`Error retrieving key: ${JSON.stringify(key)}`)
      logger.error(err)
      throw new Error(ErrorMessage.KEY_FETCH_ERROR)
    }
  }
}
