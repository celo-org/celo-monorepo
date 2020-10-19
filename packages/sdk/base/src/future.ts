// A Future is like an exernally fulfillable (resolvable) promise
export class Future<T> {
  private promise: Promise<T>
  private _finished = false
  private _error: any = null
  private _resolve!: (value: T) => void
  private _reject!: (err: any) => void

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  get finished() {
    return this._finished
  }

  get error() {
    return this._error
  }

  resolve(value: T): void {
    this._finished = true
    this._error = null
    this._resolve(value)
  }

  reject(error: any): void {
    this._finished = true
    this._error = error
    this._reject(error)
  }

  wait() {
    return this.promise
  }

  asPromise() {
    return this.promise
  }
}

export function toFuture<A>(p: Promise<A>): Future<A> {
  const future = new Future<A>()
  return pipeToFuture(p, future)
}

export function pipeToFuture<A>(p: Promise<A>, future: Future<A>): Future<A> {
  p.then(future.resolve.bind(future)).catch(future.reject.bind(future))
  return future
}
