import * as ethjsutil from 'ethereumjs-util'
import scrypt from 'scrypt-js'
// @ts-ignore
import * as Web3Utils from 'web3-utils'
import { getAttestations } from './config'

export function parseBase64(source: string) {
  return ethjsutil.bufferToHex(Buffer.from(source, 'base64'))
}

// TODO: Copied from @celo/utils, should be removed once usable as a dependency
function isE164Number(phoneNumber: string) {
  const E164RegEx = /^\+[1-9][0-9]{1,14}$/
  return E164RegEx.test(phoneNumber)
}

// TODO: Copied from @celo/utils, should be removed once usable as a dependency
export const SCRYPT_PARAMS = {
  salt: 'nNWKc3l0a1fAj0r35BLGB8kn',
  N: 512,
  r: 16,
  p: 1,
  dkLen: 32,
}
export function getPhoneHash(phoneNumber: string) {
  if (!phoneNumber || !isE164Number(phoneNumber)) {
    throw Error('Attempting to hash a non-e164 number: ' + phoneNumber)
  }
  return new Promise<string>((resolve) => {
    const phoneNumberText = `tel://${phoneNumber}`
    scrypt(
      Buffer.from(phoneNumberText.normalize('NFKC')),
      Buffer.from(SCRYPT_PARAMS.salt.normalize('NFKC')),
      SCRYPT_PARAMS.N,
      SCRYPT_PARAMS.r,
      SCRYPT_PARAMS.p,
      SCRYPT_PARAMS.dkLen,
      (error: any, progress: any, key: any) => {
        if (error) {
          throw Error(`Unable to hash ${phoneNumber}, error: ${error}`)
        } else if (key) {
          let hexHash = ''
          for (const item of key) {
            hexHash += item.toString(16)
          }

          // @ts-ignore
          resolve(hexHash.padStart(64, '0'))
        } else if (progress) {
          // do nothing
        }
      }
    )
  })
}

// TODO: Copied from @celo/utils, should be removed once usable as a dependency
function attestationMessageToSign(phoneHash: string, account: string) {
  const messageHash: string = Web3Utils.soliditySha3(
    { type: 'bytes32', value: phoneHash },
    { type: 'address', value: account }
  )
  return messageHash
}

// TODO: Copied from @celo/utils, should be removed once usable as a dependency
function parseSignatureAsVrs(signature: string) {
  let v: number = parseInt(signature.slice(0, 2), 16)
  const r: string = `0x${signature.slice(2, 66)}`
  const s: string = `0x${signature.slice(66, 130)}`
  if (v < 27) {
    v += 27
  }
  return { v, r, s }
}

// TODO: Copied from @celo/utils, should be removed once usable as a dependency
function parseSignatureAsRsv(signature: string) {
  const r: string = `0x${signature.slice(0, 64)}`
  const s: string = `0x${signature.slice(64, 128)}`
  let v: number = parseInt(signature.slice(128, 130), 16)
  if (v < 27) {
    v += 27
  }
  return { r, s, v }
}

// TODO: Copied from @celo/utils, should be removed once usable as a dependency
function isValidSignature(signer: string, message: string, v: number, r: string, s: string) {
  try {
    const publicKey = ethjsutil.ecrecover(
      ethjsutil.toBuffer(message),
      v,
      ethjsutil.toBuffer(r),
      ethjsutil.toBuffer(s)
    )
    const retrievedAddress = ethjsutil.bufferToHex(ethjsutil.pubToAddress(publicKey))
    return signer === retrievedAddress
  } catch (err) {
    return false
  }
}

// TODO: Copied from @celo/utils, should be removed once usable as a dependency
function parseSignature(messageHash: string, signature: string, signer: string) {
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

export async function validateRequest(
  phoneNumber: string,
  account: string,
  message: string,
  issuer: string
) {
  const attestations = await getAttestations()
  const phoneHash = await getPhoneHash(phoneNumber)
  const expectedSourceMessage = attestationMessageToSign(phoneHash, account)
  const { r, s, v } = parseSignature(expectedSourceMessage, message, issuer.toLowerCase())

  try {
    const issuerFromSignature: string = await attestations.methods
      .validateAttestationCode(phoneHash, account, v, r, s)
      .call()
    return issuerFromSignature.toLowerCase() === issuer.toLowerCase()
  } catch (e) {
    console.error('Error validating attestation', e)
    return false
  }
}
