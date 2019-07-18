import { DEFAULT_TESTNET, SEGMENT_API_KEY } from '@celo/mobile/src/config'
import ReactNativeLogger from '@celo/react-components/services/ReactNativeLogger'
import Analytics, { Analytics as analytics } from '@segment/analytics-react-native'
import * as Firebase from '@segment/analytics-react-native-firebase'
import * as _ from 'lodash'
import DeviceInfo from 'react-native-device-info'

function getDeviceInfo() {
  return {
    AppName: DeviceInfo.getApplicationName(),
    Brand: DeviceInfo.getBrand(),
    BuildNumber: DeviceInfo.getBuildNumber(),
    BundleId: DeviceInfo.getBundleId(),
    Carrier: DeviceInfo.getCarrier(),
    DeviceCountry: DeviceInfo.getDeviceCountry(),
    DeviceId: DeviceInfo.getDeviceId(),
    DeviceLocale: DeviceInfo.getDeviceLocale(),
    DeviceName: DeviceInfo.getDeviceName(), // NOTE(nitya) this might contain PII, monitor
    FirstInstallTime: DeviceInfo.getFirstInstallTime(),
    FontScale: DeviceInfo.getFontScale(),
    FreeDiskStorage: DeviceInfo.getFreeDiskStorage(),
    InstallReferrer: DeviceInfo.getInstallReferrer(),
    InstanceID: DeviceInfo.getInstanceID(),
    LastUpdateTime: DeviceInfo.getLastUpdateTime(),
    Manufacturer: DeviceInfo.getManufacturer(),
    MaxMemory: DeviceInfo.getMaxMemory(),
    Model: DeviceInfo.getModel(),
    ReadableVersion: DeviceInfo.getReadableVersion(),
    SerialNumber: DeviceInfo.getSerialNumber(),
    SystemName: DeviceInfo.getSystemName(),
    SystemVersion: DeviceInfo.getSystemVersion(),
    Timezone: DeviceInfo.getTimezone(),
    TotalDiskCapacity: DeviceInfo.getTotalDiskCapacity(),
    TotalMemory: DeviceInfo.getTotalMemory(),
    UniqueID: DeviceInfo.getUniqueID(),
    UserAgent: DeviceInfo.getUserAgent(),
    Version: DeviceInfo.getVersion(),
    isEmulator: DeviceInfo.isEmulator(),
    isTablet: DeviceInfo.isTablet(),
  }
}

const SEGMENT_OPTIONS: analytics.Configuration = {
  using: [Firebase],
  flushAt: 20,
  trackAttributionData: false,
  debug: __DEV__,
  trackAppLifecycleEvents: true,
  recordScreenViews: true,
  ios: {
    trackAdvertising: false,
    trackDeepLinks: true,
  },
}

export enum AnalyzedApps {
  Wallet = 'Wallet',
  Verifier = 'Verifier',
}

class CeloAnalytics {
  appName: AnalyzedApps | undefined
  readonly propertyPathWhiteList: string[]
  readonly Logger: ReactNativeLogger
  constructor(Logger: ReactNativeLogger, propertyPathWhiteList: string[]) {
    this.Logger = Logger
    this.propertyPathWhiteList = propertyPathWhiteList
    if (!SEGMENT_API_KEY) {
      Logger.debug(
        'CeloAnalytics/constructor',
        'Segment API Key not present, likely due to environment. Skipping enabling'
      )
      return
    }
    Analytics.setup(SEGMENT_API_KEY, SEGMENT_OPTIONS).catch(() => _)
    Logger.debug('CeloAnalytics/constructor', 'Segment Analytics Integration initialized!')
  }

  isEnabled() {
    return true
  }

  track(eventName: string, eventProperties: {}, attachDeviceInfo = false) {
    if (!this.isEnabled()) {
      this.Logger.info(
        'CeloAnalytics/track',
        `Analytics is disabled, not tracking event ${eventName}`
      )
      return
    }
    if (!SEGMENT_API_KEY) {
      return
    }

    try {
      this.Logger.info('CeloAnalytics/track', `Attempting to tracking event ${eventName}`)
      const props = this.getProps(eventProperties)
      if (attachDeviceInfo) {
        _.set(props, 'device', getDeviceInfo())
      }
      Analytics.track(eventName, props)
    } catch (err) {
      this.Logger.error('CeloAnalytics/track', `Failed to tracking event ${eventName}`, err)
    }
  }

  page(page: string, eventProperties: {}) {
    if (!SEGMENT_API_KEY) {
      return
    }

    try {
      const props = this.getProps(eventProperties)
      Analytics.screen(page, props)
    } catch (err) {
      this.Logger.error('CeloAnalytics/page', err)
    }
  }

  applyWhitelist(allProps: {}) {
    const whitelistedProps = {}
    _.each(this.propertyPathWhiteList, (path: string) => {
      if (!_.has(allProps, path)) {
        return
      }
      _.set(whitelistedProps, path, _.get(allProps, path))
    })
    return whitelistedProps
  }

  private getProps(eventProperties: {}): {} {
    const whitelistedProperties = this.applyWhitelist(eventProperties)
    const baseProps = {
      appName: this.appName,
      timestamp: Date.now(),
      defaultTestnet: DEFAULT_TESTNET,
    }
    if (_.isEmpty(whitelistedProperties)) {
      return baseProps
    }
    return {
      ...whitelistedProperties,
      ...baseProps,
    }
  }
}

export default CeloAnalytics
