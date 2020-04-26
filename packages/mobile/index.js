// Order is important, please don't change it unless you know what you're doing :D
import 'node-libs-react-native/globals'
import 'src/missingGlobals'
import 'src/forceCommunityAsyncStorage'
import 'src/setupE2eEnv' // This is only for E2E tests and has no effects when not running E2E tests
import { AppRegistry } from 'react-native'
import Logger from 'src/utils/Logger'
import App from 'src/app/App'
import { installSentry } from 'src/sentry/Sentry'
import * as Sentry from '@sentry/react-native'
import { onBackgroundNotification } from 'src/firebase/firebase'

// Set this to true, if you want to test Sentry on dev builds
const sentryEnabled = !__DEV__ || false

if (sentryEnabled) {
  installSentry()
} else {
  Logger.info('RootErrorHandler', 'Sentry not enabled')
}

Logger.overrideConsoleLogs()

const defaultErrorHandler = ErrorUtils.getGlobalHandler()
const customErrorHandler = (e, isFatal) => {
  if (sentryEnabled) {
    Sentry.captureException(e)
  }
  Logger.error('RootErrorHandler', `Unhandled error. isFatal: ${isFatal}`, e)
  defaultErrorHandler(e, isFatal)
}
ErrorUtils.setGlobalHandler(customErrorHandler)

AppRegistry.registerComponent('celo', () => App)
