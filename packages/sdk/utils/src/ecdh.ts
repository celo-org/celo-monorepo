import { trimLeading0x } from '@celo/base/lib/address'
import { createECDH } from 'crypto'

export function computeSharedSecret(privateKey: string, publicKey: string): Buffer {
  const ecdh = createECDH('secp256k1')
  ecdh.setPrivateKey(Buffer.from(trimLeading0x(privateKey), 'hex'))
  return ecdh.computeSecret(Buffer.from(ensureCompressed(publicKey), 'hex'))
}

export function isCompressed(publicKey: string) {
  const noLeading0x = trimLeading0x(publicKey)
  if (noLeading0x.length === 64) {
    return true
  }
  return noLeading0x.length === 66 && (noLeading0x.startsWith('02') || noLeading0x.startsWith('03'))
}

export function ensureCompressed(publicKey: string): string {
  // NOTE: elliptic is disabled elsewhere in this library to prevent
  // accidental signing of truncated messages.
  // tslint:disable-next-line:import-blacklist
  const EC = require('elliptic').ec
  const ec = new EC('secp256k1')
  return ec.keyFromPublic(ensureUncompressedPrefix(publicKey), 'hex').getPublic(true, 'hex')
}

export function ensureUncompressed(publicKey: string) {
  const noLeading0x = trimLeading0x(publicKey)
  // NOTE: elliptic is disabled elsewhere in this library to prevent
  // accidental signing of truncated messages.
  // tslint:disable-next-line:import-blacklist
  const EC = require('elliptic').ec
  const ec = new EC('secp256k1')
  const uncompressed = ec
    .keyFromPublic(ensureUncompressedPrefix(noLeading0x), 'hex')
    .getPublic(false, 'hex')
  return uncompressed
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
