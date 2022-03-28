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

export const JSONParseErrorType = 'JsonParseError'
// tslint:disable-next-line:max-classes-per-file
export class JSONParseError extends RootError<string> {
  constructor(readonly error: Error) {
    super(JSONParseErrorType)
  }
}
export function parseJsonAsResult(data: string) {
  try {
    return Ok(JSON.parse(data))
  } catch (error: any) {
    return Err(new JSONParseError(error))
  }
}

export function isOk<TResult, TError extends Error>(
  result: Result<TResult, TError>
): result is OkResult<TResult> {
  return result.ok
}

export function isErr<TResult, TError extends Error>(
  result: Result<TResult, TError>
): result is ErrorResult<TError> {
  return !result.ok
}
