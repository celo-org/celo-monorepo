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

*Defined in [packages/sdk/utils/src/ecdh.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`publicKey` | string |

**Returns:** *Buffer*

___

###  ensureCompressed

▸ **ensureCompressed**(`publicKey`: string): *string*

*Defined in [packages/sdk/utils/src/ecdh.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*

___

###  ensureUncompressed

▸ **ensureUncompressed**(`publicKey`: string): *string*

*Defined in [packages/sdk/utils/src/ecdh.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*

___

###  isCompressed

▸ **isCompressed**(`publicKey`: string): *boolean*

*Defined in [packages/sdk/utils/src/ecdh.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *boolean*

___

###  trimUncompressedPrefix

▸ **trimUncompressedPrefix**(`publicKey`: string): *string*

*Defined in [packages/sdk/utils/src/ecdh.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*
