import config, { SupportedKeystore } from '../config'
import { AzureKeyProvider } from './azure-key-provider'
import { GoogleKeyProvider } from './google-key-provider'
import { KeyProvider } from './key-provider-base'

let keyProvider: KeyProvider

export function getKeyProvider() {
  if (keyProvider) {
    return keyProvider
  }

  const type = config.keystore.type
  if (type === SupportedKeystore.AzureKeyVault) {
    keyProvider = new AzureKeyProvider()
  } else if (type === SupportedKeystore.GoogleSecretManager) {
    keyProvider = new GoogleKeyProvider()
  } else {
    throw new Error('Valid keystore type must be provided')
  }
  return keyProvider
}
