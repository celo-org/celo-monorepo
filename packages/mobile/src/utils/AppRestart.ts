import { Platform } from 'react-native'
import RNExitApp from 'react-native-exit-app'
import { RestartAndroid } from 'react-native-restart-android'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { deleteChainData } from 'src/geth/geth'
import Logger from 'src/utils/Logger'

export const RESTART_APP_I18N_KEY = Platform.OS === 'android' ? 'restartApp' : 'quitApp'

// Call this method to restart the app.
export function restartApp() {
  // Delete chain data since that's what is most likely corrupt.
  Logger.info('utils/AppRestart/restartApp', 'deleting chain data')
  deleteChainData()
    .finally(() => {
      CeloAnalytics.track(CustomEventNames.user_restart)
      Logger.info('utils/AppRestart/restartApp', 'Restarting app')
      if (Platform.OS === 'android') {
        RestartAndroid.restart()
      } else {
        // We can't restart on iOS, so just exit ;)
        RNExitApp.exitApp()
      }
    })
    .catch((reason) =>
      Logger.error('utils/AppRestart/restartApp', `Deleting chain data failed: ${reason}`)
    )
}
