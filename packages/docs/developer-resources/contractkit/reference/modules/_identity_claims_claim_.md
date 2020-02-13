# External module: "identity/claims/claim"

## Index

### Type aliases

* [Claim](_identity_claims_claim_.md#claim)
* [ClaimPayload](_identity_claims_claim_.md#claimpayload)
* [DomainClaim](_identity_claims_claim_.md#domainclaim)
* [NameClaim](_identity_claims_claim_.md#nameclaim)

### Variables

* [ClaimType](_identity_claims_claim_.md#const-claimtype)
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

###  Claim

Ƭ **Claim**: *[AttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim) | [DomainClaim](_identity_claims_claim_.md#domainclaim) | [KeybaseClaim](_identity_claims_keybase_.md#keybaseclaim) | [NameClaim](_identity_claims_claim_.md#nameclaim) | [AccountClaim](_identity_claims_account_.md#accountclaim)*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L40)*

___

###  ClaimPayload

Ƭ **ClaimPayload**: *K extends typeof DOMAIN ? DomainClaim : K extends typeof NAME ? NameClaim : K extends typeof KEYBASE ? KeybaseClaim : K extends typeof ATTESTATION_SERVICE_URL ? AttestationServiceURLClaim : AccountClaim*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L47)*

___

###  DomainClaim

Ƭ **DomainClaim**: *t.TypeOf‹typeof DomainClaimType›*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L38)*

___

###  NameClaim

Ƭ **NameClaim**: *t.TypeOf‹typeof NameClaimType›*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L39)*

## Variables

### `Const` ClaimType

• **ClaimType**: *UnionC‹[TypeC‹object›, Type‹object, any, unknown›, TypeC‹object›, TypeC‹object›, TypeC‹object›]›* = t.union([
  AttestationServiceURLClaimType,
  AccountClaimType,
  DomainClaimType,
  KeybaseClaimType,
  NameClaimType,
])

*Defined in [packages/contractkit/src/identity/claims/claim.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L25)*

___

### `Const` SignedClaimType

• **SignedClaimType**: *TypeC‹object›* = t.type({
  claim: ClaimType,
  signature: SignatureType,
})

*Defined in [packages/contractkit/src/identity/claims/claim.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L33)*

## Functions

### `Const` createDomainClaim

▸ **createDomainClaim**(`domain`: string): *[DomainClaim](_identity_claims_claim_.md#domainclaim)*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L95)*

**Parameters:**

Name | Type |
------ | ------ |
`domain` | string |

**Returns:** *[DomainClaim](_identity_claims_claim_.md#domainclaim)*

___

### `Const` createNameClaim

▸ **createNameClaim**(`name`: string): *[NameClaim](_identity_claims_claim_.md#nameclaim)*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *[NameClaim](_identity_claims_claim_.md#nameclaim)*

___

###  hashOfClaim

▸ **hashOfClaim**(`claim`: [Claim](_identity_claims_claim_.md#claim)): *string*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L76)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](_identity_claims_claim_.md#claim) |

**Returns:** *string*

___

###  hashOfClaims

▸ **hashOfClaims**(`claims`: [Claim](_identity_claims_claim_.md#claim)[]): *string*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`claims` | [Claim](_identity_claims_claim_.md#claim)[] |

**Returns:** *string*

___

### `Const` isOfType

▸ **isOfType**<**K**>(`type`: K): *(Anonymous function)*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L57)*

**Type parameters:**

▪ **K**: *[ClaimTypes](../enums/_identity_claims_types_.claimtypes.md)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | K |

**Returns:** *(Anonymous function)*

___

###  serializeClaim

▸ **serializeClaim**(`claim`: [Claim](_identity_claims_claim_.md#claim)): *string*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](_identity_claims_claim_.md#claim) |

**Returns:** *string*

___

###  validateClaim

▸ **validateClaim**(`claim`: [Claim](_identity_claims_claim_.md#claim), `address`: string, `kit`: [ContractKit](../classes/_kit_.contractkit.md)): *Promise‹undefined | string›*

*Defined in [packages/contractkit/src/identity/claims/claim.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/claim.ts#L66)*

Validates a claim made by an account, i.e. whether the claim is usable

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`claim` | [Claim](_identity_claims_claim_.md#claim) | The claim to validate |
`address` | string | The address that is making the claim |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) | - |

**Returns:** *Promise‹undefined | string›*

If valid, returns undefined. If invalid or unable to validate, returns a string with the error
