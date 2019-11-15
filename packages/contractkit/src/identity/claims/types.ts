import * as t from 'io-ts'

export const SignatureType = t.string
export const TimestampType = t.number

export const now = () => Math.round(new Date().getTime() / 1000)

export enum ClaimTypes {
  ATTESTATION_SERVICE_URL = 'ATTESTATION_SERVICE_URL',
  ACCOUNT = 'ACCOUNT',
  DOMAIN = 'DOMAIN',
  KEYBASE = 'KEYBASE',
  NAME = 'NAME',
  PROFILE_PICTURE = 'PROFILE_PICTURE',
  TWITTER = 'TWITTER',
}

export const VERIFIABLE_CLAIM_TYPES = [ClaimTypes.KEYBASE, ClaimTypes.ACCOUNT]
