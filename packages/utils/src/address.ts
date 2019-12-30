import {
  isValidPrivate,
  privateToAddress,
  privateToPublic,
  pubToAddress,
  toChecksumAddress,
} from 'ethereumjs-util'

export type Address = string

export const eqAddress = (a: Address, b: Address) =>
  trimLeading0x(a).toLowerCase() === trimLeading0x(b).toLowerCase()

export const trimLeading0x = (input: string) => (input.startsWith('0x') ? input.slice(2) : input)

export const ensureLeading0x = (input: string) => (input.startsWith('0x') ? input : `0x${input}`)

export const hexToBuffer = (input: string) => Buffer.from(trimLeading0x(input), 'hex')

export const privateKeyToAddress = (privateKey: string) =>
  toChecksumAddress(ensureLeading0x(privateToAddress(hexToBuffer(privateKey)).toString('hex')))

export const privateKeyToPublicKey = (privateKey: string) =>
  toChecksumAddress(ensureLeading0x(privateToPublic(hexToBuffer(privateKey)).toString('hex')))

export const publicKeyToAddress = (publicKey: string) =>
  toChecksumAddress(ensureLeading0x(pubToAddress(hexToBuffer(publicKey)).toString('hex')))

export const isValidPrivateKey = (privateKey: string) =>
  privateKey.startsWith('0x') && isValidPrivate(hexToBuffer(privateKey))

export { isValidAddress, isValidChecksumAddress, toChecksumAddress } from 'ethereumjs-util'

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
