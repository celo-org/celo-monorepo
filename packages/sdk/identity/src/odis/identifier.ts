import {
  CombinerEndpointPNP,
  KEY_VERSION_HEADER,
  SignMessageRequest,
  SignMessageResponseSchema,
} from '@celo/phone-number-privacy-common'
import { soliditySha3 } from '@celo/utils/lib/solidity'
import { createHash } from 'crypto'
import debugFactory from 'debug'
import { BlsBlindingClient, WasmBlsBlindingClient } from './bls-blinding-client'
import {
  AuthenticationMethod,
  AuthSigner,
  EncryptionKeySigner,
  getOdisPnpRequestAuth,
  queryOdis,
  ServiceContext,
} from './query'

const debug = debugFactory('kit:odis:identifier')
const sha3 = (v: string) => soliditySha3({ type: 'string', value: v })

const PEPPER_CHAR_LENGTH = 13
const PEPPER_SEPARATOR = '__'

// using DID methods as prefixes when they exist
// https://w3c.github.io/did-spec-registries/#did-methods
export enum IdentifierPrefix {
  PHONE_NUMBER = 'tel',
  EMAIL = 'mailto',
  TWITTER = 'twit',
  // feel free to put up a PR to add more types!
}

export interface IdentifierHashDetails {
  // plaintext off-chain phone number, twitter handle, email, etc.
  plaintextIdentifier: string
  // identifier obtained after hashing, used for on-chain attestations
  obfuscatedIdentifier: string
  // unique pepper obtained through ODIS
  pepper: string
  // raw signature from ODIS
  unblindedSignature?: string
}

/**
 * Retrieve the on-chain identifier for the provided off-chain identifier
 * Performs blinding, querying, and unblinding
 */
export async function getObfuscatedIdentifier(
  plaintextIdentifier: string,
  identifierPrefix: string,
  account: string,
  signer: AuthSigner,
  context: ServiceContext,
  blindingFactor?: string,
  clientVersion?: string,
  blsBlindingClient?: BlsBlindingClient,
  sessionID?: string
): Promise<IdentifierHashDetails> {
  debug('Getting identifier pepper')

  let seed: Buffer | undefined
  if (blindingFactor) {
    seed = Buffer.from(blindingFactor)
  } else if (signer.authenticationMethod === AuthenticationMethod.ENCRYPTION_KEY) {
    seed = Buffer.from((signer as EncryptionKeySigner).rawKey)
  }

  // Fallback to using Wasm version if not specified

  if (!blsBlindingClient) {
    debug('No BLSBlindingClient found, using WasmBlsBlindingClient')
    blsBlindingClient = new WasmBlsBlindingClient(context.odisPubKey)
  }

  const base64BlindedMessage = await getBlindedIdentifier(
    plaintextIdentifier,
    blsBlindingClient,
    seed
  )

  const base64BlindSig = await getBlindedIdentifierSignature(
    account,
    signer,
    context,
    base64BlindedMessage,
    clientVersion,
    sessionID
  )

  return getObfuscatedIdentifierFromSignature(
    plaintextIdentifier,
    identifierPrefix,
    base64BlindSig,
    blsBlindingClient
  )
}

/**
 * Blinds the off-chain identifier in preparation for the ODIS request
 * Caller should use the same blsBlindingClient instance for unblinding
 */
export async function getBlindedIdentifier(
  identifier: string,
  identifierPrefix: string,
  blsBlindingClient: BlsBlindingClient,
  seed?: Buffer
): Promise<string> {
  debug('Retrieving blinded message')
  const base64Identifier =
    identifierPrefix === IdentifierPrefix.PHONE_NUMBER
      ? Buffer.from(identifier).toString('base64')
      : Buffer.from(getPrefixedIdentifier(identifier, identifierPrefix)).toString('base64')
  return blsBlindingClient.blindMessage(base64Identifier, seed)
}

/**
 * Query ODIS for the blinded signature
 * Response can be passed into getObfuscatedIdentifierFromSignature
 * to retrieve the on-chain identifier
 */
export async function getBlindedIdentifierSignature(
  account: string,
  signer: AuthSigner,
  context: ServiceContext,
  base64BlindedMessage: string,
  clientVersion?: string,
  sessionID?: string,
  keyVersion?: number,
  endpoint?: CombinerEndpointPNP.LEGACY_PNP_SIGN | CombinerEndpointPNP.PNP_SIGN
): Promise<string> {
  const body: SignMessageRequest = {
    account,
    blindedQueryPhoneNumber: base64BlindedMessage,
    version: clientVersion,
    authenticationMethod: signer.authenticationMethod,
    sessionID,
  }

  const response = await queryOdis(
    body,
    context,
    endpoint ?? CombinerEndpointPNP.PNP_SIGN,
    SignMessageResponseSchema,
    {
      [KEY_VERSION_HEADER]: keyVersion?.toString(),
      Authorization: await getOdisPnpRequestAuth(body, signer),
    }
  )

  if (!response.success) {
    throw new Error(response.error)
  }

  return response.signature
}

/**
 * Unblind the response and return the on-chain identifier
 */
export async function getObfuscatedIdentifierFromSignature(
  plaintextIdentifier: string,
  identifierType: string | IdentifierPrefix,
  base64BlindedSignature: string,
  blsBlindingClient: BlsBlindingClient
): Promise<IdentifierHashDetails> {
  debug('Retrieving unblinded signature')
  const base64UnblindedSig = await blsBlindingClient.unblindAndVerifyMessage(base64BlindedSignature)
  const sigBuf = Buffer.from(base64UnblindedSig, 'base64')

  debug('Converting sig to pepper')
  const pepper = getPepperFromThresholdSignature(sigBuf)
  const obfuscatedIdentifier = getIdentifierHash(plaintextIdentifier, identifierType, pepper)
  return {
    plaintextIdentifier,
    obfuscatedIdentifier,
    pepper,
    unblindedSignature: base64UnblindedSig,
  }
}

export const getPrefixedIdentifier = (
  plaintextIdentifier: string,
  identifierPrefix: string
): string => identifierPrefix + '://' + plaintextIdentifier

export const getIdentifierHash = (
  plaintextIdentifier: string,
  identifierPrefix: string,
  pepper: string
): string => {
  const value =
    getPrefixedIdentifier(plaintextIdentifier, identifierPrefix) + PEPPER_SEPARATOR + pepper
  return sha3(value) as string
}

// This is the algorithm that creates a pepper from the unblinded message signatures
// It simply hashes it with sha256 and encodes it to hex
export function getPepperFromThresholdSignature(sigBuf: Buffer) {
  // Currently uses 13 chars for a 78 bit pepper
  return createHash('sha256').update(sigBuf).digest('base64').slice(0, PEPPER_CHAR_LENGTH)
}
