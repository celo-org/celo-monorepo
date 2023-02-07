import { ErrorMessage, rootLogger } from '@celo/phone-number-privacy-common'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager/build/src/v1'
import { config } from '../../config'
import { Key, KeyProviderBase } from './key-provider-base'

export class GoogleKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore(key: Key) {
    const logger = rootLogger(config.serviceName)
    try {
      const { projectId } = config.keystore.google
      const client = new SecretManagerServiceClient()

      const customKeyName = this.getCustomKeyName(key)
      const keyVersion = key.version.toString()
      logger.debug(`Attempting to fetch key named: ${customKeyName}, version: ${keyVersion}`)
      const privateKey = await this.fetch(client, projectId, customKeyName, keyVersion)
      this.setPrivateKey(key, privateKey)
    } catch (err) {
      logger.info('Error retrieving key')
      logger.error(err)
      throw new Error(ErrorMessage.KEY_FETCH_ERROR)
    }
  }

  private async fetch(
    client: SecretManagerServiceClient,
    projectId: string,
    secretName: string,
    secretVersion: string
  ) {
    // check for empty strings from undefined env vars
    if (!(projectId && secretName && secretVersion)) {
      throw new Error('key name is undefined')
    }
    const secretID = `projects/${projectId}/secrets/${secretName}/versions/${secretVersion}`
    const [versionResponse] = await client.accessSecretVersion({ name: secretID })

    // Extract the payload as a string.
    const privateKey = versionResponse?.payload?.data?.toString()

    if (!privateKey) {
      throw new Error('Key is empty or undefined')
    }

    return privateKey
  }
}
