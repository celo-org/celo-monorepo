import { Future } from './future'
import { Logger, noopLogger, prefixLogger } from './logger'

/**
 * Represent a running task that can be stopped
 *
 * Examples: A poller, a watcher.
 */
export interface RunningTask {
  /** Flag task to be stopped. Might not be inmediate */
  stop(): void
  /** Indicates wether the task is running */
  isRunning(): boolean
}

export interface TaskOptions {
  /** Name for the task. To be used in logging messages */
  name: string
  /** Logger function */
  logger?: Logger
}

/**
 * Given task options, creates the task logger
 *
 * It will prefix taskName to the logs
 */
const createTaskLogger = (opts: TaskOptions): Logger => {
  if (opts.logger) {
    return prefixLogger(opts.name, opts.logger)
  } else {
    return noopLogger
  }
}

interface RepeatTaskOptions extends TaskOptions {
  /** seconds between repetition */
  timeInBetweenMS: number
  /** initial delay for first run */
  initialDelayMS?: number
}

export interface RepeatTaskContext {
  /** Number of times the task has been executed (starts in 1) */
  executionNumber: number
  /** Flag task to be stopped. Might not be inmediate */
  stopTask(): void
}
/**
 * Runs an async function eternally until stopped
 *
 * @param fn function to run
 */
export function repeatTask(
  opts: RepeatTaskOptions,
  fn: (ctx: RepeatTaskContext) => Promise<void>
): RunningTask {
  const logger = createTaskLogger(opts)
  let isActive = true

  const ctx: RepeatTaskContext = {
    executionNumber: 0,
    stopTask() {
      isActive = false
    },
  }

  const loop = async () => {
    if (!isActive) {
      return
    }
    try {
      ctx.executionNumber++
      await fn(ctx)
    } catch (err) {
      logger(`Failed with error: ${err.message}`)
      logger(err)
    } finally {
      if (isActive) {
        setTimeout(loop, opts.timeInBetweenMS)
      }
    }
  }

  if (opts.initialDelayMS != null) {
    setTimeout(loop, opts.initialDelayMS)
  } else {
    // tslint:disable-next-line: no-floating-promises
    loop()
  }

  return {
    stop: ctx.stopTask,
    isRunning() {
      return isActive
    },
  }
}

export function conditionWatcher(
  opts: RepeatTaskOptions & {
    pollCondition: () => Promise<boolean>
    onSuccess: () => void | Promise<void>
  }
): RunningTask {
  return repeatTask(opts, async (ctx) => {
    const val = await opts.pollCondition()
    if (val) {
      ctx.stopTask()
      await opts.onSuccess()
    }
  })
}

export interface RunningTaskWithValue<A> extends RunningTask {
  onValue(): Promise<A>
}

export interface RetryTaskOptions<A> extends TaskOptions {
  /** seconds between repetition */
  timeInBetweenMS: number
  /** Maximum number of attemps */
  maxAttemps: number
  /** Function that tries to obtain a value A or returns null */
  tryGetValue: () => Promise<A | null>
}

export function tryObtainValueWithRetries<A>(opts: RetryTaskOptions<A>): RunningTaskWithValue<A> {
  const futureValue = new Future<A>()
  const task = repeatTask(opts, async (ctx) => {
    if (ctx.executionNumber > opts.maxAttemps) {
      ctx.stopTask()
      futureValue.reject(new Error('Max Retries & no value'))
    } else {
      const val = await opts.tryGetValue()
      if (val != null) {
        futureValue.resolve(val)
        ctx.stopTask()
      }
    }
  })

  return {
    ...task,
    stop: () => {
      task.stop()
      futureValue.reject(new Error('Cancelled'))
    },
    onValue: () => futureValue.asPromise(),
  }
}
