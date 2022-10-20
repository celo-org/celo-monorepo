import {
  DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V1,
  DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V2,
  DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V3,
  PNP_THRESHOLD_DEV_PK_SHARE_1_V1,
  PNP_THRESHOLD_DEV_PK_SHARE_1_V2,
  PNP_THRESHOLD_DEV_PK_SHARE_1_V3,
} from '@celo/phone-number-privacy-common/lib/test/values'
import { DefaultKeyName, Key, KeyProviderBase } from './key-provider-base'

export class MockKeyProvider extends KeyProviderBase {
  // prettier-ignore
  constructor(
    private keyMocks: Map<string, string> = new Map([
      [
        `${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`, 
        PNP_THRESHOLD_DEV_PK_SHARE_1_V1
      ],
      [
        `${DefaultKeyName.PHONE_NUMBER_PRIVACY}-2`,
        PNP_THRESHOLD_DEV_PK_SHARE_1_V2,
      ],
      [
        `${DefaultKeyName.PHONE_NUMBER_PRIVACY}-3`, 
        PNP_THRESHOLD_DEV_PK_SHARE_1_V3
      ],
      [ 
        `${DefaultKeyName.DOMAINS}-1`, 
        DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V1
      ],
      [
        `${DefaultKeyName.DOMAINS}-2`,
        DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V2,
      ],
      [ 
        `${DefaultKeyName.DOMAINS}-3`, 
        DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V3
      ],
    ])
  ) {
    super()
  }

  public async fetchPrivateKeyFromStore(key: Key) {
    const keyString = this.keyMocks.get(this.getCustomKeyVersionString(key))
    if (keyString) {
      return this.setPrivateKey(key, keyString)
    }
    throw new Error('unknown key for MockKeyProvider')
  }
}
