import {
  isValidPrivate,
  privateToAddress,
  privateToPublic,
  pubToAddress,
  toChecksumAddress,
} from 'ethereumjs-util'

export type Address = string

export function eqAddress(a: Address, b: Address) {
  return trimLeading0x(a).toLowerCase() === trimLeading0x(b).toLowerCase()
}

export function trimLeading0x(input: string) {
  return input.startsWith('0x') ? input.slice(2) : input
}

export function ensureLeading0x(input: string) {
  return input.startsWith('0x') ? input : `0x${input}`
}

export const privateKeyToAddress = (privateKey: string) => {
  return toChecksumAddress(
    ensureLeading0x(privateToAddress(Buffer.from(trimLeading0x(privateKey), 'hex')).toString('hex'))
  )
}

export const privateKeyToPublicKey = (privateKey: string) => {
  return toChecksumAddress(
    ensureLeading0x(privateToPublic(Buffer.from(trimLeading0x(privateKey), 'hex')).toString('hex'))
  )
}

export const publicKeyToAddress = (publicKey: string) => {
  return toChecksumAddress(
    ensureLeading0x(pubToAddress(Buffer.from(trimLeading0x(publicKey), 'hex')).toString('hex'))
  )
}

export const isValidPrivateKey = (privateKey: string) =>
  privateKey.startsWith('0x') && isValidPrivate(Buffer.from(privateKey.slice(2), 'hex'))

export { isValidAddress, isValidChecksumAddress, toChecksumAddress } from 'ethereumjs-util'
