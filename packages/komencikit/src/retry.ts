import { Result, RootError } from '@celo/base/lib/result'

export interface RetryOptions<TArgs, TError> {
  tries: number
  bailOnErrorTypes?: any[]
  shouldRetry?: (error: TError) => boolean
  onRetry?: (args: TArgs, error: TError, attempt: number) => void
}

export type Retryable<TArgs extends any[], TResult, TError extends RootError<any>> = (
  ...args: TArgs
) => Promise<Result<TResult, TError>>

export const retry = <TArgs extends any[], TError extends RootError<any>>(
  options: RetryOptions<TArgs, TError>
) => {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<Retryable<TArgs, any, TError>>
  ) => {
    const actual = descriptor.value
    if (!actual) {
      throw Error('@retry used on an method which is undefined')
    }
    descriptor.value = async function(...args: TArgs): Promise<Result<any, TError>> {
      let tries = 1
      while (true) {
        const res = await actual.apply(this, args)
        if (res.ok) {
          return res
        }

        if (options.onRetry) {
          options.onRetry.call(target, args, res.error, tries)
        }

        if (tries === options.tries) {
          return res
        }

        if (options.bailOnErrorTypes) {
          if (options.bailOnErrorTypes.indexOf(res.error.errorType) > -1) {
            return res
          }
        }

        if (options.shouldRetry && options.shouldRetry.call(target, res.error) === false) {
          return res
        }

        tries += 1
      }
    }

    return {
      configurable: true,
      get(this: Retryable<TArgs, any, TError>) {
        if (!descriptor.value) {
          throw Error('@retry used on an method which is undefined')
        }
        // @ts-ignore
        const value = descriptor.value.bind(this)
        Object.defineProperty(this, propertyKey, {
          value,
          configurable: true,
          writable: true,
        })
        return value
      },
    }
  }
}
