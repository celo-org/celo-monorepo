const ethjsutil = require('ethereumjs-util')

export function signMessage(messageHash: string, privateKey: string, address: string) {
  const publicKey = ethjsutil.privateToPublic(ethjsutil.toBuffer(privateKey))
  const derivedAddress: string = ethjsutil.bufferToHex(ethjsutil.pubToAddress(publicKey))
  if (derivedAddress.toLowerCase() !== address.toLowerCase()) {
    throw new Error('Provided private key does not match address of intended signer')
  }
  const { r, s, v } = ethjsutil.ecsign(
    ethjsutil.toBuffer(messageHash),
    ethjsutil.toBuffer(privateKey)
  )
  if (
    !isValidSignature(address, messageHash, v, ethjsutil.bufferToHex(r), ethjsutil.bufferToHex(s))
  ) {
    throw new Error('Unable to validate signature')
  }
  return { v, r: ethjsutil.bufferToHex(r), s: ethjsutil.bufferToHex(s) }
}

export interface Signature {
  v: number
  r: string
  s: string
}

export function serializeSignature(signature: Signature) {
  const serializedV = signature.v.toString(16)
  const serializedR = signature.r.slice(2)
  const serializedS = signature.s.slice(2)
  return serializedV + serializedR + serializedS
}

export function parseSignature(messageHash: string, signature: string, signer: string) {
  let { r, s, v } = parseSignatureAsRsv(signature.slice(2))
  if (isValidSignature(signer, messageHash, v, r, s)) {
    return { v, r, s }
  }

  ;({ r, s, v } = parseSignatureAsVrs(signature.slice(2)))
  if (isValidSignature(signer, messageHash, v, r, s)) {
    return { v, r, s }
  }

  throw new Error('Unable to parse signature')
}

function parseSignatureAsVrs(signature: string) {
  let v: number = parseInt(signature.slice(0, 2), 16)
  const r: string = `0x${signature.slice(2, 66)}`
  const s: string = `0x${signature.slice(66, 130)}`
  if (v < 27) {
    v += 27
  }
  return { v, r, s }
}

function parseSignatureAsRsv(signature: string) {
  const r: string = `0x${signature.slice(0, 64)}`
  const s: string = `0x${signature.slice(64, 128)}`
  let v: number = parseInt(signature.slice(128, 130), 16)
  if (v < 27) {
    v += 27
  }
  return { r, s, v }
}

function isValidSignature(signer: string, message: string, v: number, r: string, s: string) {
  try {
    const publicKey = ethjsutil.ecrecover(
      ethjsutil.toBuffer(message),
      v,
      ethjsutil.toBuffer(r),
      ethjsutil.toBuffer(s)
    )
    const retrievedAddress: string = ethjsutil.bufferToHex(ethjsutil.pubToAddress(publicKey))
    return signer.toLowerCase() === retrievedAddress.toLowerCase()
  } catch (err) {
    return false
  }
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

export function isValidAddress(address: string) {
  return (
    typeof address === 'string' &&
    !ethjsutil.isZeroAddress(address) &&
    ethjsutil.isValidAddress(address)
  )
}

export function areAddressesEqual(address1: string | null, address2: string | null) {
  if (address1) {
    address1 = stripHexLeader(address1.toLowerCase())
  }
  if (address2) {
    address2 = stripHexLeader(address2.toLowerCase())
  }
  return address1 === address2
}

export const SignatureUtils = {
  signMessage,
  parseSignature,
  stripHexLeader,
  serializeSignature,
  isValidAddress,
  areAddressesEqual,
}
