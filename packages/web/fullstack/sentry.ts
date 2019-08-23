import * as Sentry from '@sentry/browser'
import getConfig from 'next/config'
;(function() {
  const config = getConfig().publicRuntimeConfig.SENTRY
  Sentry.init({
    debug: false,
    dsn: `https://${config.KEY}@sentry.io/${config.PROJECT}`,
    environment: getConfig().publicRuntimeConfig.FLAGS.ENV,
  })
})()

export default Sentry
