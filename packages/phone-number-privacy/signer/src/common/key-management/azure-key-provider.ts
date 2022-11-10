import { ErrorMessage, rootLogger } from '@celo/phone-number-privacy-common'
import { AzureKeyVaultClient } from '@celo/wallet-hsm-azure'
import { config } from '../../config'
import { Key, KeyProviderBase } from './key-provider-base'

export class AzureKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore(key: Key) {
    const logger = rootLogger(config.serviceName)
    try {
      const { vaultName } = config.keystore.azure
      const client = new AzureKeyVaultClient(vaultName)

      const customKeyVersionString = this.getCustomKeyVersionString(key)
      logger.debug(`Attempting to fetch key named: ${customKeyVersionString}`)
      const privateKey = await this.fetch(client, customKeyVersionString)
      this.setPrivateKey(key, privateKey)
    } catch (err) {
      logger.info('Error retrieving key')
      logger.error(err)
      throw new Error(ErrorMessage.KEY_FETCH_ERROR)
    }
  }

  private async fetch(client: AzureKeyVaultClient, secretName: string) {
    // check for empty strings from undefined env vars
    if (!secretName) {
      throw new Error('key name is undefined')
    }

    const privateKey = await client.getSecret(secretName)

    if (!privateKey) {
      throw new Error('Key is empty or undefined')
    }

    return privateKey
  }
}
