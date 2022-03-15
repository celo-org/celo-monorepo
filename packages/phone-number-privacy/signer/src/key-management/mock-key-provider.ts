import { Key, KeyProviderBase } from './key-provider-base'

export class MockKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore(key: Key) {
    this.setPrivateKey(key, DEV_PRIVATE_KEY)
  }
}
