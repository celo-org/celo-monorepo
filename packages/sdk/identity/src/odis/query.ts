import { selectiveRetryAsyncWithBackOff } from '@celo/base/lib/async'
import { ContractKit } from '@celo/contractkit'
import {
  AuthenticationMethod,
  CombinerEndpoint,
  Domain,
  DomainEndpoint,
  DomainRequest,
  DomainResponse,
  GetBlindedMessageSigRequest,
  GetContactMatchesRequest,
  GetContactMatchesResponse,
  PhoneNumberPrivacyRequest,
  signWithRawKey,
} from '@celo/phone-number-privacy-common'
import fetch from 'cross-fetch'
import debugFactory from 'debug'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'

const debug = debugFactory('kit:odis:query')

export interface WalletKeySigner {
  authenticationMethod: AuthenticationMethod.WALLET_KEY
  contractKit: ContractKit
}

export interface EncryptionKeySigner {
  authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY
  rawKey: string
}

// Support signing with the DEK or with the
export type AuthSigner = WalletKeySigner | EncryptionKeySigner

// Re-export types and aliases to maintain backwards compatibility.
export { AuthenticationMethod, PhoneNumberPrivacyRequest, signWithRawKey }
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
  ODIS_RESPONSE_ERROR = 'odisResponseError',
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

/**
 * Make a request to lookup the phone number identifier or perform matchmaking
 * @param signer Type of key to sign with. May be undefined if the request is presigned.
 * @param body Request to send in the body of the HTTP request.
 * @param context Contains service URL and public to determine which instance to contact.
 * @param endpoint Endpoint to query (e.g. '/getBlindedMessagePartialSig', '/getContactMatches').
 */
export async function queryOdis<ResponseType>(
  signer: AuthSigner,
  body: PhoneNumberPrivacyRequest,
  context: ServiceContext,
  endpoint: CombinerEndpoint
): Promise<ResponseType> {
  debug(`Posting to ${endpoint}`)

  const bodyString = JSON.stringify(body)

  // Sign payload using provided account and authentication method.
  let signature: string
  if (signer.authenticationMethod === AuthenticationMethod.ENCRYPTION_KEY) {
    signature = signWithDEK(bodyString, signer as EncryptionKeySigner)
  } else if (signer.authenticationMethod === AuthenticationMethod.WALLET_KEY) {
    const account = body.account
    signature = await signer.contractKit.connection.sign(bodyString, account)
  }

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
            Authorization: signature,
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

/**
 * Send the given domain request to ODIS (e.g. to get a POPRF evaluation or check quota).
 *
 * @param body Request to send in the body of the HTTP request.
 * @param context Contains service URL and public to determine which instance to contact.
 * @param endpoint Endpoint to query (e.g. '/domain/sign', '/domain/quotaStatus').
 * @param responseSchema io-ts type for the expected response type. Provided to ensure type safety.
 */
export async function sendOdisDomainRequest<RequestType extends DomainRequest<Domain>>(
  body: RequestType,
  context: ServiceContext,
  endpoint: DomainEndpoint,
  responseSchema: t.Type<DomainResponse<RequestType>>
): Promise<DomainResponse<RequestType>> {
  debug(`Posting to ${endpoint}`)

  const bodyString = JSON.stringify(body)

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
          },
          body: bodyString,
        })
      } catch (error) {
        throw new Error(`${ErrorMessages.ODIS_FETCH_ERROR}: ${error}`)
      }

      if (res.ok) {
        debug('Response ok. Parsing.')
        const response = await res.json()

        // Verify that the response is the type we expected, then return it.
        const decoding = responseSchema.decode(response)
        if (isLeft(decoding)) {
          throw new Error(ErrorMessages.ODIS_RESPONSE_ERROR)
        }
        return decoding.right
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
