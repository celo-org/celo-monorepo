import { Linking } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { CELO_VERIFIER_DOWNLOAD_LINK, CELO_VERIFIER_START_MINING_LINK } from 'src/config'
import Logger from 'src/utils/Logger'

const TAG = 'utils/linking'

export function navigateToVerifierApp() {
  navigateToURI(CELO_VERIFIER_START_MINING_LINK, CELO_VERIFIER_DOWNLOAD_LINK)
}

export function navigateToWalletPlayStorePage() {
  navigateToURI(`market://details?id=${DeviceInfo.getBundleId()}`)
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
