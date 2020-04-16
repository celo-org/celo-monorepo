export const randomBytes = (str: string, callback: (err: Error | null, res: string) => void) => {
  callback(null, '123')
}

export const asyncRandomBytes = jest.fn(() => '010101010101010101010')
