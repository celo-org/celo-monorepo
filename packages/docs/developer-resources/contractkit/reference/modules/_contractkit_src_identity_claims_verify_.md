# External module: "contractkit/src/identity/claims/verify"

## Index

### Functions

* [verifyAccountClaim](_contractkit_src_identity_claims_verify_.md#const-verifyaccountclaim)
* [verifyClaim](_contractkit_src_identity_claims_verify_.md#verifyclaim)

## Functions

### `Const` verifyAccountClaim

▸ **verifyAccountClaim**(`kit`: [ContractKit](../classes/_contractkit_src_kit_.contractkit.md), `claim`: [AccountClaim](_contractkit_src_identity_claims_account_.md#accountclaim), `address`: string): *Promise‹undefined | string›*

*Defined in [contractkit/src/identity/claims/verify.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_contractkit_src_kit_.contractkit.md) |
`claim` | [AccountClaim](_contractkit_src_identity_claims_account_.md#accountclaim) |
`address` | string |

**Returns:** *Promise‹undefined | string›*

___

###  verifyClaim

▸ **verifyClaim**(`kit`: [ContractKit](../classes/_contractkit_src_kit_.contractkit.md), `claim`: [Claim](_contractkit_src_identity_claims_claim_.md#claim), `address`: string): *Promise‹undefined | string›*

*Defined in [contractkit/src/identity/claims/verify.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L17)*

Verifies a claim made by an account, i.e. whether a claim can be verified to be correct

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`kit` | [ContractKit](../classes/_contractkit_src_kit_.contractkit.md) | ContractKit object |
`claim` | [Claim](_contractkit_src_identity_claims_claim_.md#claim) | The claim to verify |
`address` | string | The address that is making the claim |

**Returns:** *Promise‹undefined | string›*

If valid, returns undefined. If invalid or unable to verify, returns a string with the error
