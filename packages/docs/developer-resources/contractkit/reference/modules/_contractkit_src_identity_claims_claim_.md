# External module: "contractkit/src/identity/claims/claim"

## Index

### Type aliases

* [Claim](_contractkit_src_identity_claims_claim_.md#claim)
* [ClaimPayload](_contractkit_src_identity_claims_claim_.md#claimpayload)
* [DomainClaim](_contractkit_src_identity_claims_claim_.md#domainclaim)
* [KeybaseClaim](_contractkit_src_identity_claims_claim_.md#keybaseclaim)
* [NameClaim](_contractkit_src_identity_claims_claim_.md#nameclaim)
* [StorageClaim](_contractkit_src_identity_claims_claim_.md#storageclaim)

### Variables

* [ClaimType](_contractkit_src_identity_claims_claim_.md#const-claimtype)
* [DOMAIN_TXT_HEADER](_contractkit_src_identity_claims_claim_.md#const-domain_txt_header)
* [KeybaseClaimType](_contractkit_src_identity_claims_claim_.md#const-keybaseclaimtype)
* [SignedClaimType](_contractkit_src_identity_claims_claim_.md#const-signedclaimtype)

### Functions

* [createDomainClaim](_contractkit_src_identity_claims_claim_.md#const-createdomainclaim)
* [createNameClaim](_contractkit_src_identity_claims_claim_.md#const-createnameclaim)
* [createStorageClaim](_contractkit_src_identity_claims_claim_.md#const-createstorageclaim)
* [hashOfClaim](_contractkit_src_identity_claims_claim_.md#hashofclaim)
* [hashOfClaims](_contractkit_src_identity_claims_claim_.md#hashofclaims)
* [isOfType](_contractkit_src_identity_claims_claim_.md#const-isoftype)
* [serializeClaim](_contractkit_src_identity_claims_claim_.md#serializeclaim)
* [validateClaim](_contractkit_src_identity_claims_claim_.md#validateclaim)

## Type aliases

###  Claim

Ƭ **Claim**: *[AttestationServiceURLClaim](_contractkit_src_identity_claims_attestation_service_url_.md#attestationserviceurlclaim) | [DomainClaim](_contractkit_src_identity_claims_claim_.md#domainclaim) | [KeybaseClaim](_contractkit_src_identity_claims_claim_.md#keybaseclaim) | [NameClaim](_contractkit_src_identity_claims_claim_.md#nameclaim) | [AccountClaim](_contractkit_src_identity_claims_account_.md#accountclaim) | [StorageClaim](_contractkit_src_identity_claims_claim_.md#storageclaim)*

*Defined in [contractkit/src/identity/claims/claim.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L57)*

___

###  ClaimPayload

Ƭ **ClaimPayload**: *K extends typeof DOMAIN ? DomainClaim : K extends typeof NAME ? NameClaim : K extends typeof KEYBASE ? KeybaseClaim : K extends typeof ATTESTATION_SERVICE_URL ? AttestationServiceURLClaim : K extends typeof ACCOUNT ? AccountClaim : StorageClaim*

*Defined in [contractkit/src/identity/claims/claim.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L65)*

___

###  DomainClaim

Ƭ **DomainClaim**: *t.TypeOf‹typeof DomainClaimType›*

*Defined in [contractkit/src/identity/claims/claim.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L54)*

___

###  KeybaseClaim

Ƭ **KeybaseClaim**: *t.TypeOf‹typeof KeybaseClaimType›*

*Defined in [contractkit/src/identity/claims/claim.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L18)*

___

###  NameClaim

Ƭ **NameClaim**: *t.TypeOf‹typeof NameClaimType›*

*Defined in [contractkit/src/identity/claims/claim.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L55)*

___

###  StorageClaim

Ƭ **StorageClaim**: *t.TypeOf‹typeof StorageClaimType›*

*Defined in [contractkit/src/identity/claims/claim.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L56)*

## Variables

### `Const` ClaimType

• **ClaimType**: *UnionC‹[TypeC‹object›, Type‹object, any, unknown›, TypeC‹object›, TypeC‹object›, TypeC‹object›, TypeC‹object›]›* = t.union([
  AttestationServiceURLClaimType,
  AccountClaimType,
  DomainClaimType,
  KeybaseClaimType,
  NameClaimType,
  StorageClaimType,
])

*Defined in [contractkit/src/identity/claims/claim.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L39)*

___

### `Const` DOMAIN_TXT_HEADER

• **DOMAIN_TXT_HEADER**: *"celo-site-verification"* = "celo-site-verification"

*Defined in [contractkit/src/identity/claims/claim.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L53)*

___

### `Const` KeybaseClaimType

• **KeybaseClaimType**: *TypeC‹object›* = t.type({
  type: t.literal(ClaimTypes.KEYBASE),
  timestamp: TimestampType,
  // TODO: Validate compliant username before just interpolating
  username: t.string,
})

*Defined in [contractkit/src/identity/claims/claim.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L12)*

___

### `Const` SignedClaimType

• **SignedClaimType**: *TypeC‹object›* = t.type({
  claim: ClaimType,
  signature: SignatureType,
})

*Defined in [contractkit/src/identity/claims/claim.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L48)*

## Functions

### `Const` createDomainClaim

▸ **createDomainClaim**(`domain`: string): *[DomainClaim](_contractkit_src_identity_claims_claim_.md#domainclaim)*

*Defined in [contractkit/src/identity/claims/claim.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L116)*

**Parameters:**

Name | Type |
------ | ------ |
`domain` | string |

**Returns:** *[DomainClaim](_contractkit_src_identity_claims_claim_.md#domainclaim)*

___

### `Const` createNameClaim

▸ **createNameClaim**(`name`: string): *[NameClaim](_contractkit_src_identity_claims_claim_.md#nameclaim)*

*Defined in [contractkit/src/identity/claims/claim.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L110)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *[NameClaim](_contractkit_src_identity_claims_claim_.md#nameclaim)*

___

### `Const` createStorageClaim

▸ **createStorageClaim**(`storageURL`: string): *[StorageClaim](_contractkit_src_identity_claims_claim_.md#storageclaim)*

*Defined in [contractkit/src/identity/claims/claim.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L122)*

**Parameters:**

Name | Type |
------ | ------ |
`storageURL` | string |

**Returns:** *[StorageClaim](_contractkit_src_identity_claims_claim_.md#storageclaim)*

___

###  hashOfClaim

▸ **hashOfClaim**(`claim`: [Claim](_contractkit_src_identity_claims_claim_.md#claim)): *string*

*Defined in [contractkit/src/identity/claims/claim.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](_contractkit_src_identity_claims_claim_.md#claim) |

**Returns:** *string*

___

###  hashOfClaims

▸ **hashOfClaims**(`claims`: [Claim](_contractkit_src_identity_claims_claim_.md#claim)[]): *string*

*Defined in [contractkit/src/identity/claims/claim.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`claims` | [Claim](_contractkit_src_identity_claims_claim_.md#claim)[] |

**Returns:** *string*

___

### `Const` isOfType

▸ **isOfType**<**K**>(`type`: K): *(Anonymous function)*

*Defined in [contractkit/src/identity/claims/claim.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L77)*

**Type parameters:**

▪ **K**: *[ClaimTypes](../enums/_contractkit_src_identity_claims_types_.claimtypes.md)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | K |

**Returns:** *(Anonymous function)*

___

###  serializeClaim

▸ **serializeClaim**(`claim`: [Claim](_contractkit_src_identity_claims_claim_.md#claim)): *string*

*Defined in [contractkit/src/identity/claims/claim.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L106)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](_contractkit_src_identity_claims_claim_.md#claim) |

**Returns:** *string*

___

###  validateClaim

▸ **validateClaim**(`kit`: [ContractKit](../classes/_contractkit_src_kit_.contractkit.md), `claim`: [Claim](_contractkit_src_identity_claims_claim_.md#claim), `address`: string): *Promise‹undefined | string›*

*Defined in [contractkit/src/identity/claims/claim.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L87)*

Validates a claim made by an account, i.e. whether the claim is usable

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`kit` | [ContractKit](../classes/_contractkit_src_kit_.contractkit.md) | The ContractKit object |
`claim` | [Claim](_contractkit_src_identity_claims_claim_.md#claim) | The claim to validate |
`address` | string | The address that is making the claim |

**Returns:** *Promise‹undefined | string›*

If valid, returns undefined. If invalid or unable to validate, returns a string with the error
