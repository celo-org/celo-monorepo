[@celo/utils](../README.md) › ["packages/sdk/utils/src/ecdh"](_packages_sdk_utils_src_ecdh_.md)

# Module: "packages/sdk/utils/src/ecdh"

## Index

### Functions

* [computeSharedSecret](_packages_sdk_utils_src_ecdh_.md#computesharedsecret)
* [ensureCompressed](_packages_sdk_utils_src_ecdh_.md#ensurecompressed)
* [ensureUncompressed](_packages_sdk_utils_src_ecdh_.md#ensureuncompressed)
* [isCompressed](_packages_sdk_utils_src_ecdh_.md#iscompressed)
* [trimUncompressedPrefix](_packages_sdk_utils_src_ecdh_.md#trimuncompressedprefix)

## Functions

###  computeSharedSecret

▸ **computeSharedSecret**(`privateKey`: string, `publicKey`: string): *Buffer*

*Defined in [packages/sdk/utils/src/ecdh.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`publicKey` | string |

**Returns:** *Buffer*

___

###  ensureCompressed

▸ **ensureCompressed**(`publicKey`: string): *string*

*Defined in [packages/sdk/utils/src/ecdh.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*

___

###  ensureUncompressed

▸ **ensureUncompressed**(`publicKey`: string): *any*

*Defined in [packages/sdk/utils/src/ecdh.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *any*

___

###  isCompressed

▸ **isCompressed**(`publicKey`: string): *boolean*

*Defined in [packages/sdk/utils/src/ecdh.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *boolean*

___

###  trimUncompressedPrefix

▸ **trimUncompressedPrefix**(`publicKey`: string): *string*

*Defined in [packages/sdk/utils/src/ecdh.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*
