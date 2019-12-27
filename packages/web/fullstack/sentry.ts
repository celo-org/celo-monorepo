import * as Sentry from '@sentry/node'
import getConfig from 'next/config'
export function initSentry() {
  const { publicRuntimeConfig } = getConfig()
  const config = publicRuntimeConfig.SENTRY
  if (publicRuntimeConfig.ENV === 'development') {
    return
  }
  Sentry.init({
    dsn: `https://${config.KEY}@sentry.io/${config.PROJECT}`,
    environment: publicRuntimeConfig.ENV,
    ignoreErrors: [
      "The fetching process for the media resource was aborted by the user agent at the user's request.",
    ],
  })
}

export default Sentry
