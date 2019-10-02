import ReactNativeLogger from '@celo/react-components/services/ReactNativeLogger'
import Analytics, { Analytics as analytics } from '@segment/analytics-react-native'
import * as Firebase from '@segment/analytics-react-native-firebase'
import * as _ from 'lodash'
import DeviceInfo from 'react-native-device-info'

const TAG = 'CeloAnalytics'

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

// Map of event name to map of subEvent name to timestamp
// Using Map to maintain insertion order
type ActiveEvents = Map<string, Map<string, number>>

class CeloAnalytics {
  readonly appName: AnalyzedApps
  readonly apiKey: string | undefined
  readonly defaultTestnet: string | undefined
  readonly propertyPathWhiteList: string[]
  readonly Logger: ReactNativeLogger
  readonly activeEvents: ActiveEvents = new Map()

  constructor(
    appName: AnalyzedApps,
    propertyPathWhiteList: string[],
    Logger: ReactNativeLogger,
    apiKey?: string,
    defaultTestnet?: string
  ) {
    this.appName = appName
    this.Logger = Logger
    this.propertyPathWhiteList = propertyPathWhiteList
    this.apiKey = apiKey
    this.defaultTestnet = defaultTestnet

    if (!apiKey) {
      Logger.debug(TAG, 'Segment API Key not present, likely due to environment. Skipping enabling')
      return
    }

    Analytics.setup(apiKey, SEGMENT_OPTIONS).catch(() => _)
    Logger.debug(TAG, 'Segment Analytics Integration initialized!')
  }

  isEnabled() {
    return true
  }

  track(eventName: string, eventProperties: {}, attachDeviceInfo = false) {
    if (!this.isEnabled()) {
      this.Logger.info(TAG, `Analytics is disabled, not tracking event ${eventName}`)
      return
    }

    this.Logger.info(TAG, `Tracking event ${eventName}`, JSON.stringify(eventProperties))

    if (!this.apiKey) {
      return
    }

    const props = this.getProps(eventProperties)
    if (attachDeviceInfo) {
      _.set(props, 'device', getDeviceInfo())
    }
    Analytics.track(eventName, props).catch((err) => {
      this.Logger.error(TAG, `Failed to tracking event ${eventName}`, err)
    })
  }

  // Used with trackSubEvent and endTracking to track durations for
  // processes with multiple steps. For one-off events, use track method
  startTracking(eventName: string) {
    this.activeEvents.set(
      eventName,
      new Map<string, number>([['__startTrackingTime__', Date.now()]])
    )
  }

  // See startTracking
  trackSubEvent(eventName: string, subEventName: string) {
    if (!this.activeEvents.has(eventName)) {
      return this.Logger.warn(TAG, 'Attempted to track sub event for invalid event. Ignoring.')
    }

    this.activeEvents.get(eventName)!.set(subEventName, Date.now())
  }

  // See startTracking
  stopTracking(eventName: string, eventProperties = {}) {
    if (!this.activeEvents.has(eventName)) {
      return
    }

    const subEvents = this.activeEvents.get(eventName)!
    if (subEvents.size === 1) {
      return this.Logger.warn(TAG, 'stopTracking called for event without subEvents. Ignoring.')
    }

    const durations: { [subEventName: string]: number } = {}
    let prevEventTime = subEvents.get('__startTrackingTime__')!
    for (const [subEventName, timestamp] of subEvents) {
      if (subEventName === '__startTrackingTime__') {
        continue
      }
      durations[subEventName] = timestamp - prevEventTime
      prevEventTime = timestamp
    }

    durations.__totalTime__ = Date.now() - subEvents.get('__startTrackingTime__')!
    this.activeEvents.delete(eventName)

    this.track(eventName, { ...eventProperties, ...durations })
  }

  page(page: string, eventProperties: {}) {
    if (!this.apiKey) {
      return
    }

    const props = this.getProps(eventProperties)
    Analytics.screen(page, props).catch((err) => {
      this.Logger.error(TAG, 'Error tracking page', err)
    })
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
      defaultTestnet: this.defaultTestnet,
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
