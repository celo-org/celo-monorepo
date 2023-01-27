import { isE164Number } from '@celo/base'
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

/**
 * Standardized prefixes for ODIS identifiers.
 *
 * @remarks These prefixes prevent collisions between off-chain identifiers.
 * i.e. if a user's instagram and twitter handles are the same,
 * these prefixes prevent the ODIS identifers from being the same.
 *
 * If you would like to use a prefix that isn't included, please put up a PR adding it
 * to ensure interoperability with other projects. When adding new prefixes,
 * please use either the full platform name in all lowercase (e.g. 'facebook')
 * or DID methods https://w3c.github.io/did-spec-registries/#did-methods.
 *
 * The NULL prefix is included to allow projects to use the sdk without selecting
 * a predefined prefix or adding there own. Production use of the NULL prefix is
 * discouraged since identifiers will not be interoperable with other projects.
 * Please think carefully before using the NULL prefix.
 */
export enum IdentifierPrefix {
  NULL = '',
  PHONE_NUMBER = 'tel',
  EMAIL = 'mailto',
  TWITTER = 'twit',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  SIGNAL = 'signal',
}

/**
 * Steps from the private plaintext identifier to the obfuscated identifier, which can be made public.
 *
 * plaintext identifier: off-chain information, ex: phone number, twitter handle, email, etc.
 * blinded identifier: obtained by blinding the plaintext identifier
 * blinded signature: blinded identifier signed by ODIS
 * unblinded signatue: obtained by unblinding the blinded signature
 * pepper: unique secret, obtained by hashing the unblinded signature
 * obfuscated identifier: identifier used for on-chain attestations, obtained by hashing the plaintext identifier and pepper
 */

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
 * Retrieve the obfuscated identifier for the provided plaintext identifier
 * Performs blinding, querying, and unblinding
 *
 * @remarks This function will send a request to ODIS, authorized by the provided signer.
 * This method consumes ODIS quota on the account provided by the signer.
 * You can use the DEK as your signer to decrease quota usage
 *
 * @param plaintextIdentifier Off-chain identifier, ex: phone number, twitter handle, email, etc.
 * @param identifierPrefix Standardized prefix used to prevent collisions between identifiers
 * @param account The address making the request to ODIS, from which quota will be charged
 * @param signer Object containing the private key used to authenticate the ODIS request
 * @param context Specifies which ODIS combiner url should be queried (i.e. mainnet or alfajores)
 * @param blindingFactor Optional Private seed used to blind identifers before they are sent to ODIS
 * @param clientVersion Optional Specifies the client software version
 * @param blsBlindingClient Optional Performs blinding and unblinding, defaults to WasmBlsBlindingClient
 * @param sessionID Optional Used to track user sessions across the client and ODIS
 * @param keyVersion Optional For testing. Specifies which version key ODIS should use
 * @param endpoint Optional Allows client to specify the legacy endpoint if they desire (will be deprecated)
 * @param abortController Optional Allows client to specify a timeout for the ODIS request
 */
export async function getObfuscatedIdentifier(
  plaintextIdentifier: string,
  identifierPrefix: IdentifierPrefix,
  account: string,
  signer: AuthSigner,
  context: ServiceContext,
  blindingFactor?: string,
  clientVersion?: string,
  blsBlindingClient?: BlsBlindingClient,
  sessionID?: string,
  keyVersion?: number,
  endpoint?: CombinerEndpointPNP.LEGACY_PNP_SIGN | CombinerEndpointPNP.PNP_SIGN,
  abortController?: AbortController
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
    identifierPrefix,
    blsBlindingClient,
    seed
  )

  const base64BlindSig = await getBlindedIdentifierSignature(
    account,
    signer,
    context,
    base64BlindedMessage,
    clientVersion,
    sessionID,
    keyVersion,
    endpoint ?? CombinerEndpointPNP.PNP_SIGN,
    abortController
  )

  return getObfuscatedIdentifierFromSignature(
    plaintextIdentifier,
    identifierPrefix,
    base64BlindSig,
    blsBlindingClient
  )
}

/**
 * Blinds the plaintext identifier in preparation for the ODIS request
 *
 * @remarks Caller should use the same blsBlindingClient instance for unblinding
 *
 * @param plaintextIdentifier Off-chain identifier, ex: phone number, twitter handle, email, etc.
 * @param identifierPrefix Standardized prefix used to prevent collisions between identifiers
 * @param blsBlindingClient Optional Performs blinding and unblinding, defaults to WasmBlsBlindingClient
 * @param seed Optional Buffer generated from the blindingFactor, if provided
 */
export async function getBlindedIdentifier(
  plaintextIdentifier: string,
  identifierPrefix: IdentifierPrefix,
  blsBlindingClient: BlsBlindingClient,
  seed?: Buffer
): Promise<string> {
  debug('Retrieving blinded message')
  // phone number identifiers don't have prefixes in the blinding stage
  // to maintain backwards compatibility wih ASv1
  let identifier = getPrefixedIdentifier(plaintextIdentifier, identifierPrefix)
  if (identifierPrefix === IdentifierPrefix.PHONE_NUMBER) {
    if (!isE164Number(plaintextIdentifier)) {
      throw new Error(`Invalid phone number: ${plaintextIdentifier}`)
    }
    identifier = plaintextIdentifier
  }
  return blsBlindingClient.blindMessage(Buffer.from(identifier).toString('base64'), seed)
}

