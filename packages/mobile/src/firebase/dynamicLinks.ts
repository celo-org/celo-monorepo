import firebase from 'react-native-firebase'
import Logger from 'src/utils/Logger'

const TAG = 'firebase/dynamicLink'

export async function generateShortInviteLink({
  link,
  appStoreId,
  bundleId,
}: {
  link: string
  appStoreId: string | undefined
  bundleId: string
}): Promise<string> {
  try {
    const firebaseLink = new firebase.links.DynamicLink(link, 'https://l.celo.org')

    if (bundleId) {
      // bundleId is the same as packageName for Android
      firebaseLink.android.setPackageName(bundleId)
      firebaseLink.ios.setBundleId(bundleId)
    }

    if (appStoreId) {
      firebaseLink.ios.setAppStoreId(appStoreId)
    }

    // Please note other parameter than UNGUESSABLE is unsafe
    const shortUrl = await firebase.links().createShortDynamicLink(firebaseLink, 'UNGUESSABLE')

    // It is NOT recommended to shorten this link with another
    // shortener (e.g. bit.ly) because it can break deep links
    return shortUrl
  } catch (error) {
    Logger.error(TAG, 'Failed to shorten invite URL: ' + error.toString())
    return link
  }
}
