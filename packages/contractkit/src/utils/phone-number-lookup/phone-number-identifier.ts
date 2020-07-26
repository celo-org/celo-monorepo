import { getPhoneHash, isE164Number } from '@celo/utils/lib/phoneNumbers'
import threshold_bls from 'blind-threshold-bls'
import { createHash } from 'crypto'
import {
  AuthSigner,
  Logger,
  postToPhoneNumPrivacyService,
  ServiceContext,
  SignMessageRequest,
  SignMessageResponse,
} from './phone-number-lookup'

const crypto = require('crypto')
const SALT_CHAR_LENGTH = 13
const SIGN_MESSAGE_ENDPOINT = '/getDistributedBlindedSalt'
const TAG = 'contractkit/utils/phone-number-lookup/phone-number-identifier'

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
  logger: Logger,
  failureCallback: (response: Response) => void,
  selfPhoneHash?: string,
  walletVersion?: string
): Promise<PhoneNumberHashDetails> {
  logger.debug(`${TAG}@getPhoneNumberIdentifier`, 'Getting phone number salt')

  if (!isE164Number(e164Number)) {
    throw new Error(`Invalid phone number: ${e164Number}`)
  }

  logger.debug(`${TAG}@getPhoneNumberIdentifier`, 'Retrieving blinded message')
  // const base64PhoneNumber = Buffer.from(e164Number).toString('base64')

  const userSeed = crypto.randomBytes(32)
  const rawMessage = Buffer.from(e164Number)
  const blindedValue = await threshold_bls.blind(rawMessage, userSeed)
  const blindedMessage = blindedValue.message
  const base64BlindedMessage = Buffer.from(blindedMessage).toString('base64')

  const body: SignMessageRequest = {
    account,
    blindedQueryPhoneNumber: base64BlindedMessage,
    hashedPhoneNumber: selfPhoneHash,
    version: walletVersion ? walletVersion : 'unknown',
    authenticationMethod: signer.authenticationMethod,
  }

  const response = await postToPhoneNumPrivacyService<SignMessageResponse>(
    signer,
    body,
    context,
    SIGN_MESSAGE_ENDPOINT,
    logger,
    failureCallback
  )
  const base64BlindSig = response.combinedSignature
  logger.debug(`${TAG}@getPhoneNumberIdentifier`, 'Retrieving unblinded signature')
  const pgpnpPubKey = new Uint8Array(Buffer.from(context.pgpnpPubKey, 'base64'))
  // const base64UnblindedSig = await BlindThresholdBls.unblindMessage(base64BlindSig, pgpnpPubKey)
  const blindedSignature = new Uint8Array(Buffer.from(base64BlindSig, 'base64'))

  const unblindMessage = await threshold_bls.unblind(blindedSignature, blindedValue.blindingFactor)
  // (this throws on error)
  threshold_bls.verify(pgpnpPubKey, rawMessage, unblindMessage)

  logger.debug(`${TAG}@getPhoneNumberIdentifier`, 'Converting sig to salt')
  const salt = getSaltFromThresholdSignature(Buffer.from(unblindMessage))
  const phoneHash = getPhoneHash(e164Number, salt)
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
