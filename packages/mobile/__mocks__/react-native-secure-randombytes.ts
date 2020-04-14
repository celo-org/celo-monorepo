export const randomBytes = (size: number, callback: (err: Error | null, buf: Buffer) => void) => {
  callback(null, new Buffer('123', 'base64'))
}

export function asyncRandomBytes(size: number) {
  return new Promise((resolve, reject) => {
    randomBytes(size, (err, bytes) => {
      if (err) {
        reject(err)
      } else {
        resolve(bytes)
      }
    })
  })
}
