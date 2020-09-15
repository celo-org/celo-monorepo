import Cookies from 'js-cookie'
import getConfig from 'next/config'
import { isBrowser } from 'src/utils/utils'

const { publicRuntimeConfig } = getConfig()

let ReactGA

export const ALLOW_ANALYTICS_COOKIE_NAME = '__allow__analytics__cookie__'
export const RESPONDED_TO_CONSENT = '__responded_to_consent__'

const OPTIN_EXPIRE_DAYS = 365
const OPTOUT_EXPIRE_DAYS = 1

export async function canTrack() {
  const allowTrack = await Cookies.get(ALLOW_ANALYTICS_COOKIE_NAME)
  return isBrowser() && !!allowTrack && publicRuntimeConfig.ENV !== 'development'
}

export async function showVisitorCookieConsent() {
  return !Cookies.get(RESPONDED_TO_CONSENT)
}

export async function initializeAnalytics() {
  if (!ReactGA && (await canTrack())) {
    ReactGA = await import('react-ga').then((mod) => mod.default)

    ReactGA.initialize(publicRuntimeConfig.GA_KEY)
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

function noTrack() {
  return publicRuntimeConfig.ENV === 'development' ? console.info(arguments) : null
}

export default {
  track: async function track(key: string, label?: string) {
    if (!(await canTrack())) {
      return noTrack()
    }

    await initializeAnalytics()
    ReactGA.event({
      category: 'User',
      action: key,
      label,
    })
  },
  page: async function page() {
    if (!(await canTrack())) {
      return noTrack()
    }

    await initializeAnalytics()
    ReactGA.pageview(window.location.pathname + window.location.search)
  },
}
