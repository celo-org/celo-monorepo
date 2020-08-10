import dynamicLinks, { FirebaseDynamicLinksTypes } from '@react-native-firebase/dynamic-links'
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
    const dynamicLinkParams: FirebaseDynamicLinksTypes.DynamicLinkParameters = {
      link,
      domainUriPrefix: 'https://l.celo.org',
    }

    if (bundleId) {
      // bundleId is the same as packageName for Android
      dynamicLinkParams.android = { packageName: bundleId }
      dynamicLinkParams.ios = { bundleId }
      if (appStoreId) {
        dynamicLinkParams.ios.appStoreId = appStoreId
      }
    }

    const shortUrl = await dynamicLinks().buildShortLink(
      dynamicLinkParams,
      // @ts-ignore Remove, when https://github.com/invertase/react-native-firebase/issues/3287 is resolved
      // Please note other parameter than UNGUESSABLE is unsafe
      'UNGUESSABLE'
    )
    // It is NOT recommended to shorten this link with another
    // shortener (e.g. bit.ly) because it can break deep links
    return shortUrl
  } catch (error) {
    Logger.error(TAG, 'Failed to shorten invite URL: ' + error.toString())
    return link
  }
}
