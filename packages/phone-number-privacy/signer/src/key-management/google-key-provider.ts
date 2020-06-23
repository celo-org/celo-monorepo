import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { ErrorMessages } from '../common/error-utils'
import logger from '../common/logger'
import config from '../config'
import { KeyProviderBase } from './key-provider-base'

export class GoogleKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore() {
    try {
      const { projectId, secretName, secretVersion } = config.keystore.google

      const client = new SecretManagerServiceClient()
      const [version] = await client.accessSecretVersion({
        name: `projects/${projectId}/secrets/${secretName}/versions/${secretVersion}`,
      })

      // Extract the payload as a string.
      const privateKey = version?.payload?.data?.toString()

      if (!privateKey) {
        throw new Error('Key is empty or undefined')
      }

      this.setPrivateKey(privateKey)
    } catch (error) {
      logger.error('Error retrieving key', error)
      throw new Error(ErrorMessages.KEY_FETCH_ERROR)
    }
  }
}
