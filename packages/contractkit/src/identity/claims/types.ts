import { either } from 'fp-ts/lib/Either'
import * as t from 'io-ts'

export const UrlType = t.string
export const SignatureType = t.string
export const TimestampType = t.number
export const AddressType = t.string

export const JSONStringType = new t.Type<string, string, unknown>(
  'JSONString',
  t.string.is,
  (input, context) =>
    either.chain(t.string.validate(input, context), (stringValue) => {
      try {
        JSON.parse(stringValue)
        return t.success(stringValue)
      } catch (error) {
        return t.failure(stringValue, context, 'can not be parsed as JSON')
      }
    }),
  String
)

export const now = () => Math.round(new Date().getTime() / 1000)

export enum ClaimTypes {
  ATTESTATION_SERVICE_URL = 'ATTESTATION_SERVICE_URL',
  DOMAIN = 'DOMAIN',
  KEYBASE = 'KEYBASE',
  NAME = 'NAME',
  PROFILE_PICTURE = 'PROFILE_PICTURE',
  TWITTER = 'TWITTER',
}

export const VERIFIABLE_CLAIM_TYPES = [ClaimTypes.KEYBASE]
