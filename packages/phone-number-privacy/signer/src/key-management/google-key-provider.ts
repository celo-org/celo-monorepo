import { ErrorMessage, rootLogger as logger } from '@celo/phone-number-privacy-common'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import config from '../config'
import { Key, KeyProviderBase } from './key-provider-base'

export class GoogleKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore(key: Key) {
    try {
      const { projectId, secretName, secretVersion } = config.keystore.google

      const client = new SecretManagerServiceClient()
      const [versionResponse] = await client
        .accessSecretVersion({
          name: `projects/${projectId}/secrets/${this.getCustomKeyName(key)}/versions/${
            key.version
          }`,
        })
        .catch(() =>
          client.accessSecretVersion({
            name: `projects/${projectId}/secrets/${secretName}/versions/${secretVersion}`,
          })
        )

      // Extract the payload as a string.
      const privateKey = versionResponse?.payload?.data?.toString()

      if (!privateKey) {
        throw new Error('Key is empty or undefined')
      }

      this.setPrivateKey(key, privateKey)
    } catch (err) {
      logger.info(`Error retrieving key: ${JSON.stringify(key)}`)
      logger.error(err)
      throw new Error(ErrorMessage.KEY_FETCH_ERROR)
    }
  }
}
