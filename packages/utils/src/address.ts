import { privateToAddress, toChecksumAddress } from 'ethereumjs-util'

export type Address = string

export function eqAddress(a: Address, b: Address) {
  return a.replace('0x', '').toLowerCase() === b.replace('0x', '').toLowerCase()
}

export const privateKeyToAddress = (privateKey: string) => {
  return toChecksumAddress(
    '0x' + privateToAddress(Buffer.from(privateKey.slice(2), 'hex')).toString('hex')
  )
}
