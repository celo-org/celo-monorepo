export interface OkResult<TResult> {
  ok: true
  result: TResult
}
export interface ErrorResult<TError extends Error> {
  ok: false
  error: TError
}

export type Result<TResult, TError extends Error> = OkResult<TResult> | ErrorResult<TError>

export const Ok = <TResult>(result: TResult): OkResult<TResult> => ({
  ok: true,
  result,
})
export const Err = <TError extends Error>(error: TError): ErrorResult<TError> => ({
  ok: false,
  error,
})

export function throwIfError<TResult, TError extends Error, TModifiedError extends Error>(
  result: Result<TResult, TError>,
  errorModifier?: (error: TError) => TModifiedError
) {
  if (!result.ok) {
    if (errorModifier) {
      throw errorModifier(result.error)
    }
    throw result.error
  }

  return result.result
}

export function makeThrowable<
  TArgs extends any[],
  TResult,
  TError extends Error,
  TModifiedError extends Error
>(
  f: (...args: TArgs) => Result<TResult, TError>,
  errorModifier?: (error: TError) => TModifiedError
) {
  return (...args: TArgs) => throwIfError(f(...args), errorModifier)
}

export function makeAsyncThrowable<
  TArgs extends any[],
  TResult,
  TError extends Error,
  TModifiedError extends Error
>(
  f: (...args: TArgs) => Promise<Result<TResult, TError>>,
  errorModifier?: (error: TError) => TModifiedError
) {
  return async (...args: TArgs) => {
    const result = await f(...args)
    return throwIfError(result, errorModifier)
  }
}

export interface BaseError<T> {
  errorType: T
}

export class RootError<T> extends Error implements BaseError<T> {
  constructor(readonly errorType: T) {
    super()
    // @ts-ignore
    if (errorType.toString) {
      // @ts-ignore
      this.name = errorType.toString()
    }
  }
}
