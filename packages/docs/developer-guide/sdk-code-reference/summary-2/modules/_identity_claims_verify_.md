# identity/claims/verify

## Index

### Functions

* [verifyAccountClaim](_identity_claims_verify_.md#const-verifyaccountclaim)
* [verifyClaim](_identity_claims_verify_.md#verifyclaim)
* [verifyDomainRecord](_identity_claims_verify_.md#const-verifydomainrecord)

## Functions

### `Const` verifyAccountClaim

▸ **verifyAccountClaim**\(`kit`: [ContractKit](), `claim`: [AccountClaim](_identity_claims_account_.md#accountclaim), `address`: string, `tries`: number\): _Promise‹undefined \| string›_

_Defined in_ [_contractkit/src/identity/claims/verify.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/verify.ts#L33)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `kit` | [ContractKit]() | - |
| `claim` | [AccountClaim](_identity_claims_account_.md#accountclaim) | - |
| `address` | string | - |
| `tries` | number | 3 |

**Returns:** _Promise‹undefined \| string›_

### verifyClaim

▸ **verifyClaim**\(`kit`: [ContractKit](), `claim`: [Claim](_identity_claims_claim_.md#claim), `address`: string, `tries`: number\): _Promise‹undefined \| string›_

_Defined in_ [_contractkit/src/identity/claims/verify.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/verify.ts#L19)

Verifies a claim made by an account, i.e. whether a claim can be verified to be correct

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `kit` | [ContractKit]() | - | ContractKit object |
| `claim` | [Claim](_identity_claims_claim_.md#claim) | - | The claim to verify |
| `address` | string | - | The address that is making the claim |
| `tries` | number | 3 | - |

**Returns:** _Promise‹undefined \| string›_

If valid, returns undefined. If invalid or unable to verify, returns a string with the error

### `Const` verifyDomainRecord

▸ **verifyDomainRecord**\(`kit`: [ContractKit](), `claim`: [DomainClaim](_identity_claims_claim_.md#domainclaim), `address`: string, `dnsResolver`: dnsResolverFunction\): _Promise‹undefined \| string›_

_Defined in_ [_contractkit/src/identity/claims/verify.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/verify.ts#L72)

It verifies if a DNS domain includes in the TXT records an entry with name `celo-site-verification` and a valid signature in base64

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `kit` | [ContractKit]() | - |
| `claim` | [DomainClaim](_identity_claims_claim_.md#domainclaim) | - |
| `address` | string | - |
| `dnsResolver` | dnsResolverFunction | resolveTxt as any |

**Returns:** _Promise‹undefined \| string›_

