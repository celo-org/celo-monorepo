import {
  DOMAINS_DEV_SIGNER_PRIVATE_KEY,
  PNP_DEV_SIGNER_PRIVATE_KEY,
} from '@celo/phone-number-privacy-common/lib/test/values'
import { DefaultKeyName, Key, KeyProviderBase } from './key-provider-base'

export class MockKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore(key: Key) {
    switch (key.name) {
      case DefaultKeyName.PHONE_NUMBER_PRIVACY:
        this.setPrivateKey(key, PNP_DEV_SIGNER_PRIVATE_KEY)
        break
      case DefaultKeyName.DOMAINS:
        this.setPrivateKey(key, DOMAINS_DEV_SIGNER_PRIVATE_KEY)
        break
      default:
        // Force tests to explicitly set the key name or modify the mock provider
        throw new Error('unknown key name for MockKeyProvider')
    }
  }
}
