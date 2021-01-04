import { logger } from '@celo/phone-number-privacy-common'
import config, { SupportedKeystore } from '../config'
import { AWSKeyProvider } from './aws-key-provider'
import { AzureKeyProvider } from './azure-key-provider'
import { GoogleKeyProvider } from './google-key-provider'
import { KeyProvider } from './key-provider-base'
import { MockKeyProvider } from './mock-key-provider'

let keyProvider: KeyProvider

export async function initKeyProvider() {
  logger.info('Initializing keystore')
  const type = config.keystore.type
  if (type === SupportedKeystore.AzureKeyVault) {
    logger.info('Using Azure key vault')
    keyProvider = new AzureKeyProvider()
  } else if (type === SupportedKeystore.GoogleSecretManager) {
    logger.info('Using Google Secret Manager')
    keyProvider = new GoogleKeyProvider()
  } else if (type === SupportedKeystore.AWSSecretManager) {
    logger.info('Using AWS Secret Manager')
    keyProvider = new AWSKeyProvider()
  } else if (type === SupportedKeystore.MockSecretManager) {
    logger.info('Using Mock Secret Manager')
    keyProvider = new MockKeyProvider()
  } else {
    throw new Error('Valid keystore type must be provided')
  }
  logger.info('Fetching key')
  await keyProvider.fetchPrivateKeyFromStore()
  logger.info('Done fetching key. Key provider initialized successfully.')
}

export function getKeyProvider() {
  if (!keyProvider) {
    throw new Error('Key provider has not been properly initialized')
  }

  return keyProvider
}
