# External module: "identity/claims/account"

## Index

### Type aliases

* [AccountClaim](_identity_claims_account_.md#accountclaim)

### Variables

* [AccountClaimType](_identity_claims_account_.md#const-accountclaimtype)
* [AccountClaimTypeH](_identity_claims_account_.md#const-accountclaimtypeh)

### Functions

* [createAccountClaim](_identity_claims_account_.md#const-createaccountclaim)

## Type aliases

###  AccountClaim

Ƭ **AccountClaim**: *t.TypeOf‹typeof AccountClaimTypeH›*

*Defined in [packages/contractkit/src/identity/claims/account.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/account.ts#L34)*

## Variables

### `Const` AccountClaimType

• **AccountClaimType**: *Type‹object, any, unknown›* = new t.Type<AccountClaim, any, unknown>(
  'AccountClaimType',
  AccountClaimTypeH.is,
  (unknownValue, context) =>
    either.chain(AccountClaimTypeH.validate(unknownValue, context), (claim) => {
      if (claim.publicKey === undefined) {
        return t.success(claim)
      }
      const derivedAddress = toChecksumAddress(
        '0x' + pubToAddress(Buffer.from(claim.publicKey.slice(2), 'hex'), true).toString('hex')
      )
      return derivedAddress === claim.address
        ? t.success(claim)
        : t.failure(claim, context, 'public key did not match the address in the claim')
    }),
  (x) => x
)

*Defined in [packages/contractkit/src/identity/claims/account.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/account.ts#L16)*

___

### `Const` AccountClaimTypeH

• **AccountClaimTypeH**: *TypeC‹object›* = t.type({
  type: t.literal(ClaimTypes.ACCOUNT),
  timestamp: TimestampType,
  address: AddressType,
  // io-ts way of defining optional key-value pair
  publicKey: t.union([t.undefined, PublicKeyType]),
})

*Defined in [packages/contractkit/src/identity/claims/account.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/account.ts#L8)*

## Functions

### `Const` createAccountClaim

▸ **createAccountClaim**(`address`: string, `publicKey?`: undefined | string): *[AccountClaim](_identity_claims_account_.md#accountclaim)*

*Defined in [packages/contractkit/src/identity/claims/account.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/account.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`publicKey?` | undefined &#124; string |

**Returns:** *[AccountClaim](_identity_claims_account_.md#accountclaim)*
