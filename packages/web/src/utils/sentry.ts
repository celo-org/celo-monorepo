import getConfig from 'next/config'
import sentryConfig from '../../fullstack/sentry'
let hasInitialized = false

let Sentry

export async function initSentry() {
  const { publicRuntimeConfig } = getConfig()
  if (publicRuntimeConfig.ENV === 'development') {
    return
  }

  if (!hasInitialized) {
    const sentry = await getSentry()
    sentry.init(sentryConfig())
    hasInitialized = true
  }
}

export async function getSentry() {
  Sentry = Sentry || (await import('@sentry/browser'))
  return Sentry
}
