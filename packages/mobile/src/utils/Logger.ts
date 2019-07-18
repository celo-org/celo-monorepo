import ReactNativeLogger from '@celo/react-components/services/ReactNativeLogger'
import DeviceInfo from 'react-native-device-info'
import * as RNFS from 'react-native-fs'
import Mailer from 'react-native-mail'
import { CELO_SUPPORT_EMAIL_ADDRESS } from 'src/config'

class Logger extends ReactNativeLogger {
  getGethLogFilePath = () => {
    return RNFS.CachesDirectoryPath + '/geth_logs.txt'
  }

  getCombinedLogsFilePath = () => {
    return RNFS.ExternalDirectoryPath + '/celo_logs.txt'
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

  emailLogsToSupport = async (userId: string) => {
    const combinedLogsPath = await this.createCombinedLogs()
    if (!combinedLogsPath) {
      return
    }

    const deviceInfo = {
      version: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      apiLevel: DeviceInfo.getAPILevel(),
      deviceId: DeviceInfo.getDeviceId(),
    }

    const emailSubject = 'Celo support for ' + (userId || 'unknownUser')
    Mailer.mail(
      {
        subject: emailSubject,
        recipients: [CELO_SUPPORT_EMAIL_ADDRESS],
        body: `<b>Support logs are attached...</b><b>${JSON.stringify(deviceInfo)}</b>`,
        isHTML: true,
        attachment: {
          path: combinedLogsPath, // The absolute path of the file from which to read data.
          type: 'txt', // Mime Type: jpg, png, doc, ppt, html, pdf, csv
          name: '', // Optional: Custom filename for attachment
        },
      },
      (error: any, event: any) => {
        this.showError(error + ' ' + event)
      }
    )
  }
}

export default new Logger()
