import { hashMessage } from '@celo/utils/lib/signatureUtils'
import * as t from 'io-ts'
import { ContractKit } from '../../kit'
import { AccountClaim, AccountClaimType, MetadataURLGetter, verifyAccountClaim } from './account'
import {
  AttestationServiceURLClaim,
  AttestationServiceURLClaimType,
  validateAttestationServiceUrl,
} from './attestation-service-url'
import { KeybaseClaim, KeybaseClaimType, verifyKeybaseClaim } from './keybase'
import { ClaimTypes, now, SignatureType, TimestampType } from './types'

const DomainClaimType = t.type({
  type: t.literal(ClaimTypes.DOMAIN),
  timestamp: TimestampType,
  domain: t.string,
})

const NameClaimType = t.type({
  type: t.literal(ClaimTypes.NAME),
  timestamp: TimestampType,
  name: t.string,
})

export const ClaimType = t.union([
  AttestationServiceURLClaimType,
  AccountClaimType,
  DomainClaimType,
  KeybaseClaimType,
  NameClaimType,
])

export const SignedClaimType = t.type({
  claim: ClaimType,
  signature: SignatureType,
})

export type DomainClaim = t.TypeOf<typeof DomainClaimType>
export type NameClaim = t.TypeOf<typeof NameClaimType>
export type Claim =
  | AttestationServiceURLClaim
  | DomainClaim
  | KeybaseClaim
  | NameClaim
  | AccountClaim

export type ClaimPayload<K extends ClaimTypes> = K extends typeof ClaimTypes.DOMAIN
  ? DomainClaim
  : K extends typeof ClaimTypes.NAME
    ? NameClaim
    : K extends typeof ClaimTypes.KEYBASE
      ? KeybaseClaim
      : K extends typeof ClaimTypes.ATTESTATION_SERVICE_URL
        ? AttestationServiceURLClaim
        : AccountClaim

export const isOfType = <K extends ClaimTypes>(type: K) => (data: Claim): data is ClaimPayload<K> =>
  data.type === type

/**
 * Verifies a claim made by an account, i.e. whether a claim can be verified to be correct
 * @param claim The claim to verify
 * @param address The address that is making the claim
 * @param metadataURLGetter A function that can retrieve the metadata URL for a given account address,
 *                          should be Accounts.getMetadataURL()
 * @returns If valid, returns undefined. If invalid or unable to verify, returns a string with the error
 */
export async function verifyClaim(
  claim: Claim,
  address: string,
  metadataURLGetter: MetadataURLGetter
) {
  switch (claim.type) {
    case ClaimTypes.KEYBASE:
      return verifyKeybaseClaim(claim, address)
    case ClaimTypes.ACCOUNT:
      return verifyAccountClaim(claim, address, metadataURLGetter)
    default:
      break
  }
  return
}

/**
 * Validates a claim made by an account, i.e. whether the claim is usable
 * @param claim The claim to validate
 * @param address The address that is making the claim
 * @returns If valid, returns undefined. If invalid or unable to validate, returns a string with the error
 */
export async function validateClaim(claim: Claim, address: string, kit: ContractKit) {
  switch (claim.type) {
    case ClaimTypes.ATTESTATION_SERVICE_URL:
      return validateAttestationServiceUrl(claim, address, kit)
    default:
      break
  }
  return
}

export function hashOfClaim(claim: Claim) {
  return hashMessage(serializeClaim(claim))
}

export function hashOfClaims(claims: Claim[]) {
  const hashes = claims.map(hashOfClaim)
  return hashMessage(hashes.join(''))
}

export function serializeClaim(claim: Claim) {
  return JSON.stringify(claim)
}

export const createNameClaim = (name: string): NameClaim => ({
  name,
  timestamp: now(),
  type: ClaimTypes.NAME,
})

export const createDomainClaim = (domain: string): DomainClaim => ({
  domain,
  timestamp: now(),
  type: ClaimTypes.DOMAIN,
})
