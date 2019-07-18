import { RestartAndroid } from 'react-native-restart-android'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { deleteChainData } from 'src/geth/geth'
import Logger from 'src/utils/Logger'

// Call this method to restart the app.
export function restartApp() {
  // Delete chain data since that's what is most likely corrupt.
  Logger.info('utils/AppRestart/restartApp', 'deleting chain data')
  deleteChainData().finally(() => {
    CeloAnalytics.track(CustomEventNames.user_restart)
    Logger.info('utils/AppRestart/restartApp', 'Restarting app')
    RestartAndroid.restart()
  })
}
