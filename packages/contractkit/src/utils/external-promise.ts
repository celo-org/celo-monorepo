export class ExternalPromise<T> extends Promise<T> {
  public resolve!: (value: T) => void
  public reject!: (err: any) => void

  constructor() {
    super((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}
