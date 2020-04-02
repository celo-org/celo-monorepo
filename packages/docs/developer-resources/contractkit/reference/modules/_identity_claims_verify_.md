# External module: "identity/claims/verify"

## Index

### Type aliases

* [MetadataURLGetter](_identity_claims_verify_.md#metadataurlgetter)

### Functions

* [verifyAccountClaim](_identity_claims_verify_.md#const-verifyaccountclaim)
* [verifyClaim](_identity_claims_verify_.md#verifyclaim)
* [verifyDomainClaimFromMetadata](_identity_claims_verify_.md#const-verifydomainclaimfrommetadata)
* [verifyDomainRecord](_identity_claims_verify_.md#const-verifydomainrecord)

## Type aliases

###  MetadataURLGetter

Ƭ **MetadataURLGetter**: *function*

*Defined in [contractkit/src/identity/claims/verify.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L42)*

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

*Defined in [contractkit/src/identity/claims/verify.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L44)*

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

*Defined in [contractkit/src/identity/claims/verify.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L20)*

Verifies a claim made by an account, i.e. whether a claim can be verified to be correct

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`claim` | [Claim](_identity_claims_claim_.md#claim) | The claim to verify |
`address` | string | The address that is making the claim |
`metadataURLGetter` | [MetadataURLGetter](_identity_claims_verify_.md#metadataurlgetter) | A function that can retrieve the metadata URL for a given account address,                          should be Accounts.getMetadataURL() |

**Returns:** *Promise‹undefined | string›*

If valid, returns undefined. If invalid or unable to verify, returns a string with the error

___

### `Const` verifyDomainClaimFromMetadata

▸ **verifyDomainClaimFromMetadata**(`claim`: [DomainClaim](_identity_claims_claim_.md#domainclaim), `address`: string, `metadataURLGetter`: [MetadataURLGetter](_identity_claims_verify_.md#metadataurlgetter), `dnsResolver`: dnsResolverFunction): *Promise‹undefined | string›*

*Defined in [contractkit/src/identity/claims/verify.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L83)*

It verifies if a DNS domain includes in the TXT records an entry with name
`celo-site-verification` and a valid signature in base64

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`claim` | [DomainClaim](_identity_claims_claim_.md#domainclaim) | - |
`address` | string | - |
`metadataURLGetter` | [MetadataURLGetter](_identity_claims_verify_.md#metadataurlgetter) | - |
`dnsResolver` | dnsResolverFunction | resolveTxt |

**Returns:** *Promise‹undefined | string›*

___

### `Const` verifyDomainRecord

▸ **verifyDomainRecord**(`address`: string, `claim`: [DomainClaim](_identity_claims_claim_.md#domainclaim), `dnsResolver`: dnsResolverFunction): *Promise‹undefined | "Unable to verify domain claim"›*

*Defined in [contractkit/src/identity/claims/verify.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/verify.ts#L116)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`address` | string | - |
`claim` | [DomainClaim](_identity_claims_claim_.md#domainclaim) | - |
`dnsResolver` | dnsResolverFunction | resolveTxt |

**Returns:** *Promise‹undefined | "Unable to verify domain claim"›*
