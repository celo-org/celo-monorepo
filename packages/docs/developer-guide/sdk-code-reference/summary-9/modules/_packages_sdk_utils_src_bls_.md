# packages/sdk/utils/src/bls

## Index

### Variables

* [BLS\_POP\_SIZE](_packages_sdk_utils_src_bls_.md#const-bls_pop_size)
* [BLS\_PUBLIC\_KEY\_SIZE](_packages_sdk_utils_src_bls_.md#const-bls_public_key_size)

### Functions

* [blsPrivateKeyToProcessedPrivateKey](_packages_sdk_utils_src_bls_.md#const-blsprivatekeytoprocessedprivatekey)
* [getBlsPoP](_packages_sdk_utils_src_bls_.md#const-getblspop)
* [getBlsPublicKey](_packages_sdk_utils_src_bls_.md#const-getblspublickey)

## Variables

### `Const` BLS\_POP\_SIZE

• **BLS\_POP\_SIZE**: _48_ = 48

_Defined in_ [_packages/sdk/utils/src/bls.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/bls.ts#L12)

### `Const` BLS\_PUBLIC\_KEY\_SIZE

• **BLS\_PUBLIC\_KEY\_SIZE**: _96_ = 96

_Defined in_ [_packages/sdk/utils/src/bls.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/bls.ts#L11)

## Functions

### `Const` blsPrivateKeyToProcessedPrivateKey

▸ **blsPrivateKeyToProcessedPrivateKey**\(`privateKeyHex`: string\): _any_

_Defined in_ [_packages/sdk/utils/src/bls.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/bls.ts#L14)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKeyHex` | string |

**Returns:** _any_

### `Const` getBlsPoP

▸ **getBlsPoP**\(`address`: string, `privateKeyHex`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/bls.ts:53_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/bls.ts#L53)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `privateKeyHex` | string |

**Returns:** _string_

### `Const` getBlsPublicKey

▸ **getBlsPublicKey**\(`privateKeyHex`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/bls.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/bls.ts#L48)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKeyHex` | string |

**Returns:** _string_

