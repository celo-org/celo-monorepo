import CeloAnalytics, { AnalyzedApps } from '@celo/react-components/analytics/CeloAnalytics'
import {
  CustomEventNames,
  DefaultEventNames,
  EventPropertyType,
} from '@celo/react-components/analytics/constants'
import { DEFAULT_TESTNET, SEGMENT_API_KEY } from 'src/config'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

type EventNames = CustomEventNames | DefaultEventNames

class WalletAnalytics extends CeloAnalytics {
  constructor() {
    super(AnalyzedApps.Wallet, Logger, SEGMENT_API_KEY, DEFAULT_TESTNET)
  }

  isEnabled() {
    // Remove __DEV__ here to test analytics in dev builds
    return !__DEV__ && store.getState().app.analyticsEnabled
  }

  track(
    eventName: EventNames,
    eventProperties: EventPropertyType = {},
    attachDeviceInfo: boolean = false
  ) {
    super.track(eventName, eventProperties, attachDeviceInfo)
  }

  startTracking(eventName: EventNames, eventProperties: EventPropertyType = {}) {
    super.startTracking(eventName, eventProperties)
  }

  trackSubEvent(
    eventName: EventNames,
    subEventName: EventNames,
    eventProperties: EventPropertyType = {}
  ) {
    super.trackSubEvent(eventName, subEventName, eventProperties)
  }

  stopTracking(
    eventName: EventNames,
    eventProperties: EventPropertyType = {},
    attachDeviceInfo: boolean = false
  ) {
    super.stopTracking(eventName, eventProperties, attachDeviceInfo)
  }
}

export default new WalletAnalytics()
