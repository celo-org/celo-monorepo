import {
  CombinerEndpoint,
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

export enum IdentifierType {
  PHONE_NUMBER = 0,
  EMAIL = 1,
  TWITTER = 2,
  // feel free to put up a PR to add more types!
}

export function getIdentifierPrefix(type: IdentifierType) {
  switch (type) {
    case IdentifierType.PHONE_NUMBER:
      return 'tel'
    case IdentifierType.EMAIL:
      return 'mailto'
    case IdentifierType.TWITTER:
      return 'twit'
    default:
      throw new Error('Unsupported Identifier Type')
  }
}

export interface IdentifierHashDetails {
  plaintextIdentifier: string
  identifierHash: string
  pepper: string
  unblindedSignature?: string
}

/**
 * Retrieve the on-chain identifier for the provided off-chain identifier
 * Performs blinding, querying, and unblinding
 */
export async function getObfuscatedIdentifier(
  plaintextIdentifier: string,
  identifierType: string | IdentifierType,
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
    identifierType,
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
  blsBlindingClient: BlsBlindingClient,
  seed?: Buffer
): Promise<string> {
  debug('Retrieving blinded message')
  const base64Identifier = Buffer.from(identifier).toString('base64')
  return blsBlindingClient.blindMessage(base64Identifier, seed)
}

/**
 * Query ODIS for the blinded signature
 * Response can be passed into getIdentifierIdentifierFromSignature
 * to retrieve the on-chain identifier
 */
export async function getBlindedIdentifierSignature(
  account: string,
  signer: AuthSigner,
  context: ServiceContext,
  base64BlindedMessage: string,
  clientVersion?: string,
  sessionID?: string,
  keyVersion?: number
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
    CombinerEndpoint.PNP_SIGN,
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
  identifierType: string | IdentifierType,
  base64BlindedSignature: string,
  blsBlindingClient: BlsBlindingClient
): Promise<IdentifierHashDetails> {
  debug('Retrieving unblinded signature')
  const base64UnblindedSig = await blsBlindingClient.unblindAndVerifyMessage(base64BlindedSignature)
  const sigBuf = Buffer.from(base64UnblindedSig, 'base64')

  debug('Converting sig to pepper')
  const pepper = getPepperFromThresholdSignature(sigBuf)
  const identifierHash = getIdentifierHash(plaintextIdentifier, identifierType, pepper)
  return { plaintextIdentifier, identifierHash, pepper, unblindedSignature: base64UnblindedSig }
}

export const getIdentifierHash = (
  plaintextIdentifier: string,
  identifierType: string | IdentifierType,
  pepper?: string
): string => {
  const prefix =
    typeof identifierType === 'string'
      ? identifierType + '://'
      : getIdentifierPrefix(identifierType) + '://'
  const value =
    prefix + (pepper ? plaintextIdentifier + PEPPER_SEPARATOR + pepper : plaintextIdentifier)
  return sha3(value) as string
}

// This is the algorithm that creates a pepper from the unblinded message signatures
// It simply hashes it with sha256 and encodes it to hex
export function getPepperFromThresholdSignature(sigBuf: Buffer) {
  // Currently uses 13 chars for a 78 bit pepper
  return createHash('sha256').update(sigBuf).digest('base64').slice(0, PEPPER_CHAR_LENGTH)
}
