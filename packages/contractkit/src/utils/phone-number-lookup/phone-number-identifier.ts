import { getPhoneHash, isE164Number } from '@celo/base/lib/phoneNumbers'
import { createHash } from 'crypto'
import debugFactory from 'debug'
import { soliditySha3 } from 'web3-utils'
import { BlsBlindingClient, WasmBlsBlindingClient } from './bls-blinding-client'
import {
  AuthSigner,
  postToPhoneNumPrivacyService,
  ServiceContext,
  SignMessageRequest,
  SignMessageResponse,
} from './phone-number-lookup'

const sha3 = (v: string) => soliditySha3({ type: 'string', value: v })

const debug = debugFactory('kit:phone-number-lookup:phone-number-identifier')

const SALT_CHAR_LENGTH = 13
const SIGN_MESSAGE_ENDPOINT = '/getDistributedBlindedSalt'

export interface PhoneNumberHashDetails {
  e164Number: string
  phoneHash: string
  salt: string
}

/**
 * Retrieve the on-chain identifier for the provided phone number
 */
export async function getPhoneNumberIdentifier(
  e164Number: string,
  account: string,
  signer: AuthSigner,
  context: ServiceContext,
  selfPhoneHash?: string,
  clientVersion?: string,
  blsBlindingClient?: BlsBlindingClient
): Promise<PhoneNumberHashDetails> {
  debug('Getting phone number salt')

  if (!isE164Number(e164Number)) {
    throw new Error(`Invalid phone number: ${e164Number}`)
  }
  // Fallback to using Wasm version if not specified
  if (!blsBlindingClient) {
    debug('No BLSBlindingClient found, using WasmBlsBlindingClient')
    blsBlindingClient = new WasmBlsBlindingClient(context.pgpnpPubKey)
  }

  debug('Retrieving blinded message')
  const base64PhoneNumber = Buffer.from(e164Number).toString('base64')
  const base64BlindedMessage = await blsBlindingClient.blindMessage(base64PhoneNumber)

  const body: SignMessageRequest = {
    account,
    blindedQueryPhoneNumber: base64BlindedMessage,
    hashedPhoneNumber: selfPhoneHash,
    version: clientVersion ? clientVersion : 'unknown',
    authenticationMethod: signer.authenticationMethod,
  }

  const response = await postToPhoneNumPrivacyService<SignMessageResponse>(
    signer,
    body,
    context,
    SIGN_MESSAGE_ENDPOINT
  )
  const base64BlindSig = response.combinedSignature
  debug('Retrieving unblinded signature')
  const base64UnblindedSig = await blsBlindingClient.unblindAndVerifyMessage(base64BlindSig)
  const sigBuf = Buffer.from(base64UnblindedSig, 'base64')

  debug('Converting sig to salt')
  const salt = getSaltFromThresholdSignature(sigBuf)
  const phoneHash = getPhoneHash(sha3, e164Number, salt)
  return { e164Number, phoneHash, salt }
}

// This is the algorithm that creates a salt from the unblinded message signatures
// It simply hashes it with sha256 and encodes it to hex
// If we ever need to compute salts anywhere other than here then we should move this to the utils package
export function getSaltFromThresholdSignature(sigBuf: Buffer) {
  // Currently uses 13 chars for a 78 bit salt
  return createHash('sha256')
    .update(sigBuf)
    .digest('base64')
    .slice(0, SALT_CHAR_LENGTH)
}
