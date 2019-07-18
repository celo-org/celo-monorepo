import CeloAnalytics, { AnalyzedApps } from '@celo/react-components/analytics/CeloAnalytics'
import {
  CustomEventNames,
  DefaultEventNames,
  PROPERTY_PATH_WHITELIST,
} from 'src/analytics/constants'
import Logger from 'src/utils/logger'

type EventNames = CustomEventNames | DefaultEventNames

class VerifierAnalytics extends CeloAnalytics {
  appName = AnalyzedApps.Verifier
  track(eventName: EventNames, eventProperties: object = {}, attachDeviceInfo: boolean = false) {
    super.track(eventName, eventProperties, attachDeviceInfo)
  }
}

export default new VerifierAnalytics(Logger, PROPERTY_PATH_WHITELIST)
