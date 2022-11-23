import { isE164Number } from '@celo/base/lib/phoneNumbers'
import { CombinerEndpointPNP } from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import { createHash } from 'crypto'
import debugFactory from 'debug'
import { BlsBlindingClient } from './bls-blinding-client'
import { getObfuscatedIdentifier, IdentifierPrefix } from './identifier'
import { AuthSigner, ServiceContext } from './query'

// ODIS minimum dollar balance for sig retrieval
export const ODIS_MINIMUM_DOLLAR_BALANCE = 0.01
// ODIS minimum celo balance for sig retrieval
export const ODIS_MINIMUM_CELO_BALANCE = 0.005

const debug = debugFactory('kit:odis:phone-number-identifier')

export interface PhoneNumberHashDetails {
  e164Number: string
  phoneHash: string
  pepper: string
  unblindedSignature?: string
}

/**
 * Retrieve the on-chain identifier for the provided phone number
 * Performs blinding, querying, and unblinding
 */
export async function getPhoneNumberIdentifier(
  e164Number: string,
  account: string,
  signer: AuthSigner,
  context: ServiceContext,
  blindingFactor?: string,
  clientVersion?: string,
  blsBlindingClient?: BlsBlindingClient,
  sessionID?: string,
  keyVersion?: number,
  endpoint?: CombinerEndpointPNP.LEGACY_PNP_SIGN | CombinerEndpointPNP.PNP_SIGN
): Promise<PhoneNumberHashDetails> {
  debug('Getting phone number pepper')

  if (!isE164Number(e164Number)) {
    throw new Error(`Invalid phone number: ${e164Number}`)
  }

  const {
    plaintextIdentifier,
    obfuscatedIdentifier: identifierHash,
    pepper,
    unblindedSignature,
  } = await getObfuscatedIdentifier(
    e164Number,
    IdentifierPrefix.PHONE_NUMBER,
    account,
    signer,
    context,
    blindingFactor,
    clientVersion,
    blsBlindingClient,
    sessionID,
    keyVersion,
    endpoint
  )
  return { e164Number: plaintextIdentifier, phoneHash: identifierHash, pepper, unblindedSignature }
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

const PEPPER_CHAR_LENGTH = 13
// This is the algorithm that creates a pepper from the unblinded message signatures
// It simply hashes it with sha256 and encodes it to hex
export function getPepperFromThresholdSignature(sigBuf: Buffer) {
  // Currently uses 13 chars for a 78 bit pepper
  return createHash('sha256').update(sigBuf).digest('base64').slice(0, PEPPER_CHAR_LENGTH)
}
