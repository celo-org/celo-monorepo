import ReactNativeLogger from '@celo/react-components/services/ReactNativeLogger'
import { Platform } from 'react-native'
import * as RNFS from 'react-native-fs'

class Logger extends ReactNativeLogger {
  getGethLogFilePath = () => {
    return RNFS.CachesDirectoryPath + '/geth_logs.txt'
  }

  getCombinedLogsFilePath = () => {
    const path = Platform.OS === 'ios' ? RNFS.TemporaryDirectoryPath : RNFS.ExternalDirectoryPath
    return `${path}/celo_logs.txt`
  }

  /**
   * @override
   */
  getLogs = async (): Promise<any> => {
    // TODO(Rossy) Does this technique of passing logs back as a string
    // fail when the logs get o big?
    try {
      const rnLogsSrc = this.getReactNativeLogsFilePath()
      const gethLogsSrc = this.getGethLogFilePath()
      let reactNativeLogs = null
      let gethLogs = null
      if (await RNFS.exists(rnLogsSrc)) {
        reactNativeLogs = await RNFS.readFile(rnLogsSrc)
      }
      if (await RNFS.exists(gethLogsSrc)) {
        gethLogs = await RNFS.readFile(gethLogsSrc)
      }

      return { reactNativeLogs, gethLogs }
    } catch (e) {
      this.showError('Failed to read logs: ' + e)
      return null
    }
  }

  createCombinedLogs = async () => {
    try {
      this.showMessage('Creating combined log...')
      const gethLogsSrc = this.getGethLogFilePath()
      const rnLogsSrc = this.getReactNativeLogsFilePath()
      // The RN library we are using only supports one file attachment. In the longer run, we should
      // either find a new library or write a new one. For now, we will put the logs in one file.
      // Longer run, we will go for a multi-attachment route. The other problem with our current approach
      // is that we have to write this log file into a world-readable directory. Android has a concept of
      // one time file access permissions which we cannot use here since the library we are using it
      // does not understand that.
      const combinedLogsPath = this.getCombinedLogsFilePath()
      await RNFS.writeFile(combinedLogsPath, '========React Native Logs========\n')
      if (await RNFS.exists(rnLogsSrc)) {
        await RNFS.appendFile(combinedLogsPath, await RNFS.readFile(rnLogsSrc))
      }
      await RNFS.appendFile(combinedLogsPath, '\n\n========Geth Logs========\n')
      if (await RNFS.exists(gethLogsSrc)) {
        await RNFS.appendFile(combinedLogsPath, await RNFS.readFile(gethLogsSrc))
      }
      return combinedLogsPath
    } catch (e) {
      this.showError('Failed to  copy files: ' + e)
      return false
    }
  }
}

export default new Logger()
