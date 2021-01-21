# packages/sdk/utils/src/io

## Index

### References

* [URL\_REGEX](_packages_sdk_utils_src_io_.md#url_regex)
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

### URL\_REGEX

• **URL\_REGEX**:

### isValidUrl

• **isValidUrl**:

## Type aliases

### Address

Ƭ **Address**: _t.TypeOf‹typeof AddressType›_

_Defined in_ [_packages/sdk/utils/src/io.ts:101_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L101)

### AttestationRequest

Ƭ **AttestationRequest**: _t.TypeOf‹typeof AttestationRequestType›_

_Defined in_ [_packages/sdk/utils/src/io.ts:116_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L116)

### AttestationResponse

Ƭ **AttestationResponse**: _t.TypeOf‹typeof AttestationResponseType›_

_Defined in_ [_packages/sdk/utils/src/io.ts:162_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L162)

### AttestationServiceTestRequest

Ƭ **AttestationServiceTestRequest**: _t.TypeOf‹typeof AttestationServiceTestRequestType›_

_Defined in_ [_packages/sdk/utils/src/io.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L98)

### E164Number

Ƭ **E164Number**: _t.TypeOf‹typeof E164PhoneNumberType›_

_Defined in_ [_packages/sdk/utils/src/io.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L102)

### GetAttestationRequest

Ƭ **GetAttestationRequest**: _t.TypeOf‹typeof GetAttestationRequestType›_

_Defined in_ [_packages/sdk/utils/src/io.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L128)

### Signature

Ƭ **Signature**: _t.TypeOf‹typeof SignatureType›_

_Defined in_ [_packages/sdk/utils/src/io.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L100)

## Variables

### `Const` AddressType

• **AddressType**: _Type‹string, string, unknown›_ = new t.Type\( 'Address', t.string.is, \(input, context\) =&gt; either.chain\(t.string.validate\(input, context\), \(stringValue\) =&gt; isValidAddress\(stringValue\) ? t.success\(toChecksumAddress\(stringValue\)\) : t.failure\(stringValue, context, 'is not a valid address'\) \), String \)

_Defined in_ [_packages/sdk/utils/src/io.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L51)

### `Const` AttestationRequestType

• **AttestationRequestType**: _TypeC‹object›_ = t.type\({ phoneNumber: E164PhoneNumberType, account: AddressType, issuer: AddressType, // io-ts way of defining optional key-value pair salt: t.union\(\[t.undefined, SaltType\]\), smsRetrieverAppSig: t.union\(\[t.undefined, t.string\]\), // if specified, the message sent will be short random number prefixed by this string securityCodePrefix: t.union\(\[t.undefined, t.string\]\), language: t.union\(\[t.undefined, t.string\]\), }\)

_Defined in_ [_packages/sdk/utils/src/io.ts:104_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L104)

### `Const` AttestationResponseType

• **AttestationResponseType**: _TypeC‹object›_ = t.type\({ // Always returned in 1.0.x success: t.boolean,

// Returned for errors in 1.0.x error: t.union\(\[t.undefined, t.string\]\),

// Stringifyed JSON dict of dicts, mapping attempt to error info. errors: t.union\(\[t.undefined, t.string\]\),

// Returned for successful send in 1.0.x provider: t.union\(\[t.undefined, t.string\]\),

// New fields identifier: t.union\(\[t.undefined, t.string\]\), account: t.union\(\[t.undefined, AddressType\]\), issuer: t.union\(\[t.undefined, AddressType\]\), status: t.union\(\[t.undefined, t.string\]\), attempt: t.union\(\[t.undefined, t.number\]\), countryCode: t.union\(\[t.undefined, t.string\]\),

// Time to receive eventual delivery/failure \(inc retries\) duration: t.union\(\[t.undefined, t.number\]\),

// Only used by test endpoint to return randomly generated salt. // Never return a user-supplied salt. salt: t.union\(\[t.undefined, t.string\]\),

// only returned if the request supplied the correct security code attestationCode: t.union\(\[t.undefined, t.string\]\), }\)

_Defined in_ [_packages/sdk/utils/src/io.ts:130_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L130)

### `Const` AttestationServiceStatusResponseType

• **AttestationServiceStatusResponseType**: _TypeC‹object›_ = t.type\({ status: t.literal\('ok'\), smsProviders: t.array\(t.string\), blacklistedRegionCodes: t.union\(\[t.array\(t.string\), t.undefined\]\), accountAddress: AddressType, signature: t.union\(\[SignatureType, t.undefined\]\), version: t.string, latestBlock: t.number, ageOfLatestBlock: t.number, isNodeSyncing: t.boolean, appSignature: t.string, }\)

_Defined in_ [_packages/sdk/utils/src/io.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L79)

### `Const` AttestationServiceTestRequestType

• **AttestationServiceTestRequestType**: _TypeC‹object›_ = t.type\({ phoneNumber: E164PhoneNumberType, message: t.string, signature: SignatureType, provider: t.union\(\[t.string, t.undefined\]\), }\)

_Defined in_ [_packages/sdk/utils/src/io.ts:92_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L92)

### `Const` E164PhoneNumberType

• **E164PhoneNumberType**: _Type‹string, string, unknown›_ = new t.Type\( 'E164Number', t.string.is, \(input, context\) =&gt; either.chain\(t.string.validate\(input, context\), \(stringValue\) =&gt; isE164NumberStrict\(stringValue\) ? t.success\(stringValue\) : t.failure\(stringValue, context, 'is not a valid e164 number'\) \), String \)

_Defined in_ [_packages/sdk/utils/src/io.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L39)

### `Const` GetAttestationRequestType

• **GetAttestationRequestType**: _TypeC‹object›_ = t.type\({ phoneNumber: E164PhoneNumberType, account: AddressType, issuer: AddressType, // io-ts way of defining optional key-value pair salt: t.union\(\[t.undefined, SaltType\]\), // if the value supplied matches the stored security code, the response will include the complete message securityCode: t.union\(\[t.undefined, t.string\]\), }\)

_Defined in_ [_packages/sdk/utils/src/io.ts:118_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L118)

### `Const` JSONStringType

• **JSONStringType**: _Type‹string, string, unknown›_ = new t.Type\( 'JSONString', t.string.is, \(input, context\) =&gt; either.chain\(t.string.validate\(input, context\), \(stringValue\) =&gt; { try { JSON.parse\(stringValue\) return t.success\(stringValue\) } catch \(error\) { return t.failure\(stringValue, context, 'can not be parsed as JSON'\) } }\), String \)

_Defined in_ [_packages/sdk/utils/src/io.ts:24_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L24)

### `Const` PublicKeyType

• **PublicKeyType**: _Type‹string, string, unknown›_ = new t.Type\( 'Public Key', t.string.is, \(input, context\) =&gt; either.chain\(t.string.validate\(input, context\), \(stringValue\) =&gt; stringValue.startsWith\('0x'\) && isValidPublic\(Buffer.from\(stringValue.slice\(2\), 'hex'\), true\) ? t.success\(toChecksumAddress\(stringValue\)\) : t.failure\(stringValue, context, 'is not a valid public key'\) \), String \)

_Defined in_ [_packages/sdk/utils/src/io.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L63)

### `Const` SaltType

• **SaltType**: _StringC‹›_ = t.string

_Defined in_ [_packages/sdk/utils/src/io.ts:77_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L77)

### `Const` SignatureType

• **SignatureType**: _StringC‹›_ = t.string

_Defined in_ [_packages/sdk/utils/src/io.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L75)

### `Const` UrlType

• **UrlType**: _Type‹string, string, unknown›_ = new t.Type\( 'Url', t.string.is, \(input, context\) =&gt; either.chain\(t.string.validate\(input, context\), \(stringValue\) =&gt; URL\_REGEX.test\(stringValue\) ? t.success\(stringValue\) : t.failure\(stringValue, context, 'is not a valid url'\) \), String \)

_Defined in_ [_packages/sdk/utils/src/io.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/io.ts#L12)

