import firebase from 'react-native-firebase'
import Logger from 'src/utils/Logger'

const TAG = 'utils/dynamicLink'

export async function generateDynamicShortLink(
  playStoreUrl: string,
  appStoreUrl: string,
  androidPackageName: string,
  iOSBundleId: string
): Promise<string> {
  try {
    const firebaseLink = new firebase.links.DynamicLink(appStoreUrl, 'https://celol.page.link')

    firebaseLink.android.setFallbackUrl(playStoreUrl)
    firebaseLink.android.setPackageName(androidPackageName)

    firebaseLink.ios.setFallbackUrl(appStoreUrl)
    firebaseLink.ios.setBundleId(iOSBundleId)

    // Please note other parameter than UNGUESSABLE is unsafe
    const shortUrl = await firebase.links().createShortDynamicLink(firebaseLink, 'UNGUESSABLE')
    Logger.error(TAG, `dynamic link ${shortUrl}`)

    // It is NOT recommended to shorten this link because it
    // can break deep links
    return shortUrl
  } catch (error) {
    Logger.error(TAG, 'Failed to shorten invite URL: ' + error.toString())
    return playStoreUrl
  }
}
