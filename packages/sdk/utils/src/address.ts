import { ensureLeading0x, hexToBuffer } from '@celo/base/lib/address'
import {
  isValidPrivate,
  privateToAddress,
  privateToPublic,
  pubToAddress,
  toBuffer,
  toChecksumAddress,
} from 'ethereumjs-util'
// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
export {
  Address,
  bufferToHex,
  ensureLeading0x,
  eqAddress,
  findAddressIndex,
  getAddressChunks,
  hexToBuffer,
  isHexString,
  mapAddressListDataOnto,
  mapAddressListOnto,
  normalizeAddress,
  normalizeAddressWith0x,
  NULL_ADDRESS,
  trimLeading0x,
} from '@celo/base/lib/address'
export { isValidChecksumAddress, toChecksumAddress } from 'ethereumjs-util'

export const privateKeyToAddress = (privateKey: string) =>
  toChecksumAddress(ensureLeading0x(privateToAddress(hexToBuffer(privateKey)).toString('hex')))

export const privateKeyToPublicKey = (privateKey: string) =>
  toChecksumAddress(ensureLeading0x(privateToPublic(hexToBuffer(privateKey)).toString('hex')))

export const publicKeyToAddress = (publicKey: string) =>
  toChecksumAddress(
    ensureLeading0x(pubToAddress(toBuffer(ensureLeading0x(publicKey)), true).toString('hex'))
  )

export const isValidPrivateKey = (privateKey: string) =>
  privateKey.startsWith('0x') && isValidPrivate(hexToBuffer(privateKey))

export const isValidAddress = (input: string): boolean => {
  if ('string' !== typeof input) {
    return false
  }
  if (!/^(0x)?[0-9a-f]{40}$/i.test(input)) {
    return false
  }
  if (/^(0x|0X)?[0-9A-F]{40}$/.test(input.toUpperCase())) {
    return true
  }

  if (toChecksumAddress(input) === input) {
    return true
  }

  return false
}
