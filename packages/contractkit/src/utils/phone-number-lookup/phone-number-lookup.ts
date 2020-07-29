// Utilities for interacting with the Phone Number Privacy Service service (aka PGPNP)

import { hexToBuffer } from '@celo/utils/lib/address'
import debugFactory from 'debug'
import { ec as EC } from 'elliptic'
import { ContractKit } from '../../kit'

const TAG = 'contractkit/utils/phone-number-lookup/phone-number-lookup'
const debug = debugFactory('kit:registry')
const ec = new EC('secp256k1')

export interface WalletKeySigner {
  authenticationMethod: AuthenticationMethod.WALLETKEY
  contractKit: ContractKit
}

export interface EncryptionKeySigner {
  authenticationMethod: AuthenticationMethod.ENCRYPTIONKEY
  rawKey: string
}

// Support signing with the DEK or with the
export type AuthSigner = WalletKeySigner | EncryptionKeySigner

export enum AuthenticationMethod {
  WALLETKEY = 'wallet_key',
  ENCRYPTIONKEY = 'encryption_key',
}

export interface PhoneNumberPrivacyRequest {
  account: string
  version: string
  authenticationMethod: AuthenticationMethod
}

export interface SignMessageRequest extends PhoneNumberPrivacyRequest {
  blindedQueryPhoneNumber: string
  hashedPhoneNumber?: string
}

export interface MatchmakingRequest extends PhoneNumberPrivacyRequest {
  userPhoneNumber: string
  contactPhoneNumbers: string[]
  hashedPhoneNumber: string
}

export interface SignMessageResponse {
  success: boolean
  combinedSignature: string
}

export interface MatchmakingResponse {
  success: boolean
  matchedContacts: Array<{
    phoneNumber: string
  }>
}

export enum ErrorMessages {
  PGPNP_QUOTA_ERROR = 'pgpnpQuotaError',
}

export interface ServiceContext {
  pgpnpUrl: string // Phone Number Privacy service url
  pgpnpPubKey: string
}

export async function postToPhoneNumPrivacyService<ResponseType>(
  signer: AuthSigner,
  body: PhoneNumberPrivacyRequest,
  context: ServiceContext,
  endpoint: string
) {
  debug(`${TAG}@postToPGPNP` + `Posting to ${endpoint}`)

  // Sign payload using account privkey
  const bodyString = JSON.stringify(body)

  let authHeader = ''
  if (signer.authenticationMethod === AuthenticationMethod.ENCRYPTIONKEY) {
    const key = ec.keyFromPrivate(hexToBuffer(signer.rawKey))
    authHeader = key.sign(bodyString).toDER()
  } else {
    authHeader = await signer.contractKit.web3.eth.sign(bodyString, body.account)
  }

  const { pgpnpUrl } = context
  const res = await fetch(pgpnpUrl + endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: bodyString,
  })

  if (!res.ok) {
    debug(`${TAG}@handleFailure` + `Response not okay. Status ${res.status}`)
    switch (res.status) {
      case 403:
        throw new Error(ErrorMessages.PGPNP_QUOTA_ERROR)
      default:
        throw new Error(`Unknown failure ${res.status}`)
    }
  }

  debug(`${TAG}@postToPGPNP` + 'Response ok. Parsing.')
  const response = await res.json()
  return response as ResponseType
}
