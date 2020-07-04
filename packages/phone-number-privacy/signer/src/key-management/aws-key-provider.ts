import { SecretsManager } from 'aws-sdk'
import { ErrorMessage } from '../common/error-utils'
import logger from '../common/logger'
import config from '../config'
import { KeyProviderBase } from './key-provider-base'

interface SecretStringResult {
  [key: string]: string
}

export class AWSKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore() {
    try {
      // Credentials are managed by AWS client as described in https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html
      const { region, secretName, secretKey } = config.keystore.aws

      const client = new SecretsManager({ region })
      client.config.update({ region })

      const response = await client
        .getSecretValue({
          SecretId: secretName,
        })
        .promise()

      let privateKey
      if (response.SecretString) {
        privateKey = this.tryParseSecretString(response.SecretString, secretKey)
      } else if (response.SecretBinary) {
        // @ts-ignore AWS sdk typings not quite correct
        const buff = new Buffer(response.SecretBinary, 'base64')
        privateKey = buff.toString('ascii')
      } else {
        throw new Error('Response has neither string nor binary')
      }

      if (!privateKey) {
        throw new Error('Secret is empty or undefined')
      }
      this.setPrivateKey(privateKey)
    } catch (error) {
      logger.error('Error retrieving key', error)
      throw new Error(ErrorMessage.KEY_FETCH_ERROR)
    }
  }

  private tryParseSecretString(secretString: string, key: string) {
    if (!secretString) {
      throw new Error('Cannot parse empty string')
    }
    if (!key) {
      throw new Error('Cannot parse secret without key')
    }

    try {
      const secret = JSON.parse(secretString) as SecretStringResult
      return secret[key]
    } catch (e) {
      throw new Error('Expecting JSON, secret string is not valid JSON')
    }
  }
}
