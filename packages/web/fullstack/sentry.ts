import * as Sentry from '@sentry/browser'
import getConfig from 'next/config'
import * as sentryTestkit from 'sentry-testkit'

const { testkit, sentryTransport } = sentryTestkit()
;(() => {
  const { publicRuntimeConfig } = getConfig() || { publicRuntimeConfig: {} }
  const config = publicRuntimeConfig.SENTRY || {}

  Sentry.init({
    debug: true,
    dsn: `https://${config.KEY}@sentry.io/${config.PROJECT}`,
    // environment: publicRuntimeConfig.FLAGS.ENV,
    transport: sentryTransport,
  })
})()

export default Sentry

export const kit = testkit
