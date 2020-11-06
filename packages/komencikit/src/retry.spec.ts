import { Err, Ok, Result, RootError } from '@celo/base/lib/result'
import { retry, Retryable, RetryOptions } from './retry'

const buildTestInstanceWithOptions = <TArgs extends any[], TResult, TError extends RootError<any>>(
  options: RetryOptions<TArgs, TError>,
  implementation: Retryable<TArgs, TResult, TError>
) => {
  class TestClass {
    someAttribute = 'test'

    impl = (...args: TArgs): Promise<Result<TResult, TError>> => {
      return implementation(...args)
    }

    @retry(options)
    async testMethod(...args: TArgs): Promise<Result<TResult, TError>> {
      return this.impl(...args)
    }
  }

  return new TestClass()
}

class TestError extends RootError<'TestError'> {
  constructor() {
    super('TestError')
  }
}

class BailError extends RootError<'BailError'> {
  constructor() {
    super('BailError')
  }
}

const alwaysReturn = <TResult, TError extends RootError<any>>(value: Result<TResult, TError>) => {
  return jest.fn().mockResolvedValue(value)
}

const returnFromList = <TResult, TError extends RootError<any>>(
  values: Array<Result<TResult, TError>>
) => {
  const impl = jest.fn().mockImplementation(() => {
    return Promise.resolve(values[impl.mock.calls.length - 1])
  })
  return impl
}

describe('retry Decorator', () => {
  describe('when called using call', () => {
    it('works', async () => {
      const impl = alwaysReturn(Ok(true))

      const instance = buildTestInstanceWithOptions(
        {
          tries: 4,
        },
        impl
      )
      const fn = instance.testMethod

      await expect(fn.call(null)).resolves.toEqual(Ok(true))
      expect(impl).toHaveBeenCalledTimes(1)
    })
  })
  describe('options:tries', () => {
    describe('when the function fails all the time', () => {
      it('retries a given number of times then returns the error', async () => {
        const impl = alwaysReturn(Err(new TestError()))

        const instance = buildTestInstanceWithOptions(
          {
            tries: 4,
          },
          impl
        )

        await expect(instance.testMethod()).resolves.toEqual(Err(new TestError()))
        expect(impl).toHaveBeenCalledTimes(4)
      })
    })

    describe('when the function succeeds after a few errors', () => {
      it('retries and returns the result', async () => {
        const impl = returnFromList([Err(new TestError()), Err(new TestError()), Ok('value')])

        const instance = buildTestInstanceWithOptions(
          {
            tries: 4,
          },
          impl
        )

        await expect(instance.testMethod()).resolves.toEqual(Ok('value'))
        expect(impl).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('options:bailOnErrorTypes', () => {
    it('should bail when encountering the specified error type', async () => {
      const impl = returnFromList<string, TestError | BailError>([
        Err(new TestError()),
        Err(new BailError()),
      ])

      const instance = buildTestInstanceWithOptions(
        {
          tries: 4,
          bailOnErrorTypes: ['BailError'],
        },
        impl
      )

      await expect(instance.testMethod()).resolves.toEqual(Err(new BailError()))
      expect(impl).toHaveBeenCalledTimes(2)
    })
  })

  describe('options:shouldRetry', () => {
    it('does not continue depending on the result', async () => {
      const impl = returnFromList<string, TestError | BailError>([
        Err(new TestError()),
        Err(new BailError()),
      ])

      const shouldRetry = (error: RootError<any>) => {
        return error.errorType !== 'BailError'
      }

      const instance = buildTestInstanceWithOptions(
        {
          tries: 4,
          shouldRetry,
        },
        impl
      )

      await expect(instance.testMethod()).resolves.toEqual(Err(new BailError()))
      expect(impl).toHaveBeenCalledTimes(2)
    })
  })

  describe('options:onRetry', () => {
    it('is called after each unsuccessful try', async () => {
      const impl = alwaysReturn(Err(new TestError()))
      const onRetry = jest.fn()
      const instance = buildTestInstanceWithOptions(
        {
          tries: 4,
          onRetry,
        },
        impl
      )

      await expect(instance.testMethod()).resolves.toEqual(Err(new TestError()))
      expect(impl).toHaveBeenCalledTimes(4)
      expect(onRetry).toHaveBeenCalledTimes(4)
    })
  })
})