/**
 * Query ODIS for the blinded signature
 *
 * @remarks
 * Response can be passed into getObfuscatedIdentifierFromSignature
 * to retrieve the obfuscated identifier
 *
 * @param account The address making the request to ODIS, from which quota will be charged
 * @param signer Object containing the private key used to authenticate the ODIS request
 * @param context Specifies which ODIS combiner url should be queried (i.e. mainnet or alfajores)
 * @param base64BlindedMessage The blinded prefixed identifier to be sent to ODIS
 * @param clientVersion Optional Specifies the client software version
 * @param sessionID Optional Used to track user sessions across the client and ODIS
 * @param keyVersion Optional For testing. Specifies which version key ODIS should use
 * @param endpoint Optional Allows client to specify the legacy endpoint if they desire (will be deprecated)
 * @param abortController Optional Allows client to specify a timeout for the ODIS request
 */
export async function getBlindedIdentifierSignature(
  account: string,
  signer: AuthSigner,
  context: ServiceContext,
  base64BlindedMessage: string,
  clientVersion?: string,
  sessionID?: string,
  keyVersion?: number,
  endpoint?: CombinerEndpointPNP.LEGACY_PNP_SIGN | CombinerEndpointPNP.PNP_SIGN,
  abortControlller?: AbortController
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
    },
    abortControlller
  )

  if (!response.success) {
    throw new Error(response.error)
  }

  return response.signature
}

/**
 * Unblind the response and return the obfuscated identifier
 *
 * @param plaintextIdentifier Off-chain identifier, ex: phone number, twitter handle, email, etc.
 * @param identifierPrefix Standardized prefix used to prevent collisions between identifiers
 * @param base64BlindedSignature The blinded signed identifier returned by ODIS
 * @param blsBlindingClient Optional Performs blinding and unblinding, defaults to WasmBlsBlindingClient
 */
export async function getObfuscatedIdentifierFromSignature(
  plaintextIdentifier: string,
  identifierPrefix: IdentifierPrefix,
  base64BlindedSignature: string,
  blsBlindingClient: BlsBlindingClient
): Promise<IdentifierHashDetails> {
  debug('Retrieving unblinded signature')
  const base64UnblindedSig = await blsBlindingClient.unblindAndVerifyMessage(base64BlindedSignature)
  const sigBuf = Buffer.from(base64UnblindedSig, 'base64')

  debug('Converting sig to pepper')
  const pepper = getPepperFromThresholdSignature(sigBuf)
  const obfuscatedIdentifier = getIdentifierHash(plaintextIdentifier, identifierPrefix, pepper)
  return {
    plaintextIdentifier,
    obfuscatedIdentifier,
    pepper,
    unblindedSignature: base64UnblindedSig,
  }
}

/**
 * Concatenates the identifierPrefix and plaintextIdentifier with the separator '://'
 *
 * @param plaintextIdentifier Off-chain identifier, ex: phone number, twitter handle, email, etc.
 * @param identifierPrefix Standardized prefix used to prevent collisions between identifiers
 */
export const getPrefixedIdentifier = (
  plaintextIdentifier: string,
  identifierPrefix: IdentifierPrefix
): string => identifierPrefix + '://' + plaintextIdentifier

/**
 * Generates final identifier that is published on-chain.
 *
 * @remarks
 * Concatenates the plaintext prefixed identifier with the pepper derived by hashing the unblinded
 * signature returned by ODIS.
 *
 * @param plaintextIdentifier Off-chain identifier, ex: phone number, twitter handle, email, etc.
 * @param identifierPrefix Standardized prefix used to prevent collisions between identifiers
 * @param pepper Hash of the unblinded signature returned by ODIS
 */
export const getIdentifierHash = (
  plaintextIdentifier: string,
  identifierPrefix: IdentifierPrefix,
  pepper: string
): string => {
  // hashing the identifier before appending the pepper to avoid domain collisions where the
  // identifier may contain underscores
  // not doing this for phone numbers to maintain backwards compatibility
  const value =
    identifierPrefix === IdentifierPrefix.PHONE_NUMBER
      ? getPrefixedIdentifier(plaintextIdentifier, identifierPrefix) + PEPPER_SEPARATOR + pepper
      : (sha3(getPrefixedIdentifier(plaintextIdentifier, identifierPrefix)) as string) +
        PEPPER_SEPARATOR +
        pepper
  return sha3(value) as string
}

/**
 * This is the algorithm that creates a pepper from the unblinded message signatures
 * It simply hashes it with sha256 and encodes it to hex
 *
 * @remarks Currently uses 13 chars for a 78 bit pepper
 *
 * @param sigBuf Unblinded signature returned by ODIS
 */
export function getPepperFromThresholdSignature(sigBuf: Buffer) {
  return createHash('sha256').update(sigBuf).digest('base64').slice(0, PEPPER_CHAR_LENGTH)
}
