export enum TaskStatus {
  Ok = 'ok',
  Error = 'Error',
}
export interface OKTask<TResult> {
  status: TaskStatus.Ok
  result: TResult
}
export interface FailedTask<TError> {
  status: TaskStatus.Error
  error: TError
}

export type Task<TResult, TError> = OKTask<TResult> | FailedTask<TError>

export const Ok = <TResult>(result: TResult): OKTask<TResult> => ({ status: TaskStatus.Ok, result })
export const Err = <TError>(error: TError): FailedTask<TError> => ({
  status: TaskStatus.Error,
  error,
})

export function isError<TResult, TError>(task: Task<TResult, TError>): task is FailedTask<TError> {
  return task.status === TaskStatus.Error
}
export function isResult<TResult, TError>(task: Task<TResult, TError>): task is OKTask<TResult> {
  return task.status === TaskStatus.Ok
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
