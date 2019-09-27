import fetch from 'cross-fetch'
import { Either, isRight, left, right } from 'fp-ts/lib/Either'
import { TaskEither, tryCatch } from 'fp-ts/lib/TaskEither'
import { writeFileSync } from 'fs'

export class NetworkError extends Error {}

export function fetchAsTaskEither(url: string) {
  return tryCatch(
    () =>
      fetch(url).then((x) => {
        if (x.ok) {
          return x.text()
        } else {
          throw new Error(`Request failed with status ${x.status}`)
        }
      }),
    (reason: any) => new NetworkError(reason.toString())
  )
}

export function writeToFileSystem(path: string): (str: string) => Either<Error, void> {
  return (str: string) => {
    try {
      return right(writeFileSync(path, str, 'utf-8'))
    } catch (error) {
      return left(new NetworkError(error))
    }
  }
}

export function asClassicPromise<Args extends any[], TaskError extends Error, TaskResult>(
  func: (...args: Args) => TaskEither<TaskError, TaskResult>
): ((...args: Args) => Promise<TaskResult>) {
  return async (...args: Args) => {
    const t = await func(...args)()
    if (isRight(t)) {
      return t.right
    } else {
      throw t.left
    }
  }
}

export function asThrowable<Args extends any[], Err extends Error, Result>(
  func: (...args: Args) => Either<Err, Result>
): ((...args: Args) => Result) {
  return (...args: Args) => {
    const t = func(...args)
    if (isRight(t)) {
      return t.right
    } else {
      throw t.left
    }
  }
}
