# External module: "contractkit/src/identity/claims/verify"

## Index

### Functions

* [verifyAccountClaim](_contractkit_src_identity_claims_verify_.md#const-verifyaccountclaim)
* [verifyClaim](_contractkit_src_identity_claims_verify_.md#verifyclaim)
* [verifyDomainRecord](_contractkit_src_identity_claims_verify_.md#const-verifydomainrecord)

## Functions

### `Const` verifyAccountClaim

▸ **verifyAccountClaim**(`kit`: [ContractKit](../classes/_contractkit_src_kit_.contractkit.md), `claim`: [AccountClaim](_contractkit_src_identity_claims_account_.md#accountclaim), `address`: string): *Promise‹undefined | string›*

*Defined in [packages/contractkit/src/identity/claims/verify.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L33)*

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

*Defined in [packages/contractkit/src/identity/claims/verify.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L19)*

Verifies a claim made by an account, i.e. whether a claim can be verified to be correct

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`kit` | [ContractKit](../classes/_contractkit_src_kit_.contractkit.md) | ContractKit object |
`claim` | [Claim](_contractkit_src_identity_claims_claim_.md#claim) | The claim to verify |
`address` | string | The address that is making the claim |

**Returns:** *Promise‹undefined | string›*

If valid, returns undefined. If invalid or unable to verify, returns a string with the error

___

### `Const` verifyDomainRecord

▸ **verifyDomainRecord**(`kit`: [ContractKit](../classes/_contractkit_src_kit_.contractkit.md), `claim`: [DomainClaim](_contractkit_src_identity_claims_claim_.md#domainclaim), `address`: string, `dnsResolver`: dnsResolverFunction): *Promise‹undefined | string›*

*Defined in [packages/contractkit/src/identity/claims/verify.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L71)*

It verifies if a DNS domain includes in the TXT records an entry with name
`celo-site-verification` and a valid signature in base64

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`kit` | [ContractKit](../classes/_contractkit_src_kit_.contractkit.md) | - |
`claim` | [DomainClaim](_contractkit_src_identity_claims_claim_.md#domainclaim) | - |
`address` | string | - |
`dnsResolver` | dnsResolverFunction | resolveTxt as any |

**Returns:** *Promise‹undefined | string›*
