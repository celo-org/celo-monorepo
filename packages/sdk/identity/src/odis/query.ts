import { hexToBuffer } from '@celo/base/lib/address'
import { selectiveRetryAsyncWithBackOff } from '@celo/base/lib/async'
import { ContractKit } from '@celo/contractkit'
import {
  AuthenticationMethod,
  DomainRequest,
  GetBlindedMessageSigRequest,
  GetContactMatchesRequest,
  GetContactMatchesResponse,
  KnownDomain,
  PhoneNumberPrivacyRequest,
} from '@celo/phone-number-privacy-common'
import fetch from 'cross-fetch'
import crypto from 'crypto'
import debugFactory from 'debug'

const debug = debugFactory('kit:odis:query')

export interface NoSigner {
  authenticationMethod: AuthenticationMethod.NONE
}

export interface WalletKeySigner {
  authenticationMethod: AuthenticationMethod.WALLET_KEY
  contractKit: ContractKit
}

export interface EncryptionKeySigner {
  authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY
  rawKey: string
}

export interface CustomSigner {
  authenticationMethod: AuthenticationMethod.CUSTOM_SIGNER
  customSigner: (body: string) => Promise<string>
}

// Support signing with the DEK or with the
export type AuthSigner = WalletKeySigner | EncryptionKeySigner | CustomSigner | NoSigner

// Re-export types and aliases to maintain backwards compatibility.
export { AuthenticationMethod, PhoneNumberPrivacyRequest }
export type SignMessageRequest = GetBlindedMessageSigRequest
export type MatchmakingRequest = GetContactMatchesRequest
export type MatchmakingResponse = GetContactMatchesResponse

// Combiner returns a response inconsistent with the SignMessageResponse defined in
// @celo/phone-number-privacy-common. Combiner response type is defined here as a result.
export interface CombinerSignMessageResponse {
  success: boolean
  combinedSignature: string
}
/** @deprecated Exported as SignMessageResponse for backwards compatibility. */
export type SignMessageResponse = CombinerSignMessageResponse

export enum ErrorMessages {
  ODIS_QUOTA_ERROR = 'odisQuotaError',
  ODIS_RATE_LIMIT_ERROR = 'odisRateLimitError',
  ODIS_INPUT_ERROR = 'odisBadInputError',
  ODIS_AUTH_ERROR = 'odisAuthError',
  ODIS_CLIENT_ERROR = 'Unknown Client Error',
  ODIS_FETCH_ERROR = 'odisFetchError',
}

export interface ServiceContext {
  odisUrl: string // Oblivious Decentralized Identifier Service Url
  odisPubKey: string
}

export const ODIS_ALFAJORES_CONTEXT: ServiceContext = {
  odisUrl: 'https://us-central1-celo-phone-number-privacy.cloudfunctions.net',
  odisPubKey:
    'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA',
}

export const ODIS_ALFAJORESSTAGING_CONTEXT: ServiceContext = {
  odisUrl: 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net',
  odisPubKey:
    '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
}

export const ODIS_MAINNET_CONTEXT: ServiceContext = {
  odisUrl: 'https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net',
  odisPubKey:
    'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA',
}

export function getServiceContext(contextName = 'mainnet') {
  switch (contextName) {
    case 'alfajores':
      return ODIS_ALFAJORES_CONTEXT
    case 'alfajoresstaging':
      return ODIS_ALFAJORESSTAGING_CONTEXT
    default:
      return ODIS_MAINNET_CONTEXT
  }
}

export function signWithDEK(msg: string, signer: EncryptionKeySigner) {
  return signWithRawKey(msg, signer.rawKey)
}

export function signWithRawKey(msg: string, rawKey: string) {
  // NOTE: Elliptic will truncate the raw msg to 64 bytes before signing,
  // so make sure to always pass the hex encoded msgDigest instead.
  const msgDigest = crypto.createHash('sha256').update(JSON.stringify(msg)).digest('hex')

  // NOTE: elliptic is disabled elsewhere in this library to prevent
  // accidental signing of truncated messages.
  // tslint:disable-next-line:import-blacklist
  const EC = require('elliptic').ec
  const ec = new EC('secp256k1')

  // Sign
  const key = ec.keyFromPrivate(hexToBuffer(rawKey))
  return JSON.stringify(key.sign(msgDigest).toDER())
}

/**
 * Make a request to lookup the phone number identifier or perform matchmaking
 * @param signer type of key to sign with
 * @param body request body
 * @param context contains service URL
 * @param endpoint endpoint to hit
 */
export async function queryOdis<ResponseType>(
  signer: AuthSigner,
  body: PhoneNumberPrivacyRequest | DomainRequest<KnownDomain>,
  context: ServiceContext,
  endpoint: string
): Promise<ResponseType> {
  debug(`Posting to ${endpoint}`)

  const bodyString = JSON.stringify(body)

  // Sign payload using provided account and authentication method.
  // NOTE: Signing and verifying signatures over JSON encoded blobs relies on both the serializer
  // (e.g. this client) and the verifier (e.g. ODIS) to have the same deterministic JSON
  // implementation. This is maintained for backwards compatibility, but not recommended.
  let signature: string | undefined
  if (signer.authenticationMethod === AuthenticationMethod.ENCRYPTION_KEY) {
    signature = signWithDEK(bodyString, signer as EncryptionKeySigner)
  } else if (signer.authenticationMethod === AuthenticationMethod.WALLET_KEY) {
    const account = (body as PhoneNumberPrivacyRequest).account
    signature = await (signer as WalletKeySigner).contractKit.connection.sign(bodyString, account)
  } else if (signer.authenticationMethod === AuthenticationMethod.CUSTOM_SIGNER) {
    signature = await (signer as CustomSigner).customSigner(bodyString)
  }
  const authHeader = signature !== undefined ? { Authorization: signature } : undefined

  const { odisUrl } = context

  const dontRetry = [
    ErrorMessages.ODIS_QUOTA_ERROR,
    ErrorMessages.ODIS_RATE_LIMIT_ERROR,
    ErrorMessages.ODIS_AUTH_ERROR,
    ErrorMessages.ODIS_INPUT_ERROR,
    ErrorMessages.ODIS_CLIENT_ERROR,
  ]

  return selectiveRetryAsyncWithBackOff(
    async () => {
      let res: Response
      try {
        res = await fetch(odisUrl + endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: bodyString,
        })
      } catch (error) {
        throw new Error(`${ErrorMessages.ODIS_FETCH_ERROR}: ${error}`)
      }

      if (res.ok) {
        debug('Response ok. Parsing.')
        const response = await res.json()
        return response as ResponseType
      }

      debug(`Response not okay. Status ${res.status}`)

      switch (res.status) {
        case 403:
          throw new Error(ErrorMessages.ODIS_QUOTA_ERROR)
        case 429:
          throw new Error(ErrorMessages.ODIS_RATE_LIMIT_ERROR)
        case 400:
          throw new Error(ErrorMessages.ODIS_INPUT_ERROR)
        case 401:
          throw new Error(ErrorMessages.ODIS_AUTH_ERROR)
        default:
          if (res.status >= 400 && res.status < 500) {
            // Don't retry error codes in 400s
            throw new Error(`${ErrorMessages.ODIS_CLIENT_ERROR} ${res.status}`)
          }
          throw new Error(`Unknown failure ${res.status}`)
      }
    },
    3,
    dontRetry,
    []
  )
}
