import { SecretsManager } from 'aws-sdk'
import { ErrorMessages } from '../common/error-utils'
import logger from '../common/logger'
import { KeyProviderBase } from './key-provider-base'

export class AWSKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore() {
    try {
      // Use credentials from IAM role
      const region = process.env.KEYSTORE_AWS_REGION || 'us-east-1'
      const secretName = process.env.KEYSTORE_AWS_SECRET_NAME || 'signer-key'
      const secretKey = process.env.KEYSTORE_AWS_SECRET_KEY || 'key'

      const client = new SecretsManager({ region })

      client.config.update({ region })

      const privateKey = await client
        .getSecretValue({
          SecretId: secretName,
        })
        .promise()

      if (!privateKey.SecretString || !JSON.parse(privateKey.SecretString)[secretKey]) {
        throw new Error('Key is empty or undefined')
      }

      this.setPrivateKey(JSON.parse(privateKey.SecretString)[secretKey])
    } catch (error) {
      logger.error('Error retrieving key', error)
      throw new Error(ErrorMessages.KEY_FETCH_ERROR)
    }
  }
}
