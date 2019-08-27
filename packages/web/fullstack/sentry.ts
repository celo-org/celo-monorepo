import * as Sentry from '@sentry/node'
import getConfig from 'next/config'
export function initSentry() {
  const { publicRuntimeConfig } = getConfig()
  const config = publicRuntimeConfig.SENTRY

  Sentry.init({
    debug: publicRuntimeConfig.ENV === 'development',
    dsn: `https://${config.KEY}@sentry.io/${config.PROJECT}`,
    environment: publicRuntimeConfig.ENV,
  })
}

export default Sentry
