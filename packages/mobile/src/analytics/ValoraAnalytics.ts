import Analytics, { Analytics as analytics } from '@segment/analytics-react-native'
import Firebase from '@segment/analytics-react-native-firebase'
import DeviceInfo from 'react-native-device-info'
import { AppEvents } from 'src/analytics/Events'
import { AnalyticsPropertiesList } from 'src/analytics/Properties'
import { SEGMENT_API_KEY } from 'src/config'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'
import * as Web3Utils from 'web3-utils'

const TAG = 'ValoraAnalytics'

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

class ValoraAnalytics {
  sessionId: string
  address: string | null | undefined
  deviceInfo: object

  constructor() {
    this.sessionId = ''
    this.deviceInfo = {}

    if (!SEGMENT_API_KEY) {
      Logger.debug(TAG, 'Segment API Key not present, likely due to environment. Skipping enabling')
      return
    }

    Analytics.setup(SEGMENT_API_KEY, SEGMENT_OPTIONS).catch((error) =>
      Logger.debug(TAG, `Segment setup error: ${error.message}\n`, error)
    )
    Logger.debug(TAG, 'Segment Analytics Integration initialized!')

    getDeviceInfo()
      .then((res) => {
        this.deviceInfo = res
        this.sessionId = Web3Utils.soliditySha3({
          type: 'string',
          value: res.SerialNumber || res.DeviceId,
        }).slice(2)
      })
      .catch((err) => Logger.error(TAG, 'getDeviceInfo error', err))
  }

  isEnabled() {
    // Remove __DEV__ here to test analytics in dev builds
    return !__DEV__ && store.getState().app.analyticsEnabled
    // return store.getState().app.analyticsEnabled
  }

  startSession(
    eventName: typeof AppEvents.app_launched,
    eventProperties: AnalyticsPropertiesList[AppEvents.app_launched]
  ) {
    this.track(eventName, {
      deviceInfo: this.deviceInfo,
      ...eventProperties,
    })
  }

  track<EventName extends keyof AnalyticsPropertiesList>(
    ...args: undefined extends AnalyticsPropertiesList[EventName]
      ? [EventName] | [EventName, AnalyticsPropertiesList[EventName]]
      : [EventName, AnalyticsPropertiesList[EventName]]
  ) {
    const [eventName, eventProperties] = args

    if (!this.isEnabled()) {
      Logger.info(TAG, `Analytics is disabled, not tracking event ${eventName}`)
      return
    }

    Logger.info(TAG, `Tracking event ${eventName}`, JSON.stringify(eventProperties))

    if (!SEGMENT_API_KEY) {
      return
    }

    const props: {} = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      address: this.address,
      ...eventProperties,
    }

    Analytics.track(eventName, props).catch((err) => {
      Logger.error(TAG, `Failed to track event ${eventName}`, err)
    })
  }

  page(page: string, eventProperties = {}) {
    if (!SEGMENT_API_KEY) {
      return
    }

    Analytics.screen(page, eventProperties).catch((err) => {
      Logger.error(TAG, 'Error tracking page', err)
    })
  }
}

export default new ValoraAnalytics()
