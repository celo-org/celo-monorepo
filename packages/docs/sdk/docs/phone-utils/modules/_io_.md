[@celo/phone-utils](../README.md) › ["io"](_io_.md)

# Module: "io"

## Index

### Type aliases

* [AttestationRequest](_io_.md#attestationrequest)
* [AttestationResponse](_io_.md#attestationresponse)
* [AttestationServiceTestRequest](_io_.md#attestationservicetestrequest)
* [E164Number](_io_.md#e164number)
* [GetAttestationRequest](_io_.md#getattestationrequest)

### Variables

* [AttestationRequestType](_io_.md#const-attestationrequesttype)
* [AttestationResponseType](_io_.md#const-attestationresponsetype)
* [AttestationServiceStatusResponseType](_io_.md#const-attestationservicestatusresponsetype)
* [AttestationServiceTestRequestType](_io_.md#const-attestationservicetestrequesttype)
* [E164PhoneNumberType](_io_.md#const-e164phonenumbertype)
* [GetAttestationRequestType](_io_.md#const-getattestationrequesttype)

## Type aliases

###  AttestationRequest

Ƭ **AttestationRequest**: *t.TypeOf‹typeof AttestationRequestType›*

*Defined in [io.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L58)*

___

###  AttestationResponse

Ƭ **AttestationResponse**: *t.TypeOf‹typeof AttestationResponseType›*

*Defined in [io.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L104)*

___

###  AttestationServiceTestRequest

Ƭ **AttestationServiceTestRequest**: *t.TypeOf‹typeof AttestationServiceTestRequestType›*

*Defined in [io.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L40)*

___

###  E164Number

Ƭ **E164Number**: *t.TypeOf‹typeof E164PhoneNumberType›*

*Defined in [io.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L42)*

___

###  GetAttestationRequest

Ƭ **GetAttestationRequest**: *t.TypeOf‹typeof GetAttestationRequestType›*

*Defined in [io.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L70)*

## Variables

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
  // unblinded signature
  phoneNumberSignature: t.union([t.undefined, t.string]),
})

*Defined in [io.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L44)*

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

*Defined in [io.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L72)*

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
  smsProvidersRandomized: t.boolean,
  maxDeliveryAttempts: t.number,
  maxRerequestMins: t.number,
  twilioVerifySidProvided: t.boolean,
})

*Defined in [io.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L17)*

___

### `Const` AttestationServiceTestRequestType

• **AttestationServiceTestRequestType**: *TypeC‹object›* = t.type({
  phoneNumber: E164PhoneNumberType,
  message: t.string,
  signature: SignatureType,
  provider: t.union([t.string, t.undefined]),
})

*Defined in [io.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L34)*

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

*Defined in [io.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L6)*

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

*Defined in [io.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/io.ts#L60)*
