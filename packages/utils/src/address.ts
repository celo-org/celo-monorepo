import {
  isValidPrivate,
  privateToAddress,
  privateToPublic,
  pubToAddress,
  toChecksumAddress,
} from 'ethereumjs-util'

export type Address = string

export function eqAddress(a: Address, b: Address) {
  return stripHexLeader(a).toLowerCase() === stripHexLeader(b).toLowerCase()
}

export const privateKeyToAddress = (privateKey: string) => {
  return toChecksumAddress(
    ensureHexLeader(
      privateToAddress(Buffer.from(stripHexLeader(privateKey), 'hex')).toString('hex')
    )
  )
}

export const privateKeyToPublicKey = (privateKey: string) => {
  return toChecksumAddress(
    ensureHexLeader(privateToPublic(Buffer.from(stripHexLeader(privateKey), 'hex')).toString('hex'))
  )
}

export const publicKeyToAddress = (publicKey: string) => {
  return toChecksumAddress(
    ensureHexLeader(pubToAddress(Buffer.from(stripHexLeader(publicKey), 'hex')).toString('hex'))
  )
}

/**
 * Strips out the leading '0x' from a hex string. Does not fail on a string that does not
 * contain a leading '0x'
 *
 * @param hexString Hex string that may have '0x' prepended to it.
 * @returns hexString with no leading '0x'.
 */
export function stripHexLeader(hexString: string): string {
  return hexString.indexOf('0x') === 0 ? hexString.slice(2) : hexString
}

/**
 * Returns a hex string with 0x prepended if it's not already starting with 0x
 */
export function ensureHexLeader(hexString: string): string {
  return '0x' + stripHexLeader(hexString)
}
export const isValidPrivateKey = (privateKey: string) =>
  privateKey.startsWith('0x') && isValidPrivate(Buffer.from(privateKey.slice(2), 'hex'))

export { isValidAddress } from 'ethereumjs-util'
export { toChecksumAddress } from 'ethereumjs-util'
export { isValidChecksumAddress } from 'ethereumjs-util'
