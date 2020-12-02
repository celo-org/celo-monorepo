import { sleep } from './async'
import { conditionWatcher, repeatTask, RepeatTaskContext, tryObtainValueWithRetries } from './task'

describe('repeatTask()', () => {
  test("should repeat task until it't stopped", async () => {
    const fn = jest.fn().mockResolvedValue(null)

    const task = repeatTask(
      {
        name: 'testTask',
        timeInBetweenMS: 10,
      },
      fn
    )

    await sleep(15)
    const currentCalls = fn.mock.calls.length
    task.stop()
    await sleep(10)
    expect(task.isRunning()).toBeFalsy()
    expect(fn).toBeCalledTimes(currentCalls)
  })

  test('should keep repeating even if task fails', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'))

    const task = repeatTask(
      {
        name: 'testTask',
        timeInBetweenMS: 10,
      },
      fn
    )
    await sleep(35)
    expect(fn.mock.calls.length).toBeGreaterThan(1)
    task.stop()
  })

  test('should set and increment execution number', async () => {
    const executionsNumbers: number[] = []
    const fn = jest.fn(async (ctx: RepeatTaskContext) => {
      executionsNumbers.push(ctx.executionNumber)
    })

    const task = repeatTask(
      {
        name: 'testTask',
        timeInBetweenMS: 10,
      },
      fn
    )

    await sleep(35)
    task.stop()

    for (let i = 0; i < executionsNumbers.length; i++) {
      expect(executionsNumbers[i]).toBe(i + 1)
    }
  })

  test('should call logger with taskName prefix', async () => {
    const fn = async (ctx: RepeatTaskContext) => {
      ctx.stopTask()
      throw new Error('MESSAGE')
    }

    const logger = jest.fn()
    repeatTask(
      {
        name: 'testTask',
        timeInBetweenMS: 10,
        logger,
      },
      fn
    )
    await sleep(5)
    expect(logger.mock.calls.length).toBeGreaterThan(0)
    for (const call of logger.mock.calls) {
      expect(call[0]).toBe('testTask:: ')
    }
  })

  test('should be able to stop repetitions from ctx', async () => {
    const fn = jest.fn(async (ctx: RepeatTaskContext) => {
      if (ctx.executionNumber === 2) {
        ctx.stopTask()
      }
    })

    const task = repeatTask(
      {
        name: 'testTask',
        timeInBetweenMS: 10,
      },
      fn
    )

    await sleep(25)
    expect(task.isRunning()).toBeFalsy()
    expect(fn).toBeCalledTimes(2)
  })

  test('should use initialDelayMS', async () => {
    const fn = jest.fn().mockResolvedValue(null)

    const task = repeatTask(
      {
        name: 'testTask',
        initialDelayMS: 10,
        timeInBetweenMS: 10,
      },
      fn
    )

    await sleep(2)
    expect(fn).toHaveBeenCalledTimes(0)
    await sleep(10)
    expect(fn).toHaveBeenCalledTimes(1)
    task.stop()
  })
})

describe('conditionWatcher()', () => {
  test('will execute onSuccess when condition triggers', async () => {
    const pollCondition = jest
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
    const onSuccess = jest.fn()

    const task = conditionWatcher({
      name: 'testCondition',
      onSuccess,
      pollCondition,
      timeInBetweenMS: 10,
    })

    await sleep(25)
    expect(task.isRunning()).toBeFalsy()
    expect(onSuccess).toHaveBeenCalled()
    expect(pollCondition).toHaveBeenCalledTimes(2)
  })

  test('will work ok if pollCondition throws', async () => {
    const pollCondition = jest
      .fn()
      .mockRejectedValueOnce(new Error('pepe'))
      .mockResolvedValueOnce(true)
    const onSuccess = jest.fn()

    const task = conditionWatcher({
      name: 'testCondition',
      onSuccess,
      pollCondition,
      timeInBetweenMS: 10,
    })

    await sleep(25)
    expect(task.isRunning()).toBeFalsy()
    expect(onSuccess).toHaveBeenCalled()
    expect(pollCondition).toHaveBeenCalledTimes(2)
  })

  test('will work ok if onSuccess throws', async () => {
    const pollCondition = jest.fn().mockResolvedValue(true)
    const onSuccess = jest.fn().mockRejectedValue(new Error('fail'))

    const task = conditionWatcher({
      name: 'testCondition',
      onSuccess,
      pollCondition,
      timeInBetweenMS: 10,
    })

    await sleep(25)
    expect(task.isRunning()).toBeFalsy()
    expect(onSuccess).toHaveBeenCalled()
  })
})

describe('tryObtainValueWithRetries()', () => {
  test('will return value if suceeds before retries expires', async () => {
    const task = tryObtainValueWithRetries({
      name: 'testGet',
      maxAttemps: 2,
      tryGetValue: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('HELLO'),
      timeInBetweenMS: 7,
    })

    await expect(task.onValue()).resolves.toBe('HELLO')
  })

  test('will reject on maxAttemps', async () => {
    const task = tryObtainValueWithRetries({
      name: 'testGet',
      maxAttemps: 2,
      tryGetValue: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('HELLO'),
      timeInBetweenMS: 7,
    })

    await expect(task.onValue()).rejects.toThrow('Max Retries')
  })

  test('works on when tryGetValue throws', async () => {
    const task = tryObtainValueWithRetries({
      name: 'testGet',
      maxAttemps: 2,
      tryGetValue: jest
        .fn()
        .mockRejectedValueOnce(new Error('error'))
        .mockResolvedValueOnce('HELLO'),
      timeInBetweenMS: 7,
    })

    await expect(task.onValue()).resolves.toBe('HELLO')
  })

  test('stops when task.stop() is called', async () => {
    const tryGetValue = jest.fn().mockResolvedValue(null)
    const task = tryObtainValueWithRetries({
      name: 'testGet',
      maxAttemps: 15,
      tryGetValue,
      timeInBetweenMS: 7,
    })

    await sleep(15)
    task.stop()
    await expect(task.onValue()).rejects.toThrow('Cancelled')
    const currentCalls = tryGetValue.mock.calls.length
    await sleep(10)
    expect(tryGetValue).toHaveBeenCalledTimes(currentCalls)
    expect(task.isRunning()).toBeFalsy()
  })
})
