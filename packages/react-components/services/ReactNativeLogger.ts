import * as RNFS from 'react-native-fs'
import Toast from 'react-native-simple-toast'

export default class ReactNativeLogger {
  /**
   * Note: A good `tag` will consist of filename followed by the method name.
   * For example, `CeloAnalytics/track`
   * In case the file name is ambigous, add the parent directory name to it.
   * For example, `send/actions/refreshGasPrice` since there are many actions.ts files.
   */
  debug = (tag: string, ...messages: string[]) => {
    console.debug(`${tag}/${messages.join(', ')}`)
  }

  info = (tag: string, ...messages: string[]) => {
    console.info(`${tag}/${messages.join(', ')}`)
  }

  warn = (tag: string, ...messages: string[]) => {
    // console.warn would display yellow box, therefore, we will log to console.info instead.
    console.info(`${tag}/${messages.join(', ')}`)
  }

  error = (tag: string, message: string, error?: Error) => {
    // console.error would display red box, therefore, we will log to console.info instead.
    const errorMsg = this.getErrorMessage(error)
    console.info(`${tag}/${message}:${errorMsg}`)
    if (__DEV__) {
      console.info(console.trace())
    }
  }

  // TODO: see what to do with this on iOS since there's not native toast
  showMessage = (message: string) => {
    Toast.showWithGravity(message, Toast.SHORT, Toast.BOTTOM)
    this.debug('Toast', message)
  }

  // TODO(Rossy) Remove this. We should be using the error banner instead.
  // Do not add new code that uses this.
  showError = (error: string | Error) => {
    const errorMsg = this.getErrorMessage(error)
    Toast.showWithGravity(errorMsg, Toast.SHORT, Toast.BOTTOM)
    this.error('Toast', errorMsg)
  }

  getErrorMessage = (error?: string | Error) => {
    if (!error) {
      return ''
    }
    if (typeof error === 'string') {
      return error
    }
    let errorMsg = error.message || error.name || 'unknown'
    if (error.stack) {
      errorMsg += ' in ' + error.stack.substring(0, 100)
    }
    return errorMsg
  }

  getReactNativeLogsFilePath = () => {
    return RNFS.CachesDirectoryPath + '/rn_logs.txt'
  }

  getLogs = async () => {
    // TODO(Rossy) Does this technique of passing logs back as a string
    // fail when the logs get too big?
    try {
      const rnLogsSrc = this.getReactNativeLogsFilePath()
      let reactNativeLogs = null
      if (await RNFS.exists(rnLogsSrc)) {
        reactNativeLogs = await RNFS.readFile(rnLogsSrc)
      }
      return reactNativeLogs
    } catch (e) {
      this.showError('Failed to read logs: ' + e)
      return null
    }
  }

  // Anything being sent to console.log, console.warn, or console.error is piped into
  // the logfile specified by getReactNativeLogsFilePath()
  overrideConsoleLogs = () => {
    const logFilePath = this.getReactNativeLogsFilePath()
    console.debug('React Native logs will be piped to ' + logFilePath)

    const oldDebug = console.debug
    // tslint:disable-next-line
    const oldLog = console.log
    const oldInfo = console.info

    const writeLog = (level: string, message: string) => {
      const timestamp = new Date().toISOString()
      RNFS.appendFile(logFilePath, `${level} [${timestamp}] ${message}\n`, 'utf8').catch(
        (error) => {
          oldDebug(`Failed to write to ${logFilePath}`, error)
        }
      )
    }

    // tslint:disable-next-line
    console.log = (message?: any, ...optionalParams: any[]) => {
      optionalParams.length ? oldLog(message, optionalParams) : oldLog(message)
      if (typeof message === 'string') {
        writeLog('Log', message)
      }
    }

    console.debug = (message?: any, ...optionalParams: any[]) => {
      optionalParams.length ? oldDebug(message, optionalParams) : oldDebug(message)
      if (typeof message === 'string') {
        writeLog('Debug', message)
      }
    }

    console.info = (message?: any, ...optionalParams: any[]) => {
      optionalParams.length ? oldInfo(message, optionalParams) : oldInfo(message)
      if (typeof message === 'string') {
        writeLog('Info', message)
      }
    }

    console.warn = (message?: any, ...optionalParams: any[]) => {
      // console.warn would display yellow box, therefore, we will log to console.info instead.
      optionalParams.length ? oldInfo(message, optionalParams) : oldInfo(message)
      if (typeof message === 'string') {
        writeLog('Warn', message)
      }
    }

    console.error = (message?: any, ...optionalParams: any[]) => {
      // console.error would display red box, therefore, we will log to console.info instead.
      optionalParams.length ? oldInfo(message, optionalParams) : oldInfo(message)
      if (typeof message === 'string') {
        writeLog('Error', message)
      }
    }
  }
}
