import { CombinerEndpoint } from '@celo/phone-number-privacy-common'
import { soliditySha3 } from '@celo/utils/lib/solidity'
import { createHash } from 'crypto'
import debugFactory from 'debug'
import { BlsBlindingClient, WasmBlsBlindingClient } from './bls-blinding-client'
import {
  AuthenticationMethod,
  AuthSigner,
  CombinerSignMessageResponse,
  EncryptionKeySigner,
  queryOdis,
  ServiceContext,
  SignMessageRequest,
} from './query'

// ODIS minimum dollar balance for sig retrieval
export const ODIS_MINIMUM_DOLLAR_BALANCE = 0.01
// ODIS minimum celo balance for sig retrieval
export const ODIS_MINIMUM_CELO_BALANCE = 0.005

const debug = debugFactory('kit:odis:identifier')
const sha3 = (v: string) => soliditySha3({ type: 'string', value: v })

const PEPPER_CHAR_LENGTH = 13

export interface IdentifierHashDetails {
  offchainIdentifier: string
  identifierHash: string
  pepper: string
  unblindedSignature?: string
}

/**
 * Retrieve the on-chain identifier for the provided off-chain identifier
 * Performs blinding, querying, and unblinding
 */
export async function getOnchainIdentifier(
  offchainIdentifier: string,
  account: string,
  signer: AuthSigner,
  context: ServiceContext,
  blindingFactor?: string,
  selfidentifierHash?: string,
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
    offchainIdentifier,
    blsBlindingClient,
    seed
  )

  const base64BlindSig = await getBlindedIdentifierSignature(
    account,
    signer,
    context,
    base64BlindedMessage,
    selfidentifierHash,
    clientVersion,
    sessionID
  )

  return getOnchainIdentifierFromSignature(offchainIdentifier, base64BlindSig, blsBlindingClient)
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
  selfidentifierHash?: string,
  clientVersion?: string,
  sessionID?: string
): Promise<string> {
  const body: SignMessageRequest = {
    account,
    blindedQueryIdentifier: base64BlindedMessage,
    hashedIdentifier: selfidentifierHash,
    version: clientVersion ? clientVersion : 'unknown',
    authenticationMethod: signer.authenticationMethod,
  }

  if (sessionID) {
    body.sessionID = sessionID
  }

  const response = await queryOdis<CombinerSignMessageResponse>(
    signer,
    body,
    context,
    CombinerEndpoint.SIGN_MESSAGE
  )
  return response.combinedSignature
}

/**
 * Unblind the response and return the on-chain identifier
 */
export async function getOnchainIdentifierFromSignature(
  offchainIdentifier: string,
  base64BlindedSignature: string,
  blsBlindingClient: BlsBlindingClient
): Promise<IdentifierHashDetails> {
  debug('Retrieving unblinded signature')
  const base64UnblindedSig = await blsBlindingClient.unblindAndVerifyMessage(base64BlindedSignature)
  const sigBuf = Buffer.from(base64UnblindedSig, 'base64')

  debug('Converting sig to pepper')
  const pepper = getPepperFromThresholdSignature(sigBuf)
  const identifierHash = getidentifierHash(sha3, offchainIdentifier, pepper)
  return { offchainIdentifier, identifierHash, pepper, unblindedSignature: base64UnblindedSig }
}

export const getIdentifierHash = (
  sha3: (a: string) => string | null,
  offchainIdentifier: string,
  identifierType: string,
  salt?: string
): string => {
  // if (!phoneNumber || !isoffchainIdentifier(phoneNumber)) {
  //   throw Error('Attempting to hash a non-e164 number: ' + phoneNumber)
  // }
  const prefix = getIdentifierPrefix(IdentifierType.PHONE_NUMBER)
  const value =
    prefix + (salt ? offchainIdentifier + PHONE_SALT_SEPARATOR + salt : offchainIdentifier)
  return sha3(value) as string
}

// This is the algorithm that creates a pepper from the unblinded message signatures
// It simply hashes it with sha256 and encodes it to hex
export function getPepperFromThresholdSignature(sigBuf: Buffer) {
  // Currently uses 13 chars for a 78 bit pepper
  return createHash('sha256').update(sigBuf).digest('base64').slice(0, PEPPER_CHAR_LENGTH)
}
