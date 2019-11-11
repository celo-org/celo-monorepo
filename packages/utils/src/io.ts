import { isValidPublic, toChecksumAddress } from 'ethereumjs-util'
import { either } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { isE164NumberStrict } from './phoneNumbers'
import { isValidAddress } from './signatureUtils'

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
    either.chain(
      t.string.validate(input, context),
      (stringValue) =>
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
    either.chain(
      t.string.validate(input, context),
      (stringValue) =>
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
    either.chain(
      t.string.validate(input, context),
      (stringValue) =>
        stringValue.startsWith('0x') &&
        isValidPublic(Buffer.from(stringValue.slice(2), 'hex'), true)
          ? t.success(toChecksumAddress(stringValue))
          : t.failure(stringValue, context, 'is not a valid public key')
    ),
  String
)

export type Address = t.TypeOf<typeof AddressType>
export type E164Number = t.TypeOf<typeof E164PhoneNumberType>
