import CeloAnalytics, { AnalyzedApps } from '@celo/react-components/analytics/CeloAnalytics'
import {
  CustomEventNames,
  DefaultEventNames,
  PROPERTY_PATH_WHITELIST,
} from 'src/analytics/constants'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

type EventNames = CustomEventNames | DefaultEventNames

class WalletAnalytics extends CeloAnalytics {
  appName = AnalyzedApps.Wallet

  isEnabled() {
    return store.getState().app.analyticsEnabled
  }

  track(eventName: EventNames, eventProperties: object = {}, attachDeviceInfo: boolean = false) {
    super.track(eventName, eventProperties, attachDeviceInfo)
  }
}

export default new WalletAnalytics(Logger, PROPERTY_PATH_WHITELIST)
