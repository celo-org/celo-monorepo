export enum LogLevel {
  VERBOSE = 1,
  DEBUG = 2,
  INFO = 3,
  WARN = 4,
  ERROR = 5,
}

// This is not exported. An instance of it is exported instead.
class LoggerClass {
  private level: LogLevel = LogLevel.INFO // Default to info and above

  /**
   * @param tag Marks the source of the log. Usually `filename@functionName`
   * @param message the actual message
   */
  public error(tag: string, message: string): void {
    if (!this.canLog(LogLevel.ERROR)) {
      return
    }
    console.info(`${tag}: ${message}`)
  }

  /**
   * @param tag Marks the source of the log. Usually `filename@functionName`
   * @param message the actual message
   */
  public warn(tag: string, message: string): void {
    if (!this.canLog(LogLevel.WARN)) {
      return
    }
    console.info(`${tag}: ${message}`)
  }

  /**
   * @param tag Marks the source of the log. Usually `filename@functionName`
   * @param message the actual message
   */
  public info(tag: string, message: string): void {
    if (!this.canLog(LogLevel.INFO)) {
      return
    }
    console.info(`${tag}: ${message}`)
  }

  /**
   * @param tag Marks the source of the log. Usually `filename@functionName`
   * @param message the actual message
   */
  public debug(tag: string, message: string): void {
    if (!this.canLog(LogLevel.DEBUG)) {
      return
    }
    console.debug(`${tag}: ${message}`)
  }

  /**
   * @param tag Marks the source of the log. Usually `filename@functionName`
   * @param message the actual message
   */
  public verbose(tag: string, message: string): void {
    if (!this.canLog(LogLevel.VERBOSE)) {
      return
    }
    console.debug(`${tag}: ${message}`)
  }

  public setLogLevel(level: LogLevel) {
    this.level = level
  }

  public getLogLevel(): LogLevel {
    return this.level
  }

  public canLog(level: LogLevel): boolean {
    return level > this.level
  }
}

export const Logger = new LoggerClass()
