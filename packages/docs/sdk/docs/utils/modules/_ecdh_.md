[@celo/utils](../README.md) › ["ecdh"](_ecdh_.md)

# Module: "ecdh"

## Index

### Functions

* [computeSharedSecret](_ecdh_.md#computesharedsecret)
* [ensureCompressed](_ecdh_.md#ensurecompressed)
* [ensureUncompressed](_ecdh_.md#ensureuncompressed)
* [isCompressed](_ecdh_.md#iscompressed)
* [trimUncompressedPrefix](_ecdh_.md#trimuncompressedprefix)

## Functions

###  computeSharedSecret

▸ **computeSharedSecret**(`privateKey`: string, `publicKey`: string): *Buffer*

*Defined in [ecdh.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`publicKey` | string |

**Returns:** *Buffer*

___

###  ensureCompressed

▸ **ensureCompressed**(`publicKey`: string): *string*

*Defined in [ecdh.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *string*

___

###  ensureUncompressed

▸ **ensureUncompressed**(`publicKey`: string): *[ensureUncompressed](_ecdh_.md#ensureuncompressed)*

*Defined in [ecdh.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *[ensureUncompressed](_ecdh_.md#ensureuncompressed)*

___

###  isCompressed

▸ **isCompressed**(`publicKey`: string): *[isCompressed](_ecdh_.md#iscompressed)*

*Defined in [ecdh.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *[isCompressed](_ecdh_.md#iscompressed)*

___

###  trimUncompressedPrefix

▸ **trimUncompressedPrefix**(`publicKey`: string): *[trimUncompressedPrefix](_ecdh_.md#trimuncompressedprefix)*

*Defined in [ecdh.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/ecdh.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | string |

**Returns:** *[trimUncompressedPrefix](_ecdh_.md#trimuncompressedprefix)*
