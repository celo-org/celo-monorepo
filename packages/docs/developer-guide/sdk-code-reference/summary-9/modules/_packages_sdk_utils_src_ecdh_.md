# packages/sdk/utils/src/ecdh

## Index

### Functions

* [computeSharedSecret](_packages_sdk_utils_src_ecdh_.md#computesharedsecret)
* [ensureCompressed](_packages_sdk_utils_src_ecdh_.md#ensurecompressed)
* [ensureUncompressed](_packages_sdk_utils_src_ecdh_.md#ensureuncompressed)
* [isCompressed](_packages_sdk_utils_src_ecdh_.md#iscompressed)
* [trimUncompressedPrefix](_packages_sdk_utils_src_ecdh_.md#trimuncompressedprefix)

## Functions

### computeSharedSecret

▸ **computeSharedSecret**\(`privateKey`: string, `publicKey`: string\): _Buffer_

_Defined in_ [_packages/sdk/utils/src/ecdh.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L7)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |
| `publicKey` | string |

**Returns:** _Buffer_

### ensureCompressed

▸ **ensureCompressed**\(`publicKey`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/ecdh.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L21)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `publicKey` | string |

**Returns:** _string_

### ensureUncompressed

▸ **ensureUncompressed**\(`publicKey`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/ecdh.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L25)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `publicKey` | string |

**Returns:** _string_

### isCompressed

▸ **isCompressed**\(`publicKey`: string\): _boolean_

_Defined in_ [_packages/sdk/utils/src/ecdh.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L13)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `publicKey` | string |

**Returns:** _boolean_

### trimUncompressedPrefix

▸ **trimUncompressedPrefix**\(`publicKey`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/ecdh.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L33)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `publicKey` | string |

**Returns:** _string_

