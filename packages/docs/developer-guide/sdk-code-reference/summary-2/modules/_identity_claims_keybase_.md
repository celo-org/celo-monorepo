# identity/claims/keybase

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

• **keybaseFilePathToProof**: _".well-known/celo/"_ = `.well-known/celo/`

_Defined in_ [_contractkit/src/identity/claims/keybase.ts:9_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/keybase.ts#L9)

## Functions

### `Const` createKeybaseClaim

▸ **createKeybaseClaim**\(`username`: string\): [_KeybaseClaim_](_identity_claims_claim_.md#keybaseclaim)

_Defined in_ [_contractkit/src/identity/claims/keybase.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/keybase.ts#L62)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `username` | string |

**Returns:** [_KeybaseClaim_](_identity_claims_claim_.md#keybaseclaim)

### `Const` proofFileName

▸ **proofFileName**\(`address`: Address\): _string_

_Defined in_ [_contractkit/src/identity/claims/keybase.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/keybase.ts#L10)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |

**Returns:** _string_

### `Const` targetURL

▸ **targetURL**\(`username`: string, `address`: Address\): _string_

_Defined in_ [_contractkit/src/identity/claims/keybase.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/keybase.ts#L11)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `username` | string |
| `address` | Address |

**Returns:** _string_

### verifyKeybaseClaim

▸ **verifyKeybaseClaim**\(`kit`: [ContractKit](), `claim`: [KeybaseClaim](_identity_claims_claim_.md#keybaseclaim), `signer`: Address\): _Promise‹string \| undefined›_

_Defined in_ [_contractkit/src/identity/claims/keybase.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/keybase.ts#L16)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `claim` | [KeybaseClaim](_identity_claims_claim_.md#keybaseclaim) |
| `signer` | Address |

**Returns:** _Promise‹string \| undefined›_

