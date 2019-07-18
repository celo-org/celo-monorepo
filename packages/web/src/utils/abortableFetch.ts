import fetch from 'cross-fetch'

export default async function abortableFetch(url: string, options = {}) {
  return Promise.race([fetch(url, { ...options }), abort(url)])
}

export async function abort(url: string, milliseconds = 800) {
  return new Promise((_, reject) =>
    setTimeout(() => {
      reject(new Error(`from abortableFetch: Took to Long to Fetch ${url}`))
    }, milliseconds)
  )
}
