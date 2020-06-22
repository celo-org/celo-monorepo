// adapted from https://www.promisejs.org/generators/
export function promisifyGenerator<T>(generator: Generator<any, T, unknown>) {
  function handle(result: IteratorResult<any, T>): Promise<T> {
    if (result.done) {
      return Promise.resolve(result.value)
    }

    return Promise.resolve(result.value).then(
      (res) => handle(generator.next(res)),
      (err) => handle(generator.throw(err))
    )
  }

  try {
    return handle(generator.next())
  } catch (ex) {
    return Promise.reject(ex)
  }
}
