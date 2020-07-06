import { Platform } from 'react-native'
import RNExitApp from 'react-native-exit-app'
import { RestartAndroid } from 'react-native-restart-android'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { deleteChainData } from 'src/geth/geth'
import Logger from 'src/utils/Logger'

export const RESTART_APP_I18N_KEY = Platform.OS === 'android' ? 'restartApp' : 'quitApp'

// Call this method to restart the app.
export function deleteChainDataAndRestartApp() {
  // Delete chain data since that's what is most likely corrupt.
  Logger.info('utils/AppRestart/deleteChainDataAndRestartApp', 'deleting chain data')
  deleteChainData()
    .finally(() => {
      restartApp()
    })
    .catch((reason) =>
      Logger.error(
        'utils/AppRestart/deleteChainDataAndRestartApp',
        `Deleting chain data failed: ${reason}`
      )
    )
}

export function restartApp() {
  ValoraAnalytics.track(AppEvents.user_restart)
  Logger.info('utils/AppRestart/deleteChainDataAndRestartApp', 'Restarting app')
  if (Platform.OS === 'android') {
    RestartAndroid.restart()
  } else {
    // We can't restart on iOS, so just exit ;)
    RNExitApp.exitApp()
  }
}
