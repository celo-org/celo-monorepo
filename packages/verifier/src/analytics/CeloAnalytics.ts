import CeloAnalytics, { AnalyzedApps } from '@celo/react-components/analytics/CeloAnalytics'
import {
  CustomEventNames,
  DefaultEventNames,
  PROPERTY_PATH_WHITELIST,
} from 'src/analytics/constants'
import Logger from 'src/utils/logger'

type EventNames = CustomEventNames | DefaultEventNames

class VerifierAnalytics extends CeloAnalytics {
  constructor() {
    // TODO Hook in Segment API secret here
    super(AnalyzedApps.Verifier, PROPERTY_PATH_WHITELIST, Logger, undefined, undefined)
  }

  track(eventName: EventNames, eventProperties: object = {}, attachDeviceInfo: boolean = false) {
    super.track(eventName, eventProperties, attachDeviceInfo)
  }
}

export default new VerifierAnalytics()
