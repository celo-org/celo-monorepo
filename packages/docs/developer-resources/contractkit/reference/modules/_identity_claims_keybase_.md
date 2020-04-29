# External module: "identity/claims/keybase"

## Index

### Type aliases

* [KeybaseClaim](_identity_claims_keybase_.md#keybaseclaim)

### Variables

* [KeybaseClaimType](_identity_claims_keybase_.md#const-keybaseclaimtype)
* [keybaseFilePathToProof](_identity_claims_keybase_.md#const-keybasefilepathtoproof)

### Functions

* [createKeybaseClaim](_identity_claims_keybase_.md#const-createkeybaseclaim)
* [proofFileName](_identity_claims_keybase_.md#const-prooffilename)
* [targetURL](_identity_claims_keybase_.md#const-targeturl)
* [verifyKeybaseClaim](_identity_claims_keybase_.md#verifykeybaseclaim)

## Type aliases

###  KeybaseClaim

Ƭ **KeybaseClaim**: *t.TypeOf‹typeof KeybaseClaimType›*

*Defined in [contractkit/src/identity/claims/keybase.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L15)*

## Variables

### `Const` KeybaseClaimType

• **KeybaseClaimType**: *TypeC‹object›* = t.type({
  type: t.literal(ClaimTypes.KEYBASE),
  timestamp: TimestampType,
  // TODO: Validate compliant username before just interpolating
  username: t.string,
})

*Defined in [contractkit/src/identity/claims/keybase.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L9)*

___

### `Const` keybaseFilePathToProof

• **keybaseFilePathToProof**: *".well-known/celo/"* = `.well-known/celo/`

*Defined in [contractkit/src/identity/claims/keybase.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L17)*

## Functions

### `Const` createKeybaseClaim

▸ **createKeybaseClaim**(`username`: string): *[KeybaseClaim](_identity_claims_keybase_.md#keybaseclaim)*

*Defined in [contractkit/src/identity/claims/keybase.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`username` | string |

**Returns:** *[KeybaseClaim](_identity_claims_keybase_.md#keybaseclaim)*

___

### `Const` proofFileName

▸ **proofFileName**(`address`: [Address](_base_.md#address)): *string*

*Defined in [contractkit/src/identity/claims/keybase.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](_base_.md#address) |

**Returns:** *string*

___

### `Const` targetURL

▸ **targetURL**(`username`: string, `address`: [Address](_base_.md#address)): *string*

*Defined in [contractkit/src/identity/claims/keybase.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`username` | string |
`address` | [Address](_base_.md#address) |

**Returns:** *string*

___

###  verifyKeybaseClaim

▸ **verifyKeybaseClaim**(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `claim`: [KeybaseClaim](_identity_claims_keybase_.md#keybaseclaim), `signer`: [Address](_base_.md#address)): *Promise‹string | undefined›*

*Defined in [contractkit/src/identity/claims/keybase.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |
`claim` | [KeybaseClaim](_identity_claims_keybase_.md#keybaseclaim) |
`signer` | [Address](_base_.md#address) |

**Returns:** *Promise‹string | undefined›*
