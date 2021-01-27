import { DEV_PRIVATE_KEY } from '../config'
import { KeyProviderBase } from './key-provider-base'

export class MockKeyProvider extends KeyProviderBase {
  public async fetchPrivateKeyFromStore() {
    this.setPrivateKey(DEV_PRIVATE_KEY)
  }
}
