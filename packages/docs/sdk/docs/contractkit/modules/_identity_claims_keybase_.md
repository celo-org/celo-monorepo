[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["identity/claims/keybase"](_identity_claims_keybase_.md)

# Module: "identity/claims/keybase"

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

*Defined in [packages/sdk/contractkit/src/identity/claims/keybase.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/keybase.ts#L9)*

## Functions

### `Const` createKeybaseClaim

▸ **createKeybaseClaim**(`username`: string): *[KeybaseClaim](_identity_claims_claim_.md#keybaseclaim)*

*Defined in [packages/sdk/contractkit/src/identity/claims/keybase.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/keybase.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`username` | string |

**Returns:** *[KeybaseClaim](_identity_claims_claim_.md#keybaseclaim)*

___

### `Const` proofFileName

▸ **proofFileName**(`address`: Address): *string*

*Defined in [packages/sdk/contractkit/src/identity/claims/keybase.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/keybase.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *string*

___

### `Const` targetURL

▸ **targetURL**(`username`: string, `address`: Address): *string*

*Defined in [packages/sdk/contractkit/src/identity/claims/keybase.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/keybase.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`username` | string |
`address` | Address |

**Returns:** *string*

___

###  verifyKeybaseClaim

▸ **verifyKeybaseClaim**(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `claim`: [KeybaseClaim](_identity_claims_claim_.md#keybaseclaim), `signer`: Address): *Promise‹string | undefined›*

*Defined in [packages/sdk/contractkit/src/identity/claims/keybase.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/keybase.ts#L26)*

**`remarks`** 
If verification encounters an error, returns the error message as a string
otherwise returns undefined when successful

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |
`claim` | [KeybaseClaim](_identity_claims_claim_.md#keybaseclaim) |
`signer` | Address |

**Returns:** *Promise‹string | undefined›*

a human readable string with claims (non)verifiability or undefined
