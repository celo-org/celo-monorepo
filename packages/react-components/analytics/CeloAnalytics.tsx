import ReactNativeLogger from '@celo/react-components/services/ReactNativeLogger'
import Analytics, { Analytics as analytics } from '@segment/analytics-react-native'
import Firebase from '@segment/analytics-react-native-firebase'
import * as _ from 'lodash'
import DeviceInfo from 'react-native-device-info'

const TAG = 'CeloAnalytics'

async function getDeviceInfo() {
  return {
    AppName: DeviceInfo.getApplicationName(),
    Brand: DeviceInfo.getBrand(),
    BuildNumber: DeviceInfo.getBuildNumber(),
    BundleId: DeviceInfo.getBundleId(),
    Carrier: await DeviceInfo.getCarrier(),
    DeviceId: DeviceInfo.getDeviceId(),
    DeviceName: await DeviceInfo.getDeviceName(), // NOTE(nitya) this might contain PII, monitor
    FirstInstallTime: await DeviceInfo.getFirstInstallTime(),
    FontScale: await DeviceInfo.getFontScale(),
    FreeDiskStorage: await DeviceInfo.getFreeDiskStorage(),
    InstallReferrer: await DeviceInfo.getInstallReferrer(),
    InstanceID: await DeviceInfo.getInstanceId(),
    LastUpdateTime: await DeviceInfo.getLastUpdateTime(),
    Manufacturer: await DeviceInfo.getManufacturer(),
    MaxMemory: await DeviceInfo.getMaxMemory(),
    Model: DeviceInfo.getModel(),
    ReadableVersion: DeviceInfo.getReadableVersion(),
    SerialNumber: await DeviceInfo.getSerialNumber(),
    SystemName: DeviceInfo.getSystemName(),
    SystemVersion: DeviceInfo.getSystemVersion(),
    TotalDiskCapacity: await DeviceInfo.getTotalDiskCapacity(),
    TotalMemory: await DeviceInfo.getTotalMemory(),
    UniqueID: DeviceInfo.getUniqueId(),
    UserAgent: await DeviceInfo.getUserAgent(),
    Version: DeviceInfo.getVersion(),
    isEmulator: await DeviceInfo.isEmulator(),
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
interface SubEventData {
  timestamp: number
  subEventProps: {}
}

type ActiveEvents = Map<string, Map<string, SubEventData>>

class CeloAnalytics {
  readonly appName: AnalyzedApps
  readonly apiKey: string | undefined
  readonly defaultTestnet: string | undefined
  readonly propertyPathWhiteList: string[]
  readonly Logger: ReactNativeLogger
  readonly activeEvents: ActiveEvents = new Map()
  deviceInfo: any

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

    getDeviceInfo()
      .then((res) => (this.deviceInfo = res))
      .catch((err) => Logger.error(TAG, 'getDeviceInfo error', err))
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
      _.set(props, 'device', this.deviceInfo)
    }
    Analytics.track(eventName, props).catch((err) => {
      this.Logger.error(TAG, `Failed to track event ${eventName}`, err)
    })
  }

  // Used with trackSubEvent and endTracking to track durations for
  // processes with multiple steps. For one-off events, use track method
  // Event properties will reflect latest value provided
  startTracking(eventName: string, eventProperties = {}) {
    this.activeEvents.set(
      eventName,
      new Map<string, SubEventData>([
        ['__startTracking__', { timestamp: Date.now(), subEventProps: eventProperties }],
      ])
    )
  }

  // See startTracking
  trackSubEvent(eventName: string, subEventName: string, eventProperties = {}) {
    if (!this.activeEvents.has(eventName)) {
      return this.Logger.warn(TAG, 'Attempted to track sub event for invalid event. Ignoring.')
    }

    this.activeEvents
      .get(eventName)!
      .set(subEventName, { timestamp: Date.now(), subEventProps: eventProperties })
  }

  // See startTracking
  stopTracking(eventName: string, eventProperties = {}) {
    if (!this.activeEvents.has(eventName)) {
      return
    }

    this.activeEvents
      .get(eventName)!
      .set('__endTracking__', { timestamp: Date.now(), subEventProps: eventProperties })

    const subEvents = this.activeEvents.get(eventName)!
    const durations: { [subEventName: string]: number } = {}
    let prevEventTime = subEvents.get('__startTracking__')!.timestamp
    let eventPropsSuperSet = subEvents.get('__startTracking__')!.subEventProps

    for (const [subEventName, { timestamp, subEventProps }] of subEvents) {
      if (subEventName === '__startTracking__') {
        continue
      }

      eventPropsSuperSet = { ...eventPropsSuperSet, ...subEventProps }
      durations[subEventName] = timestamp - prevEventTime
      prevEventTime = timestamp
    }

    durations.__totalTime__ =
      subEvents.get('__endTracking__')!.timestamp - subEvents.get('__startTracking__')!.timestamp
    this.activeEvents.delete(eventName)

    this.track(eventName, { ...eventPropsSuperSet, ...durations })
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
