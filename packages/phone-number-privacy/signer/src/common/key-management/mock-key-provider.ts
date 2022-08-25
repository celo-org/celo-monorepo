import {
  DOMAINS_DEV_SIGNER_PRIVATE_KEY,
  PNP_DEV_SIGNER_PRIVATE_KEY,
} from '@celo/phone-number-privacy-common/lib/test/values'
import { DefaultKeyName, Key, KeyProviderBase } from './key-provider-base'

export class MockKeyProvider extends KeyProviderBase {
  constructor(
    private pnpKey: string = PNP_DEV_SIGNER_PRIVATE_KEY,
    private domainsKey: string = DOMAINS_DEV_SIGNER_PRIVATE_KEY
  ) {
    super()
  }

  public async fetchPrivateKeyFromStore(key: Key) {
    switch (key.name) {
      case DefaultKeyName.PHONE_NUMBER_PRIVACY:
        this.setPrivateKey(key, this.pnpKey)
        break
      case DefaultKeyName.DOMAINS:
        this.setPrivateKey(key, this.domainsKey)
        break
      default:
        // Force tests to explicitly set the key name or modify the mock provider
        throw new Error('unknown key name for MockKeyProvider')
    }
  }
}
