import * as Sentry from '@sentry/node'
import getConfig from 'next/config'
export function initSentry() {
  const { publicRuntimeConfig } = getConfig()
  const config = publicRuntimeConfig.SENTRY

  Sentry.init({
    debug: process.env.DEPLOY_ENV === 'development',
    dsn: `https://${config.KEY}@sentry.io/${config.PROJECT}`,
    environment: process.env.DEPLOY_ENV,
  })
}

export default Sentry
