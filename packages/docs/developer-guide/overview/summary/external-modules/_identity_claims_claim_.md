# identity/claims/claim

## Index

### Type aliases

* [Claim](_identity_claims_claim_.md#claim)
* [ClaimPayload](_identity_claims_claim_.md#claimpayload)
* [DomainClaim](_identity_claims_claim_.md#domainclaim)
* [KeybaseClaim](_identity_claims_claim_.md#keybaseclaim)
* [NameClaim](_identity_claims_claim_.md#nameclaim)

### Variables

* [ClaimType](_identity_claims_claim_.md#const-claimtype)
* [DOMAIN\_TXT\_HEADER](_identity_claims_claim_.md#const-domain_txt_header)
* [KeybaseClaimType](_identity_claims_claim_.md#const-keybaseclaimtype)
* [SignedClaimType](_identity_claims_claim_.md#const-signedclaimtype)

### Functions

* [createDomainClaim](_identity_claims_claim_.md#const-createdomainclaim)
* [createNameClaim](_identity_claims_claim_.md#const-createnameclaim)
* [hashOfClaim](_identity_claims_claim_.md#hashofclaim)
* [hashOfClaims](_identity_claims_claim_.md#hashofclaims)
* [isOfType](_identity_claims_claim_.md#const-isoftype)
* [serializeClaim](_identity_claims_claim_.md#serializeclaim)
* [validateClaim](_identity_claims_claim_.md#validateclaim)

## Type aliases

### Claim

Ƭ **Claim**: [_AttestationServiceURLClaim_](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim) _\|_ [_DomainClaim_](_identity_claims_claim_.md#domainclaim) _\|_ [_KeybaseClaim_](_identity_claims_claim_.md#keybaseclaim) _\|_ [_NameClaim_](_identity_claims_claim_.md#nameclaim) _\|_ [_AccountClaim_](_identity_claims_account_.md#accountclaim)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L48)

### ClaimPayload

Ƭ **ClaimPayload**: _K extends typeof DOMAIN ? DomainClaim : K extends typeof NAME ? NameClaim : K extends typeof KEYBASE ? KeybaseClaim : K extends typeof ATTESTATION\_SERVICE\_URL ? AttestationServiceURLClaim : AccountClaim_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L55)

### DomainClaim

Ƭ **DomainClaim**: _t.TypeOf‹typeof DomainClaimType›_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L46)

### KeybaseClaim

Ƭ **KeybaseClaim**: _t.TypeOf‹typeof KeybaseClaimType›_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L18)

### NameClaim

Ƭ **NameClaim**: _t.TypeOf‹typeof NameClaimType›_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L47)

## Variables

### `Const` ClaimType

• **ClaimType**: _UnionC‹\[TypeC‹object›, Type‹object, any, unknown›, TypeC‹object›, TypeC‹object›, TypeC‹object›\]›_ = t.union\(\[ AttestationServiceURLClaimType, AccountClaimType, DomainClaimType, KeybaseClaimType, NameClaimType, \]\)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L32)

### `Const` DOMAIN\_TXT\_HEADER

• **DOMAIN\_TXT\_HEADER**: _"celo-site-verification"_ = "celo-site-verification"

_Defined in_ [_contractkit/src/identity/claims/claim.ts:45_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L45)

### `Const` KeybaseClaimType

• **KeybaseClaimType**: _TypeC‹object›_ = t.type\({ type: t.literal\(ClaimTypes.KEYBASE\), timestamp: TimestampType, // TODO: Validate compliant username before just interpolating username: t.string, }\)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L12)

### `Const` SignedClaimType

• **SignedClaimType**: _TypeC‹object›_ = t.type\({ claim: ClaimType, signature: SignatureType, }\)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L40)

## Functions

### `Const` createDomainClaim

▸ **createDomainClaim**\(`domain`: string\): [_DomainClaim_](_identity_claims_claim_.md#domainclaim)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:104_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L104)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `domain` | string |

**Returns:** [_DomainClaim_](_identity_claims_claim_.md#domainclaim)

### `Const` createNameClaim

▸ **createNameClaim**\(`name`: string\): [_NameClaim_](_identity_claims_claim_.md#nameclaim)

_Defined in_ [_contractkit/src/identity/claims/claim.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L98)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `name` | string |

**Returns:** [_NameClaim_](_identity_claims_claim_.md#nameclaim)

### hashOfClaim

▸ **hashOfClaim**\(`claim`: [Claim](_identity_claims_claim_.md#claim)\): _string_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:85_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L85)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `claim` | [Claim](_identity_claims_claim_.md#claim) |

**Returns:** _string_

### hashOfClaims

▸ **hashOfClaims**\(`claims`: [Claim](_identity_claims_claim_.md#claim)\[\]\): _string_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:89_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L89)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `claims` | [Claim](_identity_claims_claim_.md#claim)\[\] |

**Returns:** _string_

### `Const` isOfType

▸ **isOfType**&lt;**K**&gt;\(`type`: K\): _\(Anonymous function\)_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L65)

**Type parameters:**

▪ **K**: [_ClaimTypes_]()

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | K |

**Returns:** _\(Anonymous function\)_

### serializeClaim

▸ **serializeClaim**\(`claim`: [Claim](_identity_claims_claim_.md#claim)\): _string_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L94)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `claim` | [Claim](_identity_claims_claim_.md#claim) |

**Returns:** _string_

### validateClaim

▸ **validateClaim**\(`kit`: [ContractKit](), `claim`: [Claim](_identity_claims_claim_.md#claim), `address`: string\): _Promise‹undefined \| string›_

_Defined in_ [_contractkit/src/identity/claims/claim.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L75)

Validates a claim made by an account, i.e. whether the claim is usable

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `kit` | [ContractKit]() | The ContractKit object |
| `claim` | [Claim](_identity_claims_claim_.md#claim) | The claim to validate |
| `address` | string | The address that is making the claim |

**Returns:** _Promise‹undefined \| string›_

If valid, returns undefined. If invalid or unable to validate, returns a string with the error

