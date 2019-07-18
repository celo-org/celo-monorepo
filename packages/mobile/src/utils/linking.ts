import { Linking } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { CELO_VERIFIER_DOWNLOAD_LINK, CELO_VERIFIER_START_MINING_LINK } from 'src/config'
import Logger from 'src/utils/Logger'

export const navigateToVerifierApp = () =>
  navigateToURI({
    uri: CELO_VERIFIER_START_MINING_LINK,
    backupUri: CELO_VERIFIER_DOWNLOAD_LINK,
  })

export function navigateToWalletPlayStorePage() {
  Linking.openURL(`market://details?id=${DeviceInfo.getBundleId()}`)
}

interface NavigateToURIInterface {
  uri: string
  backupUri?: string
}

export const navigateToURI = ({ uri, backupUri }: NavigateToURIInterface) => {
  Linking.canOpenURL(uri).then((supported) => {
    if (supported) {
      Linking.openURL(uri)
    } else {
      Logger.debug('linking/navigateToURI', `Failed to open ${uri}`)
      if (backupUri) {
        Linking.openURL(backupUri)
      }
    }
  })
}
