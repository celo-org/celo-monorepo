# External module: "utils/src/ecdh"

## Index

### Functions

* [computeSharedSecret](_utils_src_ecdh_.md#computesharedsecret)
* [ensureCompressed](_utils_src_ecdh_.md#ensurecompressed)
* [ensureUncompressed](_utils_src_ecdh_.md#ensureuncompressed)
* [trimUncompressedPrefix](_utils_src_ecdh_.md#trimuncompressedprefix)

## Functions

###  computeSharedSecret

▸ **computeSharedSecret**(`privateKey`: string, `publicKey`: string): *Buffer*

*Defined in [packages/utils/src/ecdh.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/ecdh.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`publicKey` | string |

**Returns:** *Buffer*

___

###  ensureCompressed

▸ **ensureCompressed**(`publicKey`: string): *string*

*Defined in [packages/utils/src/ecdh.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/ecdh.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*

___

###  ensureUncompressed

▸ **ensureUncompressed**(`publicKey`: string): *string*

*Defined in [packages/utils/src/ecdh.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/ecdh.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*

___

###  trimUncompressedPrefix

▸ **trimUncompressedPrefix**(`publicKey`: string): *string*

*Defined in [packages/utils/src/ecdh.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/ecdh.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*
