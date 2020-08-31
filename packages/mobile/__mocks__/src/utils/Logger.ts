const createCombinedLogs = jest.fn()

class Logger {
  error = (tag: string, statement: string, error?: any) => {
    console.info(`${tag}/${statement}`, error)
  }

  warn = (tag: string, statement: string) => {
    console.info(`${tag}/${statement}`)
  }

  info = (tag: string, statement: string) => {
    console.info(`${tag}/${statement}`)
  }

  debug = (tag: string, statement: string) => {
    console.debug(`${tag}/${statement}`)
  }

  logDebug = (message: string) => {
    console.log(message)
  }

  logUnusedError = (message: string) => {
    console.log(message)
  }

  sanitizeError = jest.fn((error) => error)

  overrideConsoleLogs = () => {}

  showError = (message: string) => {
    console.log(message)
  }

  showMessage = (message: string) => {
    console.log(message)
  }

  createCombinedLogs = createCombinedLogs
  getGethLogFilePath = jest.fn(() => 'geth_logs.txt')
  getReactNativeLogsFilePath = jest.fn(() => 'rn_logs.txt')
}

export default new Logger()
