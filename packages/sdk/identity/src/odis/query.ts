import { selectiveRetryAsyncWithBackOff } from '@celo/base/lib/async'
import { ContractKit } from '@celo/contractkit'
import {
  AuthenticationMethod,
  CombinerEndpoint,
  DomainEndpoint,
  DomainRequest,
  DomainRequestHeader,
  DomainResponse,
  GetContactMatchesRequest,
  GetContactMatchesResponse,
  OdisRequest,
  OdisRequestHeader,
  OdisResponse,
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

export type MatchmakingRequest = GetContactMatchesRequest
export type MatchmakingResponse = GetContactMatchesResponse

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

export async function getOdisPnpRequestAuth(
  body: PhoneNumberPrivacyRequest,
  signer: AuthSigner
): Promise<string> {
  // Sign payload using provided account and authentication method.
  const bodyString = JSON.stringify(body)
  if (signer.authenticationMethod === AuthenticationMethod.ENCRYPTION_KEY) {
    return signWithDEK(bodyString, signer as EncryptionKeySigner)
  }
  if (signer.authenticationMethod === AuthenticationMethod.WALLET_KEY) {
    return signer.contractKit.connection.sign(bodyString, body.account)
  }
  throw new Error('AuthenticationMethod not supported')
}

/**
 * Send an OdisRequest to ODIS
 * @param body OdisRequest to send in the body of the HTTP request.
 * @param context Contains service URL and public to determine which instance to contact.
 * @param endpoint Endpoint to query
 * @param responseSchema io-ts schema to ensure type safety of responses
 * @param headers custom request headers corresponding to the type of OdisRequest (keyVersion, Authentication, etc.)
 */
export async function queryOdis<R extends OdisRequest>(
  body: R,
  context: ServiceContext,
  endpoint: CombinerEndpoint,
  responseSchema: t.Type<OdisResponse<R>>,
  headers: OdisRequestHeader<R>
): Promise<OdisResponse<R>> {
  debug(`Posting to ${endpoint}`)

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
        res = await fetch(context.odisUrl + endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(body),
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

/**
 * Send the given domain request to ODIS (e.g. to get a POPRF evaluation or check quota).
 *
 * @param body Request to send in the body of the HTTP request.
 * @param context Contains service URL and public to determine which instance to contact.
 * @param endpoint Endpoint to query (e.g. '/domain/sign', '/domain/quotaStatus').
 * @param responseSchema io-ts type for the expected response type. Provided to ensure type safety.
 * @param headers optional header fields relevant to the given request type (keyVersion, Authentication, etc.)
 */
export async function sendOdisDomainRequest<R extends DomainRequest>(
  body: R,
  context: ServiceContext,
  endpoint: DomainEndpoint,
  responseSchema: t.Type<OdisResponse<R>>,
  headers?: DomainRequestHeader<R>
): Promise<DomainResponse<R>> {
  return queryOdis(
    body,
    context,
    endpoint,
    responseSchema,
    headers as OdisRequestHeader<R>
  ) as Promise<DomainResponse<R>>
}
