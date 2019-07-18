import firebase from 'react-native-firebase'
import { FIREBASE_WEB_KEY } from 'src/config'
import Logger from 'src/utils/Logger'

const TAG = 'utils/dynamicLink'

export async function dynamicLink(url: string): Promise<string> {
  try {
    // TODO: Move 'celo.page.link' to celo-org-mobile firebase project and then flip this bool once
    // that's done.
    const useRNFirebase = false

    if (useRNFirebase) {
      const link = new firebase.links.DynamicLink(url, 'celo.page.link')

      // TODO: Remove this ts ignore when we upgrade react-native-firebase
      // @ts-ignore: Seems like RN Firebase has the incorrect type for this function call.
      const shortUrl = await firebase.links().createShortDynamicLink(link, 'UNGUESSABLE')
      return shortUrl
    } else {
      const longDynamicLink = `https://celo.page.link/?link=${encodeURIComponent(url)}`
      const apiUrl = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${FIREBASE_WEB_KEY}`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ longDynamicLink }),
      })
      if (response.status !== 200) {
        return url
      }
      const json = await response.json()
      return json.shortLink
    }
  } catch (error) {
    Logger.error(TAG, 'Failed to shorten invite URL: ' + error.toString())
    return url
  }
}
