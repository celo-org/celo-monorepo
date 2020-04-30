import * as Sentry from '@sentry/node'
import getConfig from 'next/config'
import sentryConfig from '../fullstack/sentry'

export async function initSentryServer() {
  const { publicRuntimeConfig } = getConfig()
  if (publicRuntimeConfig.ENV === 'development') {
    return
  }
  Sentry.init(sentryConfig())

  return Sentry
}

export default Sentry
