import Cookies from 'js-cookie'
import getConfig from 'next/config'
const isInEU = require('@segment/in-eu')

let analytics
const ALLOW_ANALYTICS_COOKIE_NAME = '__allow__analytics__cookie__'
const RESPONDED_TO_CONSENT = '__responded_to_consent__'

declare var process: any

export function canTrack(): boolean {
  return !!Cookies.get(ALLOW_ANALYTICS_COOKIE_NAME) || !isInEU()
}

export function showVisitorCookieConsent(): boolean {
  return isInEU() && !Cookies.get(RESPONDED_TO_CONSENT)
}

const initializeAnalytics = () => {
  if (process.browser && canTrack()) {
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
  Cookies.set(ALLOW_ANALYTICS_COOKIE_NAME, true, { expires: EXPIRE_DAYS })
  Cookies.set(RESPONDED_TO_CONSENT, true, { expires: EXPIRE_DAYS })
  initializeAnalytics()
}

export const disagree = () => {
  Cookies.set(ALLOW_ANALYTICS_COOKIE_NAME, false, { expires: EXPIRE_DAYS })
  Cookies.set(RESPONDED_TO_CONSENT, true, { expires: EXPIRE_DAYS })
}

const EXPIRE_DAYS = 365

export default analytics
