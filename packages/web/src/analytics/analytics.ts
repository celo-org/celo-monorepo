import Cookies from 'js-cookie'
import getConfig from 'next/config'
import { isBrowser } from 'src/utils/utils'

let analytics: {
  track: (key: string, properties?: object, options?: object) => void
  page: () => void
}

let segmentPromise

export const ALLOW_ANALYTICS_COOKIE_NAME = '__allow__analytics__cookie__'
export const RESPONDED_TO_CONSENT = '__responded_to_consent__'

export async function canTrack() {
  return !!Cookies.get(ALLOW_ANALYTICS_COOKIE_NAME)
}

export async function showVisitorCookieConsent() {
  return !Cookies.get(RESPONDED_TO_CONSENT)
}

export async function initializeAnalytics() {
  if (!isBrowser() || !(await canTrack())) {
    return {
      track: noTrack,
      page: noTrack,
    }
  }

  if (!segmentPromise) {
    segmentPromise = import('load-segment').then((mod) => mod.default)
  }
  if (!analytics) {
    const Segment = await segmentPromise
    const { publicRuntimeConfig } = getConfig()
    analytics = Segment({ key: publicRuntimeConfig.__SEGMENT_KEY__ })
  }
  return analytics
}

export async function agree() {
  Cookies.set(ALLOW_ANALYTICS_COOKIE_NAME, true, { expires: OPTIN_EXPIRE_DAYS })
  Cookies.set(RESPONDED_TO_CONSENT, true, { expires: OPTIN_EXPIRE_DAYS })
  await initializeAnalytics()
}

export const disagree = () => {
  Cookies.set(RESPONDED_TO_CONSENT, true, { expires: OPTOUT_EXPIRE_DAYS })
}

const OPTIN_EXPIRE_DAYS = 365
const OPTOUT_EXPIRE_DAYS = 1

export default {
  track: async function track(key: string, properties?: object, options?: object) {
    const segment = await initializeAnalytics()
    return segment.track(key, properties, options)
  },
  page: async function page() {
    const segment = await initializeAnalytics()
    return segment.page()
  },
}

function noTrack() {
  return getConfig().publicRuntimeConfig.ENV === 'development' ? console.info(arguments) : null
}
