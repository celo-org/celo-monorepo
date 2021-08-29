# identity/claims/claim

## Index

### Type aliases

* [Claim](_identity_claims_claim_.md#claim)
* [ClaimPayload](_identity_claims_claim_.md#claimpayload)
* [DomainClaim](_identity_claims_claim_.md#domainclaim)
* [KeybaseClaim](_identity_claims_claim_.md#keybaseclaim)
* [NameClaim](_identity_claims_claim_.md#nameclaim)
* [StorageClaim](_identity_claims_claim_.md#storageclaim)

### Variables

* [ClaimType](_identity_claims_claim_.md#const-claimtype)
* [DOMAIN\_TXT\_HEADER](_identity_claims_claim_.md#const-domain_txt_header)
* [KeybaseClaimType](_identity_claims_claim_.md#const-keybaseclaimtype)
* [SignedClaimType](_identity_claims_claim_.md#const-signedclaimtype)

### Functions

* [createDomainClaim](_identity_claims_claim_.md#const-createdomainclaim)
* [createNameClaim](_identity_claims_claim_.md#const-createnameclaim)
* [createStorageClaim](_identity_claims_claim_.md#const-createstorageclaim)
* [hashOfClaim](_identity_claims_claim_.md#hashofclaim)
* [hashOfClaims](_identity_claims_claim_.md#hashofclaims)
* [isOfType](_identity_claims_claim_.md#const-isoftype)
* [serializeClaim](_identity_claims_claim_.md#serializeclaim)
* [validateClaim](_identity_claims_claim_.md#validateclaim)

## Type aliases

### Claim

Ƭ **Claim**: [_AttestationServiceURLClaim_](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim) _\|_ [_DomainClaim_](_identity_claims_claim_.md#domainclaim) _\|_ [_KeybaseClaim_](_identity_claims_claim_.md#keybaseclaim) _\|_ [_NameClaim_](_identity_claims_claim_.md#nameclaim) _\|_ [_AccountClaim_](_identity_claims_account_.md#accountclaim) _\|_ [_StorageClaim_](_identity_claims_claim_.md#storageclaim)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L57)

### ClaimPayload

Ƭ **ClaimPayload**: _K extends typeof DOMAIN ? DomainClaim : K extends typeof NAME ? NameClaim : K extends typeof KEYBASE ? KeybaseClaim : K extends typeof ATTESTATION\_SERVICE\_URL ? AttestationServiceURLClaim : K extends typeof ACCOUNT ? AccountClaim : StorageClaim_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L65)

### DomainClaim

Ƭ **DomainClaim**: _t.TypeOf‹typeof DomainClaimType›_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L54)

### KeybaseClaim

Ƭ **KeybaseClaim**: _t.TypeOf‹typeof KeybaseClaimType›_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L18)

### NameClaim

Ƭ **NameClaim**: _t.TypeOf‹typeof NameClaimType›_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L55)

### StorageClaim

Ƭ **StorageClaim**: _t.TypeOf‹typeof StorageClaimType›_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L56)

## Variables

### `Const` ClaimType

• **ClaimType**: _UnionC‹\[TypeC‹object›, Type‹object, any, unknown›, TypeC‹object›, TypeC‹object›, TypeC‹object›, TypeC‹object›\]›_ = t.union\(\[ AttestationServiceURLClaimType, AccountClaimType, DomainClaimType, KeybaseClaimType, NameClaimType, StorageClaimType, \]\)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L39)

### `Const` DOMAIN\_TXT\_HEADER

• **DOMAIN\_TXT\_HEADER**: _"celo-site-verification"_ = "celo-site-verification"

_Defined in_ [_contractkit/src/identity/claims/claim.ts:53_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L53)

### `Const` KeybaseClaimType

• **KeybaseClaimType**: _TypeC‹object›_ = t.type\({ type: t.literal\(ClaimTypes.KEYBASE\), timestamp: TimestampType, // TODO: Validate compliant username before just interpolating username: t.string, }\)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L12)

### `Const` SignedClaimType

• **SignedClaimType**: _TypeC‹object›_ = t.type\({ claim: ClaimType, signature: SignatureType, }\)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L48)

## Functions

### `Const` createDomainClaim

▸ **createDomainClaim**\(`domain`: string\): [_DomainClaim_](_identity_claims_claim_.md#domainclaim)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:116_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L116)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `domain` | string |

**Returns:** [_DomainClaim_](_identity_claims_claim_.md#domainclaim)

### `Const` createNameClaim

▸ **createNameClaim**\(`name`: string\): [_NameClaim_](_identity_claims_claim_.md#nameclaim)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:110_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L110)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `name` | string |

**Returns:** [_NameClaim_](_identity_claims_claim_.md#nameclaim)

### `Const` createStorageClaim

▸ **createStorageClaim**\(`storageURL`: string\): [_StorageClaim_](_identity_claims_claim_.md#storageclaim)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:122_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L122)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `storageURL` | string |

**Returns:** [_StorageClaim_](_identity_claims_claim_.md#storageclaim)

### hashOfClaim

▸ **hashOfClaim**\(`claim`: [Claim](_identity_claims_claim_.md#claim)\): _string_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:97_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L97)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `claim` | [Claim](_identity_claims_claim_.md#claim) |

**Returns:** _string_

### hashOfClaims

▸ **hashOfClaims**\(`claims`: [Claim](_identity_claims_claim_.md#claim)\[\]\): _string_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:101_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L101)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `claims` | [Claim](_identity_claims_claim_.md#claim)\[\] |

**Returns:** _string_

### `Const` isOfType

▸ **isOfType**&lt;**K**&gt;\(`type`: K\): _\(Anonymous function\)_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:77_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L77)

**Type parameters:**

▪ **K**: [_ClaimTypes_]()

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | K |

**Returns:** _\(Anonymous function\)_

### serializeClaim

▸ **serializeClaim**\(`claim`: [Claim](_identity_claims_claim_.md#claim)\): _string_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L106)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `claim` | [Claim](_identity_claims_claim_.md#claim) |

**Returns:** _string_

### validateClaim

▸ **validateClaim**\(`kit`: [ContractKit](), `claim`: [Claim](_identity_claims_claim_.md#claim), `address`: string\): _Promise‹undefined \| string›_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/claim.ts#L87)

Validates a claim made by an account, i.e. whether the claim is usable

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `kit` | [ContractKit]() | The ContractKit object |
| `claim` | [Claim](_identity_claims_claim_.md#claim) | The claim to validate |
| `address` | string | The address that is making the claim |

**Returns:** _Promise‹undefined \| string›_

If valid, returns undefined. If invalid or unable to validate, returns a string with the error

