class Logger {
  error = (tag: string, statement: string) => {
    console.info(`${tag}/${statement}`)
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

  overrideConsoleLogs = () => {}
}

export default new Logger()
