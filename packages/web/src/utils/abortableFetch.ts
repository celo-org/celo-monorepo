export default async function abortableFetch(url: string, options = {}) {
  return Promise.race([fetch(url, { ...options }), abort(url)])
}

export async function abort(message: string, milliseconds = 3000) {
  return new Promise((_, reject) =>
    setTimeout(() => {
      reject(new Error(`from abortableFetch: Took to Long to Fetch ${message}`))
    }, milliseconds)
  )
}
