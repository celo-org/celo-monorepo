import { trimLeading0x } from '@celo/base/lib/address'
import { createECDH } from 'crypto'

export function computeSharedSecret(privateKey: string, publicKey: string): Buffer {
  const ecdh = createECDH('secp256k1')
  ecdh.setPrivateKey(Buffer.from(trimLeading0x(privateKey), 'hex'))
  return ecdh.computeSecret(Buffer.from(ensurePublicKeyPrefix(publicKey), 'hex'))
}

function ensurePublicKeyPrefix(publicKey: string): string {
  const noLeading0x = trimLeading0x(publicKey)
  return noLeading0x.startsWith('04') ? noLeading0x : '04' + noLeading0x
}

export function trimPublicKeyPrefix(publicKey: string): string {
  const noLeading0x = trimLeading0x(publicKey)
  return noLeading0x.startsWith('04') ? noLeading0x.slice(2) : noLeading0x
}
