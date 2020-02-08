# External module: "identity/claims/verify"

## Index

### Type aliases

* [MetadataURLGetter](_identity_claims_verify_.md#metadataurlgetter)

### Functions

* [verifyAccountClaim](_identity_claims_verify_.md#const-verifyaccountclaim)
* [verifyClaim](_identity_claims_verify_.md#verifyclaim)

## Type aliases

###  MetadataURLGetter

Ƭ **MetadataURLGetter**: *function*

*Defined in [packages/contractkit/src/identity/claims/verify.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L37)*

A function that can asynchronously fetch the metadata URL for an account address
Should virtually always be Accounts#getMetadataURL

#### Type declaration:

▸ (`address`: [Address](_base_.md#address)): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](_base_.md#address) |

## Functions

### `Const` verifyAccountClaim

▸ **verifyAccountClaim**(`claim`: [AccountClaim](_identity_claims_account_.md#accountclaim), `address`: string, `metadataURLGetter`: [MetadataURLGetter](_identity_claims_verify_.md#metadataurlgetter)): *Promise‹undefined | string›*

*Defined in [packages/contractkit/src/identity/claims/verify.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [AccountClaim](_identity_claims_account_.md#accountclaim) |
`address` | string |
`metadataURLGetter` | [MetadataURLGetter](_identity_claims_verify_.md#metadataurlgetter) |

**Returns:** *Promise‹undefined | string›*

___

###  verifyClaim

▸ **verifyClaim**(`claim`: [Claim](_identity_claims_claim_.md#claim), `address`: string, `metadataURLGetter`: [MetadataURLGetter](_identity_claims_verify_.md#metadataurlgetter)): *Promise‹undefined | string›*

*Defined in [packages/contractkit/src/identity/claims/verify.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L17)*

Verifies a claim made by an account, i.e. whether a claim can be verified to be correct

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`claim` | [Claim](_identity_claims_claim_.md#claim) | The claim to verify |
`address` | string | The address that is making the claim |
`metadataURLGetter` | [MetadataURLGetter](_identity_claims_verify_.md#metadataurlgetter) | A function that can retrieve the metadata URL for a given account address,                          should be Accounts.getMetadataURL() |

**Returns:** *Promise‹undefined | string›*

If valid, returns undefined. If invalid or unable to verify, returns a string with the error
