import { findFirst } from 'fp-ts/lib/Array'
import {
  chain,
  Either,
  fromOption,
  map,
  mapLeft,
  parseJSON,
  toError,
  tryCatch,
} from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'

export enum ClaimTypes {
  ATTESTATION_SERVICE_URL = 'ATTESTATION_SERVICE_URL',
  DNS = 'DNS',
  NAME = 'NAME',
  PROFILE_PICTURE = 'PROFILE_PICTURE',
  TWITTER = 'TWITTER',
}

const UrlType = t.string
const SignatureType = t.string
const TimestampType = t.number

const AttestationServiceURLClaimType = t.type({
  type: t.literal(ClaimTypes.ATTESTATION_SERVICE_URL),
  timestamp: TimestampType,
  url: UrlType,
})

const DnsClaimType = t.type({
  type: t.literal(ClaimTypes.DNS),
  timestamp: TimestampType,
  domain: t.string,
})

const NameClaimType = t.type({
  type: t.literal(ClaimTypes.NAME),
  timestamp: TimestampType,
  name: t.string,
})

export class ValidationError extends Error {}
// tslint:disable-next-line: max-classes-per-file
export class ClaimNotFoundError extends Error {}

export const findClaim = (type: ClaimTypes) => (data: IdentityMetadata) =>
  pipe(
    data.claims,
    findFirst((claim: SignedClaim) => claim.payload.type === type),
    fromOption(() => new ClaimNotFoundError('Could not find claim')),
    map((signedClaim) => signedClaim.payload)
  )

export const validateMetadata = (data: any): Either<ValidationError, IdentityMetadata> => {
  const result = IdentityMetadataType.decode(data)
  return mapLeft(toError)(result)
}

export function serializeMetadata(data: IdentityMetadata) {
  return JSON.stringify({
    claims: data.claims.map((claim) => ({
      payload: JSON.stringify(claim.payload),
      signature: claim.signature,
    })),
  })
}

export const parseMetadata = (str: string) => {
  const firstPass = parseJSON(str, toError)
  return chain(deserializePayloads)(firstPass)
}

const deserializePayloads = (data: any) => {
  // TODO: Check signatures
  return tryCatch(() => {
    return {
      claims: data.claims.map((claim: any) => ({
        payload: JSON.parse(claim.payload),
        signature: claim.signature,
      })),
    }
  }, (reason: any) => new ValidationError(reason.toString()))
}

export const ClaimType = t.union([AttestationServiceURLClaimType, DnsClaimType, NameClaimType])
export const SignedClaimType = t.type({
  payload: ClaimType,
  signature: SignatureType,
})

export const IdentityMetadataType = t.type({
  claims: t.array(SignedClaimType),
})

export type Claim = t.TypeOf<typeof ClaimType>
export type SignedClaim = t.TypeOf<typeof SignedClaimType>
export type AttestationServiceURLClaim = t.TypeOf<typeof AttestationServiceURLClaimType>
export type NameClaim = t.TypeOf<typeof NameClaimType>
export type IdentityMetadata = t.TypeOf<typeof IdentityMetadataType>
