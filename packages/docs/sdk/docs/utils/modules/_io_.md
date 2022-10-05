[@celo/utils](../README.md) › ["io"](_io_.md)

# Module: "io"

## Index

### References

* [URL_REGEX](_io_.md#url_regex)
* [isValidUrl](_io_.md#isvalidurl)

### Type aliases

* [Address](_io_.md#address)
* [Signature](_io_.md#signature)

### Variables

* [AddressType](_io_.md#const-addresstype)
* [AttestationServiceStatusResponseType](_io_.md#const-attestationservicestatusresponsetype)
* [JSONStringType](_io_.md#const-jsonstringtype)
* [PublicKeyType](_io_.md#const-publickeytype)
* [SaltType](_io_.md#const-salttype)
* [SignatureType](_io_.md#const-signaturetype)
* [UrlType](_io_.md#const-urltype)

## References

###  URL_REGEX

• **URL_REGEX**:

___

###  isValidUrl

• **isValidUrl**:

## Type aliases

###  Address

Ƭ **Address**: *t.TypeOf‹typeof AddressType›*

*Defined in [io.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L66)*

___

###  Signature

Ƭ **Signature**: *t.TypeOf‹typeof SignatureType›*

*Defined in [io.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L65)*

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

*Defined in [io.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L38)*

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

*Defined in [io.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L68)*

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

*Defined in [io.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L23)*

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

*Defined in [io.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L50)*

___

### `Const` SaltType

• **SaltType**: *StringC‹›* = t.string

*Defined in [io.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L63)*

___

### `Const` SignatureType

• **SignatureType**: *StringC‹›* = t.string

*Defined in [io.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L62)*

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

*Defined in [io.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L11)*
