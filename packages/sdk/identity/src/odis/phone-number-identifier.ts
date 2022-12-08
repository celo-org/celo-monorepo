import { isE164Number } from '@celo/base/lib/phoneNumbers'
import { CombinerEndpointPNP } from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import debugFactory from 'debug'
import { BlsBlindingClient } from './bls-blinding-client'
import {
  getBlindedIdentifier,
  getBlindedIdentifierSignature,
  getObfuscatedIdentifier,
  getObfuscatedIdentifierFromSignature,
  IdentifierPrefix,
} from './identifier'
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
 * @deprecated use getObfuscatedIdentifier instead
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
    obfuscatedIdentifier,
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
  return {
    e164Number: plaintextIdentifier,
    phoneHash: obfuscatedIdentifier,
    pepper,
    unblindedSignature,
  }
}

/**
 * Blinds the phone number in preparation for the ODIS request
 * Caller should use the same blsBlindingClient instance for unblinding
 * @deprecated use getBlindedIdentifier instead
 */
export async function getBlindedPhoneNumber(
  e164Number: string,
  blsBlindingClient: BlsBlindingClient,
  seed?: Buffer
): Promise<string> {
  return getBlindedIdentifier(e164Number, IdentifierPrefix.PHONE_NUMBER, blsBlindingClient, seed)
}

/**
 * Query ODIS for the blinded signature
 * Response can be passed into getPhoneNumberIdentifierFromSignature
 * to retrieve the on-chain identifier
 * @deprecated use getBlindedIdentifierSignature instead
 */
export async function getBlindedPhoneNumberSignature(
  account: string,
  signer: AuthSigner,
  context: ServiceContext,
  base64BlindedMessage: string,
  clientVersion?: string,
  sessionID?: string,
  keyVersion?: number,
  endpoint?: CombinerEndpointPNP.LEGACY_PNP_SIGN | CombinerEndpointPNP.PNP_SIGN
): Promise<string> {
  return getBlindedIdentifierSignature(
    account,
    signer,
    context,
    base64BlindedMessage,
    clientVersion,
    sessionID,
    keyVersion,
    endpoint
  )
}

/**
 * Unblind the response and return the on-chain identifier
 * @deprecated use getObfuscatedIdentifieriFromSignature instead
 */
export async function getPhoneNumberIdentifierFromSignature(
  e164Number: string,
  base64BlindedSignature: string,
  blsBlindingClient: BlsBlindingClient
): Promise<PhoneNumberHashDetails> {
  const {
    plaintextIdentifier,
    obfuscatedIdentifier,
    pepper,
    unblindedSignature,
  } = await getObfuscatedIdentifierFromSignature(
    e164Number,
    IdentifierPrefix.PHONE_NUMBER,
    base64BlindedSignature,
    blsBlindingClient
  )
  return {
    e164Number: plaintextIdentifier,
    phoneHash: obfuscatedIdentifier,
    pepper,
    unblindedSignature,
  }
}

/**
 * Check if balance is sufficient for quota retrieval
 * @deprecated use getPnpQuotaStatus instead
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
