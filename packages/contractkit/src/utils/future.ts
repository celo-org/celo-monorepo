export class Future<T> {
  public resolve!: (val: T) => void
  public reject!: (err: any) => void
  private readonly _promise: Promise<T>

  constructor() {
    this._promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  wait(): Promise<T> {
    return this._promise
  }
}
