// Utilities for interacting with the Phone Number Privacy Service service (aka PGPNP)

import { ContractKit } from '../../kit'
const TAG = 'contractkit/utils/phone-number-lookup/phone-number-lookup'

export interface WalletKeySigner {
  authenticationMethod: AuthenticationMethod.WALLETKEY
  contractKit: ContractKit
}

export interface EncryptionKeySigner {
  authenticationMethod: AuthenticationMethod.ENCRYPTIONKEY
  contractKit: ContractKit
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

export interface Logger {
  debug: (tag: string, ...messages: string[]) => void
}

export interface ServiceContext {
  pgpnpUrl: string // Phone Number Privacy service url
  pgpnpPubKey: string
}

export async function postToPhoneNumPrivacyService<ResponseType>(
  signer: AuthSigner,
  body: PhoneNumberPrivacyRequest,
  context: ServiceContext,
  endpoint: string,
  logger: Logger,
  handleFailure: (response: Response) => void
) {
  logger.debug(`${TAG}@postToPGPNP`, `Posting to ${endpoint}`)

  // Sign payload using account privkey
  const bodyString = JSON.stringify(body)

  let account = body.account
  if (signer.authenticationMethod === AuthenticationMethod.ENCRYPTIONKEY) {
    account = signer.rawKey
  }
  const authHeader = await signer.contractKit.web3.eth.sign(bodyString, account)

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
    handleFailure(res)
  }

  logger.debug(`${TAG}@postToPGPNP`, 'Response ok. Parsing.')
  const response = await res.json()
  return response as ResponseType
}
