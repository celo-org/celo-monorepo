import * as Web3Utils from 'web3-utils'
import { eqAddress, privateKeyToAddress } from './address'

export const POP_SIZE = 65

const ethjsutil = require('ethereumjs-util')

// If messages is a hex, the length of it should be the number of bytes
function messageLength(message: string) {
  if (Web3Utils.isHexStrict(message)) {
    return (message.length - 2) / 2
  }
  return message.length
}
// Ethereum has a special signature format that requires a prefix
// https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
export function hashMessageWithPrefix(message: string) {
  const prefix = '\x19Ethereum Signed Message:\n' + messageLength(message)
  return Web3Utils.soliditySha3(prefix, message)
}

export function hashMessage(message: string): string {
  return Web3Utils.soliditySha3({ type: 'string', value: message })
}

export interface Signer {
  sign: (message: string) => Promise<string>
}

export async function addressToPublicKey(
  signer: string,
  signFn: (message: string, signer: string) => Promise<string>
) {
  const msg = new Buffer('dummy_msg_data')
  const data = '0x' + msg.toString('hex')
  // Note: Eth.sign typing displays incorrect parameter order
  const sig = await signFn(data, signer)

  const rawsig = ethjsutil.fromRpcSig(sig)
  const prefixedMsg = hashMessageWithPrefix(data)
  const pubKey = ethjsutil.ecrecover(
    Buffer.from(prefixedMsg.slice(2), 'hex'),
    rawsig.v,
    rawsig.r,
    rawsig.s
  )

  const computedAddr = ethjsutil.pubToAddress(pubKey).toString('hex')
  if (!eqAddress(computedAddr, signer)) {
    throw new Error('computed address !== signer')
  }

  return '0x' + pubKey.toString('hex')
}

// Uses a native function to sign (as signFn), most commonly `web.eth.sign`
export function NativeSigner(
  signFn: (message: string, signer: string) => Promise<string>,
  signer: string
): Signer {
  return {
    sign: async (message: string) => {
      return signFn(message, signer)
    },
  }
}
export function LocalSigner(privateKey: string): Signer {
  return {
    sign: async (message: string) =>
      Promise.resolve(
        serializeSignature(signMessage(message, privateKey, privateKeyToAddress(privateKey)))
      ),
  }
}

export function signedMessageToPublicKey(message: string, v: number, r: string, s: string) {
  const pubKeyBuf = ethjsutil.ecrecover(
    Buffer.from(message.slice(2), 'hex'),
    v,
    Buffer.from(r.slice(2), 'hex'),
    Buffer.from(s.slice(2), 'hex')
  )
  return '0x' + pubKeyBuf.toString('hex')
}

export function signMessage(message: string, privateKey: string, address: string) {
  return signMessageWithoutPrefix(hashMessageWithPrefix(message), privateKey, address)
}

export function signMessageWithoutPrefix(messageHash: string, privateKey: string, address: string) {
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
  return '0x' + serializedV + serializedR + serializedS
}

export function verifySignature(message: string, signature: string, signer: string) {
  try {
    parseSignature(message, signature, signer)
    return true
  } catch (error) {
    return false
  }
}

export function parseSignature(message: string, signature: string, signer: string) {
  return parseSignatureWithoutPrefix(hashMessageWithPrefix(message), signature, signer)
}

export function parseSignatureWithoutPrefix(
  messageHash: string,
  signature: string,
  signer: string
) {
  let { r, s, v } = parseSignatureAsRsv(signature.slice(2))
  if (isValidSignature(signer, messageHash, v, r, s)) {
    return { v, r, s }
  }

  ;({ r, s, v } = parseSignatureAsVrs(signature.slice(2)))
  if (isValidSignature(signer, messageHash, v, r, s)) {
    return { v, r, s }
  }

  throw new Error(`Unable to parse signature (expected signer ${signer})`)
}

export function guessSigner(message: string, signature: string): string {
  const messageHash = hashMessageWithPrefix(message)
  const { r, s, v } = parseSignatureAsRsv(signature.slice(2))
  const publicKey = ethjsutil.ecrecover(
    ethjsutil.toBuffer(messageHash),
    v,
    ethjsutil.toBuffer(r),
    ethjsutil.toBuffer(s)
  )
  return ethjsutil.bufferToHex(ethjsutil.pubToAddress(publicKey))
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
    return eqAddress(retrievedAddress, signer)
  } catch (err) {
    return false
  }
}

export const SignatureUtils = {
  NativeSigner,
  LocalSigner,
  signMessage,
  signMessageWithoutPrefix,
  parseSignature,
  parseSignatureWithoutPrefix,
  serializeSignature,
}
