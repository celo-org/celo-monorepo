import firebase from 'react-native-firebase'
import Logger from 'src/utils/Logger'

const TAG = 'firebase/dynamicLink'

export async function generateShortInviteLink({
  link,
  playStoreUrl,
  appStoreUrl,
  bundleId,
}: {
  link: string
  playStoreUrl: string
  appStoreUrl: string
  bundleId: string
}): Promise<string> {
  try {
    const firebaseLink = new firebase.links.DynamicLink(link, 'https://celol.page.link')

    firebaseLink.android.setFallbackUrl(playStoreUrl)
    firebaseLink.android.setPackageName(bundleId)

    firebaseLink.ios.setFallbackUrl(appStoreUrl)
    firebaseLink.ios.setBundleId(bundleId)

    // Please note other parameter than UNGUESSABLE is unsafe
    const shortUrl = await firebase.links().createShortDynamicLink(firebaseLink, 'UNGUESSABLE')

    // It is NOT recommended to shorten this link because it
    // can break deep links
    return shortUrl
  } catch (error) {
    Logger.error(TAG, 'Failed to shorten invite URL: ' + error.toString())
    return link
  }
}
