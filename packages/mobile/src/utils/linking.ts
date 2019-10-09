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
  Logger.debug(TAG, 'Navigating to uri', uri)
  const onError = (reason: string) => Logger.error(TAG, `Error navigating to URI: ${reason}`)
  Linking.canOpenURL(uri)
    .then((canOpenUrl: boolean) => {
      if (canOpenUrl) {
        Linking.openURL(uri).catch(onError)
      } else {
        Logger.debug(TAG, 'Uri not supported', uri)
        if (backupUri) {
          Logger.debug(TAG, 'Trying backup uri', uri)
          Linking.openURL(backupUri).catch(onError)
        }
      }
    })
    .catch(onError)
}
