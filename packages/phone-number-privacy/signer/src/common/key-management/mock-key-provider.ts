import {
  DOMAINS_DEV_SIGNER_PRIVATE_KEY,
  PNP_DEV_SIGNER_PRIVATE_KEY,
} from '@celo/phone-number-privacy-common/lib/test/values'
import { DefaultKeyName, Key, KeyProviderBase } from './key-provider-base'

export class MockKeyProvider extends KeyProviderBase {
  constructor(
    private keyMocks: Map<Key, string> = new Map([
      [{ name: DefaultKeyName.PHONE_NUMBER_PRIVACY, version: 1 }, PNP_DEV_SIGNER_PRIVATE_KEY],
      [
        { name: DefaultKeyName.PHONE_NUMBER_PRIVACY, version: 2 },
        PNP_DEV_SIGNER_PRIVATE_KEY, // TODO(Alec) create new key shares?
      ],
      [{ name: DefaultKeyName.DOMAINS, version: 1 }, DOMAINS_DEV_SIGNER_PRIVATE_KEY],
      [
        { name: DefaultKeyName.DOMAINS, version: 2 },
        DOMAINS_DEV_SIGNER_PRIVATE_KEY, // TODO(Alec) create new key shares?
      ],
    ])
  ) {
    super()
  }

  public async fetchPrivateKeyFromStore(key: Key) {
    const keyString = this.keyMocks.get(key)
    if (keyString) {
      return this.setPrivateKey(key, keyString)
    }
    throw new Error('unknown key for MockKeyProvider')
  }
}
