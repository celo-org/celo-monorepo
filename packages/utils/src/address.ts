import {
  isValidPrivate,
  privateToAddress,
  privateToPublic,
  pubToAddress,
  toChecksumAddress,
} from 'ethereumjs-util'
import * as Web3Utils from 'web3-utils'

const HEX_REGEX = /^0x[0-9A-F]*$/i

export type Address = string

export const eqAddress = (a: Address, b: Address) => normalizeAddress(a) === normalizeAddress(b)

export const normalizeAddress = (a: Address) => trimLeading0x(a).toLowerCase()

export const normalizeAddressWith0x = (a: Address) => ensureLeading0x(a).toLowerCase()

export const trimLeading0x = (input: string) => (input.startsWith('0x') ? input.slice(2) : input)

export const ensureLeading0x = (input: string) => (input.startsWith('0x') ? input : `0x${input}`)

export const isHexString = (input: string) => HEX_REGEX.test(input)

export const hexToBuffer = (input: string) => Buffer.from(trimLeading0x(input), 'hex')

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

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export const findAddressIndex = (address: Address, addresses: Address[]) =>
  addresses.findIndex((x) => eqAddress(x, address))

// Returns an array of indices mapping the entries of oldAddress[] to newAddress[]
export const mapAddressListOnto = (oldAddress: Address[], newAddress: Address[]) => {
  const oldAddressIndex: Array<{
    address: Address
    index: number
  }> = oldAddress.map((x: Address, index: number) => ({ address: normalizeAddress(x), index }))

  const newAddressIndex: Array<{
    address: Address
    index: number
  }> = newAddress.map((x: Address, index: number) => ({ address: normalizeAddress(x), index }))

  oldAddressIndex.sort((a, b) => a.address.localeCompare(b.address))
  newAddressIndex.sort((a, b) => a.address.localeCompare(b.address))
  const res = [...Array(oldAddress.length).fill(-1)]

  for (let i = 0, j = 0; i < oldAddress.length && j < newAddress.length; ) {
    const cmp = oldAddressIndex[i].address.localeCompare(newAddressIndex[j].address)
    if (cmp < 0) {
      i++
    } else if (cmp > 0) {
      j++
    } else {
      // Address is present in both lists
      res[oldAddressIndex[i].index] = newAddressIndex[j].index
      i++
      j++
    }
  }
  return res
}

// Returns data[] reordered by mapAddressListOnto(), and initiaValue for any entry of
// oldAddress[] not present in newAddress[].
export function mapAddressListDataOnto<T>(
  data: T[],
  oldAddress: Address[],
  newAddress: Address[],
  initialValue: T
): T[] {
  const res = [...Array(oldAddress.length).fill(initialValue)]
  if (data.length === 0) {
    return res
  }
  const addressIndexMap = mapAddressListOnto(oldAddress, newAddress)
  for (let i = 0; i < addressIndexMap.length; i++) {
    if (addressIndexMap[i] >= 0) {
      res[addressIndexMap[i]] = data[i]
    }
  }
  return res
}
