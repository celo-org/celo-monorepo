import { Linking, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { APP_STORE_ID } from 'src/config'
import Logger from 'src/utils/Logger'

const TAG = 'utils/linking'

export function navigateToWalletStorePage() {
  if (Platform.OS === 'android') {
    navigateToURI(`market://details?id=${DeviceInfo.getBundleId()}`)
  } else {
    navigateToURI(`https://apps.apple.com/app/id${APP_STORE_ID}`)
  }
}

export function navigateToURI(uri: string, backupUri?: string) {
  Logger.debug(TAG, 'Navigating to URI', uri)

  // We're NOT using `Linking.canOpenURL` here because we would need
  // the scheme to be added to LSApplicationQueriesSchemes on iOS
  // which is not possible for DappKit callbacks
  Linking.openURL(uri).catch((reason: string) => {
    Logger.debug(TAG, 'URI not supported', uri)
    if (backupUri) {
      Logger.debug(TAG, 'Trying backup URI', backupUri)
      navigateToURI(backupUri)
    } else {
      Logger.error(TAG, `Error navigating to URI: ${reason}`)
    }
  })
}

export function navigateToPhoneSettings() {
  Logger.debug(TAG, 'Navigating phone settings')
  Linking.openSettings().catch((reason: string) =>
    Logger.error(TAG, `Error navigating to phone settings: ${reason}`)
  )
}
