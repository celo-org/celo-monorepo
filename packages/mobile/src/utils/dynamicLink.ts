import firebase from 'react-native-firebase'
import Logger from 'src/utils/Logger'

const TAG = 'utils/dynamicLink'

export async function generateDynamicShortLink(
  url: string,
  appStoreUrl: string,
  androidPackageName: string,
  iOSBundleId: string
): Promise<string> {
  try {
    // legacy users are using `celo.page.link`, but if we move that domain to the current firebase
    // those links are gonna break, so better do before a network reset
    const link = new firebase.links.DynamicLink(appStoreUrl, 'https://celol.page.link')

    link.android.setFallbackUrl(url)
    link.android.setPackageName(androidPackageName)

    link.ios.setFallbackUrl(appStoreUrl)
    link.ios.setBundleId(iOSBundleId)

    // Please not other parameter than UNGUESSABLE is unsafe
    const shortUrl = await firebase.links().createShortDynamicLink(link, 'UNGUESSABLE')
    Logger.error(TAG, `dynamic link ${shortUrl}`)

    // It is NOT recommended to shorten this link because it
    // can break deep links
    return shortUrl
  } catch (error) {
    Logger.error(TAG, 'Failed to shorten invite URL: ' + error.toString())
    return url
  }
}
