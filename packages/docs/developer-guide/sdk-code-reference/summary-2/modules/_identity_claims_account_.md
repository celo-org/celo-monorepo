# identity/claims/account

## Index

### Type aliases

* [AccountClaim](_identity_claims_account_.md#accountclaim)

### Variables

* [AccountClaimType](_identity_claims_account_.md#const-accountclaimtype)
* [AccountClaimTypeH](_identity_claims_account_.md#const-accountclaimtypeh)

### Functions

* [createAccountClaim](_identity_claims_account_.md#const-createaccountclaim)

## Type aliases

### AccountClaim

Ƭ **AccountClaim**: _t.TypeOf‹typeof AccountClaimTypeH›_

_Defined in_ [_contractkit/src/identity/claims/account.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/account.ts#L32)

## Variables

### `Const` AccountClaimType

• **AccountClaimType**: _Type‹object, any, unknown›_ = new t.Type\( 'AccountClaimType', AccountClaimTypeH.is, \(unknownValue, context\) =&gt; either.chain\(AccountClaimTypeH.validate\(unknownValue, context\), \(claim\) =&gt; { if \(claim.publicKey === undefined\) { return t.success\(claim\) } const derivedAddress = publicKeyToAddress\(claim.publicKey\) return derivedAddress === claim.address ? t.success\(claim\) : t.failure\(claim, context, 'public key did not match the address in the claim'\) }\), \(x\) =&gt; x \)

_Defined in_ [_contractkit/src/identity/claims/account.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/account.ts#L16)

### `Const` AccountClaimTypeH

• **AccountClaimTypeH**: _TypeC‹object›_ = t.type\({ type: t.literal\(ClaimTypes.ACCOUNT\), timestamp: TimestampType, address: AddressType, // io-ts way of defining optional key-value pair publicKey: t.union\(\[t.undefined, PublicKeyType\]\), }\)

_Defined in_ [_contractkit/src/identity/claims/account.ts:8_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/account.ts#L8)

## Functions

### `Const` createAccountClaim

▸ **createAccountClaim**\(`address`: string, `publicKey?`: undefined \| string\): [_AccountClaim_](_identity_claims_account_.md#accountclaim)

_Defined in_ [_contractkit/src/identity/claims/account.ts:34_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/account.ts#L34)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `publicKey?` | undefined \| string |

**Returns:** [_AccountClaim_](_identity_claims_account_.md#accountclaim)

