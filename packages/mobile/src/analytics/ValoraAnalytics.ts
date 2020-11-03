import Analytics, { Analytics as analytics } from '@segment/analytics-react-native'
import Firebase from '@segment/analytics-react-native-firebase'
import { sha256 } from 'ethereumjs-util'
import DeviceInfo from 'react-native-device-info'
import { AppEvents } from 'src/analytics/Events'
import { AnalyticsPropertiesList } from 'src/analytics/Properties'
import { DEFAULT_TESTNET, SEGMENT_API_KEY } from 'src/config'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

const TAG = 'ValoraAnalytics'

async function getDeviceInfo() {
  return {
    AppName: DeviceInfo.getApplicationName(),
    Brand: DeviceInfo.getBrand(),
    BuildNumber: DeviceInfo.getBuildNumber(),
    BundleId: DeviceInfo.getBundleId(),
    Carrier: await DeviceInfo.getCarrier(),
    DeviceId: DeviceInfo.getDeviceId(),
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
    SystemName: DeviceInfo.getSystemName(),
    SystemVersion: DeviceInfo.getSystemVersion(),
    TotalDiskCapacity: await DeviceInfo.getTotalDiskCapacity(),
    TotalMemory: await DeviceInfo.getTotalMemory(),
    UniqueID: DeviceInfo.getUniqueId(),
    UserAgent: await DeviceInfo.getUserAgent(),
    Version: DeviceInfo.getVersion(),
    isEmulator: await DeviceInfo.isEmulator(),
    isTablet: DeviceInfo.isTablet(),
    UsedMemory: await DeviceInfo.getUsedMemory(),
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
  sessionId: string = ''
  userAddress: string = ''
  deviceInfo: object = {}

  async init() {
    try {
      if (!SEGMENT_API_KEY) {
        throw Error('API Key not present, likely due to environment. Skipping enabling')
      }

      await Analytics.setup(SEGMENT_API_KEY, SEGMENT_OPTIONS)

      try {
        const deviceInfo = await getDeviceInfo()
        this.deviceInfo = deviceInfo
        this.sessionId = sha256('0x' + deviceInfo.UniqueID.split('-').join('') + String(Date.now()))
          .toString('hex')
          .slice(2)
      } catch (error) {
        Logger.error(TAG, 'getDeviceInfo error', error)
      }

      Logger.info(TAG, 'Segment Analytics Integration initialized!')
    } catch (error) {
      Logger.error(TAG, `Segment setup error: ${error.message}\n`, error)
    }
  }

  isEnabled() {
    // Remove __DEV__ here to test analytics in dev builds
    return !__DEV__ && store.getState().app.analyticsEnabled
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

  getSessionId() {
    return this.sessionId
  }

  setUserAddress(address?: string | null) {
    if (address) {
      this.userAddress = address.toLowerCase()
    } else if (address === null) {
      this.userAddress = 'unverified'
    } else {
      this.userAddress = 'unknown'
    }
  }

  track<EventName extends keyof AnalyticsPropertiesList>(
    ...args: undefined extends AnalyticsPropertiesList[EventName]
      ? [EventName] | [EventName, AnalyticsPropertiesList[EventName]]
      : [EventName, AnalyticsPropertiesList[EventName]]
  ) {
    const [eventName, eventProperties] = args

    if (!this.isEnabled()) {
      Logger.debug(TAG, `Analytics is disabled, not tracking event ${eventName}`)
      return
    }

    if (!SEGMENT_API_KEY) {
      Logger.debug(TAG, `No API key, not tracking event ${eventName}`)
      return
    }

    const props: {} = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAddress: this.userAddress,
      celoNetwork: DEFAULT_TESTNET,
      ...eventProperties,
    }

    Logger.info(TAG, `Tracking event ${eventName} with properties: ${JSON.stringify(props)}`)

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

  async reset() {
    try {
      await Analytics.flush()
      await Analytics.reset()
    } catch (error) {
      Logger.error(TAG, 'Error resetting analytics', error)
    }
  }
}

export default new ValoraAnalytics()
