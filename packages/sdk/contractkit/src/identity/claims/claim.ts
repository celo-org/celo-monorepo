import { hashMessage } from '@celo/utils/lib/signatureUtils'
import * as t from 'io-ts'
import { AccountClaim, AccountClaimType } from './account'
import { ClaimTypes, now, SignatureType, TimestampType } from './types'

export const KeybaseClaimType = t.type({
  type: t.literal(ClaimTypes.KEYBASE),
  timestamp: TimestampType,
  // TODO: Validate compliant username before just interpolating
  username: t.string,
})
export type KeybaseClaim = t.TypeOf<typeof KeybaseClaimType>

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

const StorageClaimType = t.type({
  type: t.literal(ClaimTypes.STORAGE),
  timestamp: TimestampType,
  address: t.string,
  filteredDataPaths: t.string,
})

export const ClaimType = t.union([
  AccountClaimType,
  DomainClaimType,
  KeybaseClaimType,
  NameClaimType,
  StorageClaimType,
])

export const SignedClaimType = t.type({
  claim: ClaimType,
  signature: SignatureType,
})

export const DOMAIN_TXT_HEADER = 'celo-site-verification'
export type DomainClaim = t.TypeOf<typeof DomainClaimType>
export type NameClaim = t.TypeOf<typeof NameClaimType>
export type StorageClaim = t.TypeOf<typeof StorageClaimType>
export type Claim = DomainClaim | KeybaseClaim | NameClaim | AccountClaim | StorageClaim

export type ClaimPayload<K extends ClaimTypes> = K extends typeof ClaimTypes.DOMAIN
  ? DomainClaim
  : K extends typeof ClaimTypes.NAME
  ? NameClaim
  : K extends typeof ClaimTypes.KEYBASE
  ? KeybaseClaim
  : K extends typeof ClaimTypes.ACCOUNT
  ? AccountClaim
  : StorageClaim

/** @internal */
export const isOfType =
  <K extends ClaimTypes>(type: K) =>
  (data: Claim): data is ClaimPayload<K> =>
    data.type === type

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

export const createStorageClaim = (storageURL: string): StorageClaim => ({
  address: storageURL,
  timestamp: now(),
  type: ClaimTypes.STORAGE,
  filteredDataPaths: '.*',
})
