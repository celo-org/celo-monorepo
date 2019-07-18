import Cookies from 'js-cookie'
import getConfig from 'next/config'

let analytics
const ALLOW_ANALYTICS_COOKIE_NAME = '__allow__analytics__cookie__'
const DISALLOW_COOKIES_REDIRECT_LOCATION = 'https://google.com'

declare var process: any

export const hasUserGivenCookiesAgreement = () => {
  return !!Cookies.get(ALLOW_ANALYTICS_COOKIE_NAME)
}

const initializeAnalytics = () => {
  if (hasUserGivenCookiesAgreement() && process.browser) {
    const Segment = require('load-segment')
    const { publicRuntimeConfig } = getConfig()
    analytics = Segment({ key: publicRuntimeConfig.__SEGMENT_KEY__ })
  } else {
    analytics = {
      // tslint:disable-next-line
      track: () => {},
    }
  }
}

initializeAnalytics()

export const agree = () => {
  Cookies.set(ALLOW_ANALYTICS_COOKIE_NAME, true)
  initializeAnalytics()
}

export const disagree = () => {
  location.href = DISALLOW_COOKIES_REDIRECT_LOCATION
}

export default analytics
