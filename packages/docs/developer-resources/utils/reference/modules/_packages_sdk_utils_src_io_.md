# Module: "packages/sdk/utils/src/io"

## Index

### References

* [URL_REGEX](_packages_sdk_utils_src_io_.md#url_regex)
* [isValidUrl](_packages_sdk_utils_src_io_.md#isvalidurl)

### Type aliases

* [Address](_packages_sdk_utils_src_io_.md#address)
* [AttestationRequest](_packages_sdk_utils_src_io_.md#attestationrequest)
* [AttestationResponse](_packages_sdk_utils_src_io_.md#attestationresponse)
* [AttestationServiceTestRequest](_packages_sdk_utils_src_io_.md#attestationservicetestrequest)
* [E164Number](_packages_sdk_utils_src_io_.md#e164number)
* [GetAttestationRequest](_packages_sdk_utils_src_io_.md#getattestationrequest)
* [Signature](_packages_sdk_utils_src_io_.md#signature)

### Variables

* [AddressType](_packages_sdk_utils_src_io_.md#const-addresstype)
* [AttestationRequestType](_packages_sdk_utils_src_io_.md#const-attestationrequesttype)
* [AttestationResponseType](_packages_sdk_utils_src_io_.md#const-attestationresponsetype)
* [AttestationServiceStatusResponseType](_packages_sdk_utils_src_io_.md#const-attestationservicestatusresponsetype)
* [AttestationServiceTestRequestType](_packages_sdk_utils_src_io_.md#const-attestationservicetestrequesttype)
* [E164PhoneNumberType](_packages_sdk_utils_src_io_.md#const-e164phonenumbertype)
* [GetAttestationRequestType](_packages_sdk_utils_src_io_.md#const-getattestationrequesttype)
* [JSONStringType](_packages_sdk_utils_src_io_.md#const-jsonstringtype)
* [PublicKeyType](_packages_sdk_utils_src_io_.md#const-publickeytype)
* [SaltType](_packages_sdk_utils_src_io_.md#const-salttype)
* [SignatureType](_packages_sdk_utils_src_io_.md#const-signaturetype)
* [UrlType](_packages_sdk_utils_src_io_.md#const-urltype)

## References

###  URL_REGEX

• **URL_REGEX**:

___

###  isValidUrl

• **isValidUrl**:

## Type aliases

###  Address

Ƭ **Address**: *t.TypeOf‹typeof AddressType›*

*Defined in [packages/sdk/utils/src/io.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L101)*

___

###  AttestationRequest

Ƭ **AttestationRequest**: *t.TypeOf‹typeof AttestationRequestType›*

*Defined in [packages/sdk/utils/src/io.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L116)*

___

###  AttestationResponse

Ƭ **AttestationResponse**: *t.TypeOf‹typeof AttestationResponseType›*

*Defined in [packages/sdk/utils/src/io.ts:162](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L162)*

___

###  AttestationServiceTestRequest

Ƭ **AttestationServiceTestRequest**: *t.TypeOf‹typeof AttestationServiceTestRequestType›*

*Defined in [packages/sdk/utils/src/io.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L98)*

___

###  E164Number

Ƭ **E164Number**: *t.TypeOf‹typeof E164PhoneNumberType›*

*Defined in [packages/sdk/utils/src/io.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L102)*

___

###  GetAttestationRequest

Ƭ **GetAttestationRequest**: *t.TypeOf‹typeof GetAttestationRequestType›*

*Defined in [packages/sdk/utils/src/io.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L128)*

___

###  Signature

Ƭ **Signature**: *t.TypeOf‹typeof SignatureType›*

*Defined in [packages/sdk/utils/src/io.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L100)*

## Variables

### `Const` AddressType

• **AddressType**: *Type‹string, string, unknown›* = new t.Type<string, string, unknown>(
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

*Defined in [packages/sdk/utils/src/io.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L51)*

___

### `Const` AttestationRequestType

• **AttestationRequestType**: *TypeC‹object›* = t.type({
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

*Defined in [packages/sdk/utils/src/io.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L104)*

___

### `Const` AttestationResponseType

• **AttestationResponseType**: *TypeC‹object›* = t.type({
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

*Defined in [packages/sdk/utils/src/io.ts:130](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L130)*

___

### `Const` AttestationServiceStatusResponseType

• **AttestationServiceStatusResponseType**: *TypeC‹object›* = t.type({
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
})

*Defined in [packages/sdk/utils/src/io.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L79)*

___

### `Const` AttestationServiceTestRequestType

• **AttestationServiceTestRequestType**: *TypeC‹object›* = t.type({
  phoneNumber: E164PhoneNumberType,
  message: t.string,
  signature: SignatureType,
  provider: t.union([t.string, t.undefined]),
})

*Defined in [packages/sdk/utils/src/io.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L92)*

___

### `Const` E164PhoneNumberType

• **E164PhoneNumberType**: *Type‹string, string, unknown›* = new t.Type<string, string, unknown>(
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

*Defined in [packages/sdk/utils/src/io.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L39)*

___

### `Const` GetAttestationRequestType

• **GetAttestationRequestType**: *TypeC‹object›* = t.type({
  phoneNumber: E164PhoneNumberType,
  account: AddressType,
  issuer: AddressType,
  // io-ts way of defining optional key-value pair
  salt: t.union([t.undefined, SaltType]),
  // if the value supplied matches the stored security code, the response will include the complete message
  securityCode: t.union([t.undefined, t.string]),
})

*Defined in [packages/sdk/utils/src/io.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L118)*

___

### `Const` JSONStringType

• **JSONStringType**: *Type‹string, string, unknown›* = new t.Type<string, string, unknown>(
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

*Defined in [packages/sdk/utils/src/io.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L24)*

___

### `Const` PublicKeyType

• **PublicKeyType**: *Type‹string, string, unknown›* = new t.Type<string, string, unknown>(
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

*Defined in [packages/sdk/utils/src/io.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L63)*

___

### `Const` SaltType

• **SaltType**: *StringC‹›* = t.string

*Defined in [packages/sdk/utils/src/io.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L77)*

___

### `Const` SignatureType

• **SignatureType**: *StringC‹›* = t.string

*Defined in [packages/sdk/utils/src/io.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L75)*

___

### `Const` UrlType

• **UrlType**: *Type‹string, string, unknown›* = new t.Type<string, string, unknown>(
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

*Defined in [packages/sdk/utils/src/io.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L12)*
