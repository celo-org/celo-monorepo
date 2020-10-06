import { ensureLeading0x, hexToBuffer } from '@celo/base/lib/address'
import {
  isValidPrivate,
  privateToAddress,
  privateToPublic,
  pubToAddress,
  toChecksumAddress,
} from 'ethereumjs-util'
import * as Web3Utils from 'web3-utils'

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
  toChecksumAddress(ensureLeading0x(pubToAddress(hexToBuffer(publicKey)).toString('hex')))

export const isValidPrivateKey = (privateKey: string) =>
  privateKey.startsWith('0x') && isValidPrivate(hexToBuffer(privateKey))

export const isValidAddress = (input: string): boolean => Web3Utils.isAddress(input)
