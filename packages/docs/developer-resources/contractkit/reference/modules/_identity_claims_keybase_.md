# External module: "identity/claims/keybase"

## Index

### Variables

* [keybaseFilePathToProof](_identity_claims_keybase_.md#const-keybasefilepathtoproof)

### Functions

* [createKeybaseClaim](_identity_claims_keybase_.md#const-createkeybaseclaim)
* [proofFileName](_identity_claims_keybase_.md#const-prooffilename)
* [targetURL](_identity_claims_keybase_.md#const-targeturl)
* [verifyKeybaseClaim](_identity_claims_keybase_.md#verifykeybaseclaim)

## Variables

### `Const` keybaseFilePathToProof

• **keybaseFilePathToProof**: *".well-known/celo/"* = `.well-known/celo/`

*Defined in [contractkit/src/identity/claims/keybase.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L8)*

## Functions

### `Const` createKeybaseClaim

▸ **createKeybaseClaim**(`username`: string): *[KeybaseClaim](_identity_claims_claim_.md#keybaseclaim)*

*Defined in [contractkit/src/identity/claims/keybase.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`username` | string |

**Returns:** *[KeybaseClaim](_identity_claims_claim_.md#keybaseclaim)*

___

### `Const` proofFileName

▸ **proofFileName**(`address`: [Address](_base_.md#address)): *string*

*Defined in [contractkit/src/identity/claims/keybase.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](_base_.md#address) |

**Returns:** *string*

___

### `Const` targetURL

▸ **targetURL**(`username`: string, `address`: [Address](_base_.md#address)): *string*

*Defined in [contractkit/src/identity/claims/keybase.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`username` | string |
`address` | [Address](_base_.md#address) |

**Returns:** *string*

___

###  verifyKeybaseClaim

▸ **verifyKeybaseClaim**(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `claim`: [KeybaseClaim](_identity_claims_claim_.md#keybaseclaim), `signer`: [Address](_base_.md#address)): *Promise‹string | undefined›*

*Defined in [contractkit/src/identity/claims/keybase.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/keybase.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |
`claim` | [KeybaseClaim](_identity_claims_claim_.md#keybaseclaim) |
`signer` | [Address](_base_.md#address) |

**Returns:** *Promise‹string | undefined›*
