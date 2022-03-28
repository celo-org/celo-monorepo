import { Key, KeyProviderBase } from './key-provider-base'

export class MockKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore(key: Key) {
    this.setPrivateKey(key, DEV_PRIVATE_KEY) // @victor I can't remember why we deleted DEV_PRIVATE_KEY, do you?
  }
}
