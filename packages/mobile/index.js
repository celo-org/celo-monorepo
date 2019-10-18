import 'node-libs-react-native/globals'
import 'src/missingGlobals'
import { AppRegistry } from 'react-native'
import Logger from 'src/utils/Logger'
import App from 'src/app/App'
import { installSentry } from 'src/sentry/Sentry'
import { Sentry } from 'react-native-sentry'
import { onBackgroundNotification } from 'src/firebase/firebase'

// Set this to true, if you are modifying Sentry and want to test your changes
const enableSentryOnDebugBuild = false
const isDevBuild = __DEV__
const sentryEnabled = !isDevBuild || enableSentryOnDebugBuild

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
AppRegistry.registerHeadlessTask('RNFirebaseBackgroundMessage', () => onBackgroundNotification)
