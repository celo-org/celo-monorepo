import { getPhoneHash, isE164Number } from '@celo/base/lib/phoneNumbers'
import BigNumber from 'bignumber.js'
import { createHash } from 'crypto'
import debugFactory from 'debug'
import { soliditySha3 } from 'web3-utils'
import { BlsBlindingClient, WasmBlsBlindingClient } from './bls-blinding-client'
import {
  AuthSigner,
  queryOdis,
  ServiceContext,
  SignMessageRequest,
  SignMessageResponse,
} from './query'

// ODIS minimum dollar balance for sig retrieval
export const ODIS_MINIMUM_DOLLAR_BALANCE = 0.01
// ODIS minimum celo balance for sig retrieval
export const ODIS_MINIMUM_CELO_BALANCE = 0.005

const debug = debugFactory('kit:odis:phone-number-identifier')
const sha3 = (v: string) => soliditySha3({ type: 'string', value: v })

const PEPPER_CHAR_LENGTH = 13
const SIGN_MESSAGE_ENDPOINT = '/getBlindedMessageSig'

export interface PhoneNumberHashDetails {
  e164Number: string
  phoneHash: string
  pepper: string
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
  debug('Getting phone number pepper')

  if (!isE164Number(e164Number)) {
    throw new Error(`Invalid phone number: ${e164Number}`)
  }
  // Fallback to using Wasm version if not specified
  if (!blsBlindingClient) {
    debug('No BLSBlindingClient found, using WasmBlsBlindingClient')
    blsBlindingClient = new WasmBlsBlindingClient(context.odisPubKey)
  }

  debug('Retrieving blinded message')
  const base64PhoneNumber = Buffer.from(e164Number).toString('base64')
  const base64BlindedMessage = await blsBlindingClient.blindMessage(base64PhoneNumber)

  const body: SignMessageRequest = {
    account,
    timestamp: Date.now(),
    blindedQueryPhoneNumber: base64BlindedMessage,
    hashedPhoneNumber: selfPhoneHash,
    version: clientVersion ? clientVersion : 'unknown',
    authenticationMethod: signer.authenticationMethod,
  }

  const response = await queryOdis<SignMessageResponse>(
    signer,
    body,
    context,
    SIGN_MESSAGE_ENDPOINT
  )
  const base64BlindSig = response.combinedSignature
  debug('Retrieving unblinded signature')
  const base64UnblindedSig = await blsBlindingClient.unblindAndVerifyMessage(base64BlindSig)
  const sigBuf = Buffer.from(base64UnblindedSig, 'base64')

  debug('Converting sig to pepper')
  const pepper = getPepperFromThresholdSignature(sigBuf)
  const phoneHash = getPhoneHash(sha3, e164Number, pepper)
  return { e164Number, phoneHash, pepper }
}

// This is the algorithm that creates a pepper from the unblinded message signatures
// It simply hashes it with sha256 and encodes it to hex
export function getPepperFromThresholdSignature(sigBuf: Buffer) {
  // Currently uses 13 chars for a 78 bit pepper
  return createHash('sha256')
    .update(sigBuf)
    .digest('base64')
    .slice(0, PEPPER_CHAR_LENGTH)
}

/**
 * Check if balance is sufficient for quota retrieval
 */
export function isBalanceSufficientForSigRetrieval(
  dollarBalance: BigNumber.Value,
  celoBalance: BigNumber.Value
) {
  return (
    new BigNumber(dollarBalance).isGreaterThanOrEqualTo(ODIS_MINIMUM_DOLLAR_BALANCE) ||
    new BigNumber(celoBalance).isGreaterThanOrEqualTo(ODIS_MINIMUM_CELO_BALANCE)
  )
}
