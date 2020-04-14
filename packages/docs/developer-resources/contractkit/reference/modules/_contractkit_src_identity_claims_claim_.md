# External module: "contractkit/src/identity/claims/claim"

## Index

### Type aliases

* [Claim](_contractkit_src_identity_claims_claim_.md#claim)
* [ClaimPayload](_contractkit_src_identity_claims_claim_.md#claimpayload)
* [DomainClaim](_contractkit_src_identity_claims_claim_.md#domainclaim)
* [NameClaim](_contractkit_src_identity_claims_claim_.md#nameclaim)

### Variables

* [ClaimType](_contractkit_src_identity_claims_claim_.md#const-claimtype)
* [SignedClaimType](_contractkit_src_identity_claims_claim_.md#const-signedclaimtype)

### Functions

* [createDomainClaim](_contractkit_src_identity_claims_claim_.md#const-createdomainclaim)
* [createNameClaim](_contractkit_src_identity_claims_claim_.md#const-createnameclaim)
* [hashOfClaim](_contractkit_src_identity_claims_claim_.md#hashofclaim)
* [hashOfClaims](_contractkit_src_identity_claims_claim_.md#hashofclaims)
* [isOfType](_contractkit_src_identity_claims_claim_.md#const-isoftype)
* [serializeClaim](_contractkit_src_identity_claims_claim_.md#serializeclaim)
* [validateClaim](_contractkit_src_identity_claims_claim_.md#validateclaim)

## Type aliases

###  Claim

Ƭ **Claim**: *[AttestationServiceURLClaim](_contractkit_src_identity_claims_attestation_service_url_.md#attestationserviceurlclaim) | [DomainClaim](_contractkit_src_identity_claims_claim_.md#domainclaim) | [KeybaseClaim](_contractkit_src_identity_claims_keybase_.md#keybaseclaim) | [NameClaim](_contractkit_src_identity_claims_claim_.md#nameclaim) | [AccountClaim](_contractkit_src_identity_claims_account_.md#accountclaim)*

*Defined in [contractkit/src/identity/claims/claim.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L40)*

___

###  ClaimPayload

Ƭ **ClaimPayload**: *K extends typeof DOMAIN ? DomainClaim : K extends typeof NAME ? NameClaim : K extends typeof KEYBASE ? KeybaseClaim : K extends typeof ATTESTATION_SERVICE_URL ? AttestationServiceURLClaim : AccountClaim*

*Defined in [contractkit/src/identity/claims/claim.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L47)*

___

###  DomainClaim

Ƭ **DomainClaim**: *t.TypeOf‹typeof DomainClaimType›*

*Defined in [contractkit/src/identity/claims/claim.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L38)*

___

###  NameClaim

Ƭ **NameClaim**: *t.TypeOf‹typeof NameClaimType›*

*Defined in [contractkit/src/identity/claims/claim.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L39)*

## Variables

### `Const` ClaimType

• **ClaimType**: *UnionC‹[TypeC‹object›, Type‹object, any, unknown›, TypeC‹object›, TypeC‹object›, TypeC‹object›]›* = t.union([
  AttestationServiceURLClaimType,
  AccountClaimType,
  DomainClaimType,
  KeybaseClaimType,
  NameClaimType,
])

*Defined in [contractkit/src/identity/claims/claim.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L25)*

___

### `Const` SignedClaimType

• **SignedClaimType**: *TypeC‹object›* = t.type({
  claim: ClaimType,
  signature: SignatureType,
})

*Defined in [contractkit/src/identity/claims/claim.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L33)*

## Functions

### `Const` createDomainClaim

▸ **createDomainClaim**(`domain`: string): *[DomainClaim](_contractkit_src_identity_claims_claim_.md#domainclaim)*

*Defined in [contractkit/src/identity/claims/claim.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`domain` | string |

**Returns:** *[DomainClaim](_contractkit_src_identity_claims_claim_.md#domainclaim)*

___

### `Const` createNameClaim

▸ **createNameClaim**(`name`: string): *[NameClaim](_contractkit_src_identity_claims_claim_.md#nameclaim)*

*Defined in [contractkit/src/identity/claims/claim.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L90)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *[NameClaim](_contractkit_src_identity_claims_claim_.md#nameclaim)*

___

###  hashOfClaim

▸ **hashOfClaim**(`claim`: [Claim](_contractkit_src_identity_claims_claim_.md#claim)): *string*

*Defined in [contractkit/src/identity/claims/claim.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](_contractkit_src_identity_claims_claim_.md#claim) |

**Returns:** *string*

___

###  hashOfClaims

▸ **hashOfClaims**(`claims`: [Claim](_contractkit_src_identity_claims_claim_.md#claim)[]): *string*

*Defined in [contractkit/src/identity/claims/claim.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`claims` | [Claim](_contractkit_src_identity_claims_claim_.md#claim)[] |

**Returns:** *string*

___

### `Const` isOfType

▸ **isOfType**<**K**>(`type`: K): *(Anonymous function)*

*Defined in [contractkit/src/identity/claims/claim.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L57)*

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

*Defined in [contractkit/src/identity/claims/claim.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L86)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](_contractkit_src_identity_claims_claim_.md#claim) |

**Returns:** *string*

___

###  validateClaim

▸ **validateClaim**(`kit`: [ContractKit](../classes/_contractkit_src_kit_.contractkit.md), `claim`: [Claim](_contractkit_src_identity_claims_claim_.md#claim), `address`: string): *Promise‹undefined | string›*

*Defined in [contractkit/src/identity/claims/claim.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L67)*

Validates a claim made by an account, i.e. whether the claim is usable

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`kit` | [ContractKit](../classes/_contractkit_src_kit_.contractkit.md) | The ContractKit object |
`claim` | [Claim](_contractkit_src_identity_claims_claim_.md#claim) | The claim to validate |
`address` | string | The address that is making the claim |

**Returns:** *Promise‹undefined | string›*

If valid, returns undefined. If invalid or unable to validate, returns a string with the error
