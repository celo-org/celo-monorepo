import CeloAnalytics, { AnalyzedApps } from '@celo/react-components/analytics/CeloAnalytics'
import { PropertyPathWhitelist } from 'src/analytics/constants'
import { AnalyticsPropertiesList } from 'src/analytics/Properties'
import { DEFAULT_TESTNET, SEGMENT_API_KEY } from 'src/config'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

class WalletAnalytics extends CeloAnalytics {
  sessionId: string

  constructor() {
    super(AnalyzedApps.Wallet, PropertyPathWhitelist, Logger, SEGMENT_API_KEY, DEFAULT_TESTNET)
    this.sessionId = ''
  }

  isEnabled() {
    // Remove __DEV__ here to test analytics in dev builds
    return !__DEV__ && store.getState().app.analyticsEnabled
    // return store.getState().app.analyticsEnabled
  }

  track<EventName extends keyof AnalyticsPropertiesList>(
    ...args: undefined extends AnalyticsPropertiesList[EventName]
      ? [EventName] | [EventName, AnalyticsPropertiesList[EventName]]
      : [EventName, AnalyticsPropertiesList[EventName]]
  ) {
    const [eventName, eventProperties] = args
    const attachDeviceInfo = false
    super.track(eventName, eventProperties, attachDeviceInfo)
  }
}

export default new WalletAnalytics()
