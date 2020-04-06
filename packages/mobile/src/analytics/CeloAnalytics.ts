import CeloAnalytics, { AnalyzedApps } from '@celo/react-components/analytics/CeloAnalytics'
import {
  CustomEventNames,
  DefaultEventNames,
  PROPERTY_PATH_WHITELIST,
} from 'src/analytics/constants'
import { DEFAULT_TESTNET, SEGMENT_API_KEY } from 'src/config'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

type EventNames = CustomEventNames | DefaultEventNames

class WalletAnalytics extends CeloAnalytics {
  constructor() {
    super(AnalyzedApps.Wallet, PROPERTY_PATH_WHITELIST, Logger, SEGMENT_API_KEY, DEFAULT_TESTNET)
  }

  isEnabled() {
    // Remove __DEV__ here to test analytics in dev builds
    return !__DEV__ && store.getState().app.analyticsEnabled
  }

  track(eventName: EventNames, eventProperties: object = {}, attachDeviceInfo: boolean = false) {
    super.track(eventName, eventProperties, attachDeviceInfo)
  }
}

export default new WalletAnalytics()
