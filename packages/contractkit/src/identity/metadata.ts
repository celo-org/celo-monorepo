import fetch from 'cross-fetch'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'

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

export const ClaimType = t.union([AttestationServiceURLClaimType, DnsClaimType, NameClaimType])
export const SignedClaimType = t.type({
  payload: ClaimType,
  signature: SignatureType,
})

export const IdentityMetadataType = t.type({
  claims: t.array(SignedClaimType),
})

export type SignedClaim = t.TypeOf<typeof SignedClaimType>
export type AttestationServiceURLClaim = t.TypeOf<typeof AttestationServiceURLClaimType>
export type DnsClaim = t.TypeOf<typeof DnsClaimType>
export type NameClaim = t.TypeOf<typeof NameClaimType>
export type IdentityMetadata = t.TypeOf<typeof IdentityMetadataType>
export type Claim = AttestationServiceURLClaim | DnsClaim | NameClaim

type ClaimPayload<K extends ClaimTypes> = K extends typeof ClaimTypes.DNS
  ? DnsClaim
  : K extends typeof ClaimTypes.NAME ? NameClaim : AttestationServiceURLClaim

const isOfType = <K extends ClaimTypes>(type: K) => (
  data: SignedClaim['payload']
): data is ClaimPayload<K> => data.type === type

export class IdentityMetadataWrapper {
  data: IdentityMetadata

  static emptyData: IdentityMetadata = {
    claims: [],
  }

  static async fetchFromURL(url: string) {
    const resp = await fetch(url)
    if (!resp.ok) {
      throw new Error(`Request failed with status ${resp.status}`)
    }
    return this.fromRawString(await resp.text())
  }

  static fromRawString(rawData: string) {
    const data = JSON.parse(rawData)
    // TODO: We should validate:
    // 1. data.claims being an array
    // 2. payload being JSON-parsable
    // This is hard to put into io-ts + we need to eventually do signature checking
    const parsedData = {
      claims: data.claims.map((claim: any) => ({
        payload: JSON.parse(claim.payload),
        signature: claim.signature,
      })),
    }

    const validatedData = IdentityMetadataType.decode(parsedData)

    if (isLeft(validatedData)) {
      // TODO: We could probably return a more useful error in the future
      throw new Error(PathReporter.report(validatedData).join(', '))
    }

    return new IdentityMetadataWrapper(validatedData.right)
  }

  constructor(data: IdentityMetadata) {
    this.data = data
  }

  get claims() {
    return this.data.claims
  }

  toString() {
    return JSON.stringify({
      claims: this.data.claims.map((claim) => ({
        payload: JSON.stringify(claim.payload),
        signature: claim.signature,
      })),
    })
  }

  addClaim(claim: Claim) {
    this.data.claims.push(this.signClaim(claim))
  }

  findClaim<K extends ClaimTypes>(type: K): ClaimPayload<K> | undefined {
    return this.data.claims.map((x) => x.payload).find(isOfType(type))
  }

  private signClaim = (claim: Claim): SignedClaim => ({
    payload: claim,
    // TOOD: Actually sign the claim
    signature: '',
  })
}

const now = () => Math.round(new Date().getTime() / 1000)

export const createAttestationServiceURLClaim = (url: string): AttestationServiceURLClaim => ({
  url,
  timestamp: now(),
  type: ClaimTypes.ATTESTATION_SERVICE_URL,
})

export const createNameClaim = (name: string): NameClaim => ({
  name,
  timestamp: now(),
  type: ClaimTypes.NAME,
})
