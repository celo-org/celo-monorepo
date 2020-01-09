import Cookies from 'js-cookie'
import getConfig from 'next/config'

let analytics: {
  track: (key: string, properties?: object, options?: object) => void
}

let analyticsStarted = false

const ALLOW_ANALYTICS_COOKIE_NAME = '__allow__analytics__cookie__'
const RESPONDED_TO_CONSENT = '__responded_to_consent__'

declare var process: any

export async function canTrack() {
  return !!Cookies.get(ALLOW_ANALYTICS_COOKIE_NAME) || !(await isInEU())
}

export async function showVisitorCookieConsent() {
  if (!Cookies.get(RESPONDED_TO_CONSENT)) {
    return isInEU()
  }
  return false
}

async function isInEU() {
  const inEU = await import('@segment/in-eu').then((mod) => mod.default)
  return inEU()
}
export async function initializeAnalytics() {
  if (process.browser && !analyticsStarted && (await canTrack())) {
    analyticsStarted = true
    const Segment = await import('load-segment').then((mod) => mod.default)
    const { publicRuntimeConfig } = getConfig()
    analytics = Segment({ key: publicRuntimeConfig.__SEGMENT_KEY__ })
  } else {
    analytics = {
      track: () => null,
    }
  }
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

export default analytics
