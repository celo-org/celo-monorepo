import * as base from '@celo/base/lib/address'
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
export import Address = base.Address
export import eqAddress = base.eqAddress
export import normalizeAddress = base.normalizeAddress
export import normalizeAddressWith0x = base.normalizeAddressWith0x
export import trimLeading0x = base.trimLeading0x
export import ensureLeading0x = base.ensureLeading0x
export import getAddressChunks = base.getAddressChunks
export import isHexString = base.isHexString
export import hexToBuffer = base.hexToBuffer
export import bufferToHex = base.bufferToHex
export import NULL_ADDRESS = base.NULL_ADDRESS
export import findAddressIndex = base.findAddressIndex
export import mapAddressListOnto = base.mapAddressListOnto
export import mapAddressListDataOnto = base.mapAddressListDataOnto

export const privateKeyToAddress = (privateKey: string) =>
  toChecksumAddress(ensureLeading0x(privateToAddress(hexToBuffer(privateKey)).toString('hex')))

export const privateKeyToPublicKey = (privateKey: string) =>
  toChecksumAddress(ensureLeading0x(privateToPublic(hexToBuffer(privateKey)).toString('hex')))

export const publicKeyToAddress = (publicKey: string) =>
  toChecksumAddress(ensureLeading0x(pubToAddress(hexToBuffer(publicKey)).toString('hex')))

export const isValidPrivateKey = (privateKey: string) =>
  privateKey.startsWith('0x') && isValidPrivate(hexToBuffer(privateKey))

export { isValidChecksumAddress, toChecksumAddress } from 'ethereumjs-util'

export const isValidAddress = (input: string): boolean => Web3Utils.isAddress(input)
