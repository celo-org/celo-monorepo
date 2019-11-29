import firebase from 'react-native-firebase'
import Logger from 'src/utils/Logger'

const TAG = 'utils/dynamicLink'

export async function generateDynamicShortLink(url: string, appStoreUrl: string): Promise<string> {
  try {
    // TODO: Move 'celo.page.link' to celo-org-mobile firebase project and then flip this bool once
    // that's done.
    // const useRNFirebase = true

    // if (useRNFirebase) {
    const link = new firebase.links.DynamicLink(url, 'celolink.page.link')
    link.android.setFallbackUrl(url)
    link.ios.setFallbackUrl(appStoreUrl)

    const shortUrl = await firebase.links().createShortDynamicLink(link, 'UNGUESSABLE')
    Logger.error(TAG, `dynamic link ${shortUrl}`)

    return shortUrl
    // } else {
    //   const longDynamicLink = `https://celo.page.link/?link=${encodeURIComponent(url)}`
    //   const apiUrl = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${FIREBASE_WEB_KEY}`
    //   const response = await fetch(apiUrl, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     // body: JSON.stringify({
    //     //   longDynamicLink, suffix: {
    //     //     option: "UNGUESSABLE"
    //     //   }
    //     // }),
    //     body: JSON.stringify({
    //       dynamicLinkInfo: {
    //         domainUriPrefix: 'celo.page.link',
    //         // link: 'https://apps.apple.com/us/app/celo-alfajores-wallet/id1482389446',
    //         link: 'https://celo.org',
    //         // link: playStoreUrl,
    //         // This doesn't work!
    //         androidInfo: {
    //           androidPackageName: 'org.celo.mobile.alfajores',
    //           androidFallbackLink: url,
    //           androidMinPackageVersionCode: "3"
    //         },
    //       },
    //       suffix: {
    //         option: 'UNGUESSABLE',
    //       },
    //     }),
    //   })

    //   Logger.error(TAG, response.status.toString())
    //   if (response.status !== 200) {
    //     Logger.error(TAG, JSON.stringify(await response.json()))
    //     return url
    //   }
    //   const json = await response.json()
    //   Logger.error(TAG, json.shortLink)
    //   return json.shortLink
    // }
  } catch (error) {
    Logger.error(TAG, 'Failed to shorten invite URL: ' + error.toString())
    return url
  }
}
