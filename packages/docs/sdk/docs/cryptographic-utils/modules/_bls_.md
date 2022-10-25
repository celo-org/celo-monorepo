[@celo/cryptographic-utils](../README.md) › [Globals](../globals.md) › ["bls"](_bls_.md)

# Module: "bls"

## Index

### Variables

* [BLS_POP_SIZE](_bls_.md#const-bls_pop_size)
* [BLS_PUBLIC_KEY_SIZE](_bls_.md#const-bls_public_key_size)

### Functions

* [blsPrivateKeyToProcessedPrivateKey](_bls_.md#const-blsprivatekeytoprocessedprivatekey)
* [getBlsPoP](_bls_.md#const-getblspop)
* [getBlsPublicKey](_bls_.md#const-getblspublickey)

## Variables

### `Const` BLS_POP_SIZE

• **BLS_POP_SIZE**: *48* = 48

*Defined in [bls.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/bls.ts#L12)*

___

### `Const` BLS_PUBLIC_KEY_SIZE

• **BLS_PUBLIC_KEY_SIZE**: *96* = 96

*Defined in [bls.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/bls.ts#L11)*

## Functions

### `Const` blsPrivateKeyToProcessedPrivateKey

▸ **blsPrivateKeyToProcessedPrivateKey**(`privateKeyHex`: string): *any*

*Defined in [bls.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/bls.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKeyHex` | string |

**Returns:** *any*

___

### `Const` getBlsPoP

▸ **getBlsPoP**(`address`: string, `privateKeyHex`: string): *string*

*Defined in [bls.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/bls.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`privateKeyHex` | string |

**Returns:** *string*

___

### `Const` getBlsPublicKey

▸ **getBlsPublicKey**(`privateKeyHex`: string): *string*

*Defined in [bls.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/bls.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKeyHex` | string |

**Returns:** *string*
