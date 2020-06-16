import { SecretsManager } from 'aws-sdk'
import { ErrorMessages } from '../common/error-utils'
import logger from '../common/logger'
import config from '../config'
import { KeyProviderBase } from './key-provider-base'

export class AWSKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore() {
    try {
      // Credentials are managed by AWS client as described in https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html
      const { region, secretName, secretKey } = config.keystore.aws

      const client = new SecretsManager({ region })

      client.config.update({ region })

      const privateKeyResponse = await client
        .getSecretValue({
          SecretId: secretName,
        })
        .promise()

      const privateKey = JSON.parse(privateKeyResponse.SecretString || '{}')[secretKey]

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
