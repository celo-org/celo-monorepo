export enum ResultStatus {
  Ok = 'Ok',
  Error = 'Error',
}
export interface OkResult<TResult> {
  status: ResultStatus.Ok
  result: TResult
}
export interface ErrorResult<TError> {
  status: ResultStatus.Error
  error: TError
}

export type Result<TResult, TError> = OkResult<TResult> | ErrorResult<TError>

export const Ok = <TResult>(result: TResult): OkResult<TResult> => ({
  status: ResultStatus.Ok,
  result,
})
export const Err = <TError>(error: TError): ErrorResult<TError> => ({
  status: ResultStatus.Error,
  error,
})

export function isError<TResult, TError>(
  result: Result<TResult, TError>
): result is ErrorResult<TError> {
  return result.status === ResultStatus.Error
}
export function isOk<TResult, TError>(task: Result<TResult, TError>): task is OkResult<TResult> {
  return task.status === ResultStatus.Ok
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
