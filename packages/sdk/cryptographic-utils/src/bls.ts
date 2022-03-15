// this is an implementation of a subset of BLS12-377
import { isValidAddress } from '@celo/utils/lib/address'
import { BLS } from 'bls12377js'
import { keccak256 } from 'ethereumjs-util'
const BigInteger = require('bigi')
const reverse = require('buffer-reverse')

const n = BigInteger.fromHex('12ab655e9a2ca55660b44d1e5c37b00159aa76fed00000010a11800000000001', 16)

const MODULUSMASK = 31
export const BLS_PUBLIC_KEY_SIZE = 96
export const BLS_POP_SIZE = 48

export const blsPrivateKeyToProcessedPrivateKey = (privateKeyHex: string) => {
  for (let i = 0; i < 256; i++) {
    const originalPrivateKeyBytes = Buffer.from(privateKeyHex, 'hex')

    const iBuffer = new Buffer(1)
    iBuffer[0] = i
    const keyBytes = Buffer.concat([
      Buffer.from('ecdsatobls', 'utf8'),
      iBuffer,
      originalPrivateKeyBytes,
    ])
    const privateKeyBLSBytes = keccak256(keyBytes)

    // tslint:disable-next-line:no-bitwise
    privateKeyBLSBytes[0] &= MODULUSMASK

    const privateKeyNum = BigInteger.fromBuffer(privateKeyBLSBytes)
    if (privateKeyNum.compareTo(n) >= 0) {
      continue
    }

    const privateKeyBytes = reverse(privateKeyNum.toBuffer())

    return privateKeyBytes
  }

  throw new Error("couldn't derive BLS key from ECDSA key")
}

const getBlsPrivateKey = (privateKeyHex: string) => {
  const blsPrivateKeyBytes = blsPrivateKeyToProcessedPrivateKey(privateKeyHex.slice(2))
  return blsPrivateKeyBytes
}

export const getBlsPublicKey = (privateKeyHex: string) => {
  const blsPrivateKeyBytes = getBlsPrivateKey(privateKeyHex)
  return '0x' + BLS.privateToPublicBytes(blsPrivateKeyBytes).toString('hex')
}

export const getBlsPoP = (address: string, privateKeyHex: string) => {
  if (!isValidAddress(address)) {
    throw new Error('Invalid checksum address for generating BLS proof-of-possession')
  }
  const blsPrivateKeyBytes = getBlsPrivateKey(privateKeyHex)
  return (
    '0x' + BLS.signPoP(blsPrivateKeyBytes, Buffer.from(address.slice(2), 'hex')).toString('hex')
  )
}
