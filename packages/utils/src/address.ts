import { privateToAddress, privateToPublic, pubToAddress, toChecksumAddress } from 'ethereumjs-util'

export type Address = string

export function eqAddress(a: Address, b: Address) {
  return a.replace('0x', '').toLowerCase() === b.replace('0x', '').toLowerCase()
}

export const privateKeyToAddress = (privateKey: string) => {
  return toChecksumAddress(
    '0x' + privateToAddress(Buffer.from(privateKey.slice(2), 'hex')).toString('hex')
  )
}

export const publicKeyToAddress = (publicKey: string) => {
  return '0x' + pubToAddress(Buffer.from(publicKey.slice(2), 'hex')).toString('hex')
}

export const privateKeyToPublicKey = (privateKey: string) => {
  return '0x' + privateToPublic(Buffer.from(privateKey.slice(2), 'hex')).toString('hex')
}

export { toChecksumAddress } from 'ethereumjs-util'
