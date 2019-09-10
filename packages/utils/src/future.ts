export class Future<T> {
  public resolve!: (value: T) => void
  public reject!: (err: any) => void

  private promise: Promise<T>

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  wait() {
    return this.promise
  }
}
