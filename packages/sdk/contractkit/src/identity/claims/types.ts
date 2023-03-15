import * as t from 'io-ts'

export const SignatureType = t.string
export const TimestampType = t.number

/** @internal */
export const now = () => Math.round(new Date().getTime() / 1000)

export enum ClaimTypes {
  ACCOUNT = 'ACCOUNT',
  DOMAIN = 'DOMAIN',
  KEYBASE = 'KEYBASE',
  NAME = 'NAME',
  PROFILE_PICTURE = 'PROFILE_PICTURE',
  STORAGE = 'STORAGE',
  TWITTER = 'TWITTER',
}

export const VERIFIABLE_CLAIM_TYPES = [ClaimTypes.KEYBASE, ClaimTypes.ACCOUNT, ClaimTypes.DOMAIN]
export const SINGULAR_CLAIM_TYPES = [ClaimTypes.NAME]
