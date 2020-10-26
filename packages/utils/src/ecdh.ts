import { trimLeading0x } from '@celo/base/lib/address'
import { createECDH, ECDH } from 'crypto'

const { convertKey } = ECDH

export function computeSharedSecret(privateKey: string, publicKey: string): Buffer {
  const ecdh = createECDH('secp256k1')
  ecdh.setPrivateKey(Buffer.from(trimLeading0x(privateKey), 'hex'))
  return ecdh.computeSecret(Buffer.from(ensureCompressed(publicKey), 'hex'))
}

export function ensureCompressed(publicKey: string): string {
  // convertKey doesn't accept decompressed public keys without
  // the 04 prefix
  return convertKey(
    ensureUncompressedPrefix(publicKey),
    'secp256k1',
    'hex',
    'hex',
    'compressed'
  ) as string
}

export function ensureUncompressed(publicKey: string) {
  return convertKey(
    ensureUncompressedPrefix(publicKey),
    'secp256k1',
    'hex',
    'hex',
    'uncompressed'
  ) as string
}

export function trimUncompressedPrefix(publicKey: string) {
  const noLeading0x = trimLeading0x(publicKey)
  if (noLeading0x.length === 130 && noLeading0x.startsWith('04')) {
    return noLeading0x.slice(2)
  }
  return noLeading0x
}

function ensureUncompressedPrefix(publicKey: string): string {
  const noLeading0x = trimLeading0x(publicKey)
  if (noLeading0x.length === 128) {
    return `04${noLeading0x}`
  }
  return noLeading0x
}
