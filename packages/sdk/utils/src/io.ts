import { URL_REGEX } from '@celo/base/lib/io'
import { isValidPublic, toChecksumAddress } from 'ethereumjs-util'
import { either } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { isValidAddress } from './address'
import { isE164NumberStrict } from './phoneNumbers'

// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
export { isValidUrl, URL_REGEX } from '@celo/base/lib/io'

export const UrlType = new t.Type<string, string, unknown>(
  'Url',
  t.string.is,
  (input, context) =>
    either.chain(t.string.validate(input, context), (stringValue) =>
      URL_REGEX.test(stringValue)
        ? t.success(stringValue)
        : t.failure(stringValue, context, 'is not a valid url')
    ),
  String
)

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

export const E164PhoneNumberType = new t.Type<string, string, unknown>(
  'E164Number',
  t.string.is,
  (input, context) =>
    either.chain(t.string.validate(input, context), (stringValue) =>
      isE164NumberStrict(stringValue)
        ? t.success(stringValue)
        : t.failure(stringValue, context, 'is not a valid e164 number')
    ),
  String
)

export const AddressType = new t.Type<string, string, unknown>(
  'Address',
  t.string.is,
  (input, context) =>
    either.chain(t.string.validate(input, context), (stringValue) =>
      isValidAddress(stringValue)
        ? t.success(toChecksumAddress(stringValue))
        : t.failure(stringValue, context, 'is not a valid address')
    ),
  String
)

export const PublicKeyType = new t.Type<string, string, unknown>(
  'Public Key',
  t.string.is,
  (input, context) =>
    either.chain(t.string.validate(input, context), (stringValue) =>
      stringValue.startsWith('0x') && isValidPublic(Buffer.from(stringValue.slice(2), 'hex'), true)
        ? t.success(toChecksumAddress(stringValue))
        : t.failure(stringValue, context, 'is not a valid public key')
    ),
  String
)

export const SignatureType = t.string

export const SaltType = t.string

export const AttestationServiceStatusResponseType = t.type({
  status: t.literal('ok'),
  smsProviders: t.array(t.string),
  blacklistedRegionCodes: t.union([t.array(t.string), t.undefined]),
  accountAddress: AddressType,
  signature: t.union([SignatureType, t.undefined]),
  version: t.string,
  latestBlock: t.number,
  ageOfLatestBlock: t.number,
  isNodeSyncing: t.boolean,
  appSignature: t.string,
  smsProvidersRandomized: t.boolean,
  maxDeliveryAttempts: t.number,
  maxRerequestMins: t.number,
  twilioVerifySidProvided: t.boolean,
})

export const AttestationServiceTestRequestType = t.type({
  phoneNumber: E164PhoneNumberType,
  message: t.string,
  signature: SignatureType,
  provider: t.union([t.string, t.undefined]),
})
export type AttestationServiceTestRequest = t.TypeOf<typeof AttestationServiceTestRequestType>

export type Signature = t.TypeOf<typeof SignatureType>
export type Address = t.TypeOf<typeof AddressType>
export type E164Number = t.TypeOf<typeof E164PhoneNumberType>

export const AttestationRequestType = t.type({
  phoneNumber: E164PhoneNumberType,
  account: AddressType,
  issuer: AddressType,
  // io-ts way of defining optional key-value pair
  salt: t.union([t.undefined, SaltType]),
  smsRetrieverAppSig: t.union([t.undefined, t.string]),
  // if specified, the message sent will be short random number prefixed by this string
  securityCodePrefix: t.union([t.undefined, t.string]),
  language: t.union([t.undefined, t.string]),
})

export type AttestationRequest = t.TypeOf<typeof AttestationRequestType>

export const GetAttestationRequestType = t.type({
  phoneNumber: E164PhoneNumberType,
  account: AddressType,
  issuer: AddressType,
  // io-ts way of defining optional key-value pair
  salt: t.union([t.undefined, SaltType]),
  // if the value supplied matches the stored security code, the response will include the complete message
  securityCode: t.union([t.undefined, t.string]),
})

export type GetAttestationRequest = t.TypeOf<typeof GetAttestationRequestType>

export const AttestationResponseType = t.type({
  // Always returned in 1.0.x
  success: t.boolean,

  // Returned for errors in 1.0.x
  error: t.union([t.undefined, t.string]),

  // Stringifyed JSON dict of dicts, mapping attempt to error info.
  errors: t.union([t.undefined, t.string]),

  // Returned for successful send in 1.0.x
  provider: t.union([t.undefined, t.string]),

  // New fields
  identifier: t.union([t.undefined, t.string]),
  account: t.union([t.undefined, AddressType]),
  issuer: t.union([t.undefined, AddressType]),
  status: t.union([t.undefined, t.string]),
  attempt: t.union([t.undefined, t.number]),
  countryCode: t.union([t.undefined, t.string]),

  // Time to receive eventual delivery/failure (inc retries)
  duration: t.union([t.undefined, t.number]),

  // Only used by test endpoint to return randomly generated salt.
  // Never return a user-supplied salt.
  salt: t.union([t.undefined, t.string]),

  // only returned if the request supplied the correct security code
  attestationCode: t.union([t.undefined, t.string]),
})

export type AttestationResponse = t.TypeOf<typeof AttestationResponseType>
