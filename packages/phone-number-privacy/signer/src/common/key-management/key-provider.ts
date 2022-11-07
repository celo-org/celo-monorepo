import { rootLogger } from '@celo/phone-number-privacy-common'
import { SignerConfig, SupportedKeystore } from '../../config'
import { AWSKeyProvider } from './aws-key-provider'
import { AzureKeyProvider } from './azure-key-provider'
import { GoogleKeyProvider } from './google-key-provider'
import { DefaultKeyName, Key, KeyProvider } from './key-provider-base'
import { MockKeyProvider } from './mock-key-provider'

export function keysToPrefetch(config: SignerConfig): Key[] {
  return [
    {
      name: DefaultKeyName.PHONE_NUMBER_PRIVACY,
      version: config.keystore.keys.phoneNumberPrivacy.latest,
    },
    {
      name: DefaultKeyName.DOMAINS,
      version: config.keystore.keys.domains.latest,
    },
  ]
}

export async function initKeyProvider(config: SignerConfig): Promise<KeyProvider> {
  const logger = rootLogger(config.serviceName)
  logger.info('Initializing keystore')
  const type = config.keystore.type

  let keyProvider: KeyProvider

  if (type === SupportedKeystore.AZURE_KEY_VAULT) {
    logger.info('Using Azure key vault')
    keyProvider = new AzureKeyProvider()
  } else if (type === SupportedKeystore.GOOGLE_SECRET_MANAGER) {
    logger.info('Using Google Secret Manager')
    keyProvider = new GoogleKeyProvider()
  } else if (type === SupportedKeystore.AWS_SECRET_MANAGER) {
    logger.info('Using AWS Secret Manager')
    keyProvider = new AWSKeyProvider()
  } else if (type === SupportedKeystore.MOCK_SECRET_MANAGER) {
    logger.info('Using Mock Secret Manager')
    keyProvider = new MockKeyProvider()
  } else {
    throw new Error('Valid keystore type must be provided')
  }

  logger.info(`Fetching keys: ${JSON.stringify(keysToPrefetch(config))}`)
  await Promise.all(
    keysToPrefetch(config).map(keyProvider.fetchPrivateKeyFromStore.bind(keyProvider))
  )
  logger.info('Done fetching key. Key provider initialized successfully.')

  return keyProvider
}
