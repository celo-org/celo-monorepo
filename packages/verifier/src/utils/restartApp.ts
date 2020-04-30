import { RestartAndroid } from 'react-native-restart-android'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import Logger from 'src/utils/logger'

// Call this method to restart the app.
export function restartApp() {
  CeloAnalytics.track(CustomEventNames.user_restart)
  Logger.info('utils/AppRestart/restartApp', 'Restarting app')
  RestartAndroid.restart()
}
