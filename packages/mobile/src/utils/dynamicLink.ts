import firebase from 'react-native-firebase'
import { FIREBASE_WEB_KEY } from 'src/config'
import Logger from 'src/utils/Logger'

const TAG = 'utils/dynamicLink'

export async function generateDynamicShortLink(url: string, playStoreUrl: string): Promise<string> {
  try {
    // TODO: Move 'celo.page.link' to celo-org-mobile firebase project and then flip this bool once
    // that's done.
    const useRNFirebase = false

    if (useRNFirebase) {
      const link = new firebase.links.DynamicLink(url, 'celolink.page.link')
      link.android.setFallbackUrl(url)
      link.ios.setFallbackUrl(playStoreUrl)

      const shortUrl = await firebase.links().createShortDynamicLink(link, 'UNGUESSABLE')
      Logger.error(TAG, `dynamic link ${shortUrl}`)

      return shortUrl
    } else {
      const longDynamicLink = `https://celo.page.link/?link=${encodeURIComponent(url)}`
      const apiUrl = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${FIREBASE_WEB_KEY}`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify({
        //   longDynamicLink, suffix: {
        //     option: "UNGUESSABLE"
        //   }
        // }),
        body: JSON.stringify({
          dynamicLinkInfo: {
            domainUriPrefix: 'celo.page.link',
            link: 'https://celo.org', // playStoreUrl,
            androidInfo: {
              androidPackageName: 'org.celo.mobile.alfajores',
              androidFallbackLink: url,
            },
          },
          suffix: {
            option: 'UNGUESSABLE',
          },
        }),
      })

      Logger.error(TAG, response.status.toString())
      if (response.status !== 200) {
        Logger.error(TAG, (await response.json()).toString())
        return url
      }
      const json = await response.json()
      Logger.error(TAG, json.shortLink)
      return json.shortLink
    }
  } catch (error) {
    Logger.error(TAG, 'Failed to shorten invite URL: ' + error.toString())
    return url
  }
}
