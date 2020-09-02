# External module: "utils/ber-utils"

## Index

### Functions

* [asn1FromPublicKey](_utils_ber_utils_.md#asn1frompublickey)
* [parseBERSignature](_utils_ber_utils_.md#parsebersignature)
* [publicKeyFromAsn1](_utils_ber_utils_.md#publickeyfromasn1)
* [toArrayBuffer](_utils_ber_utils_.md#const-toarraybuffer)

## Functions

###  asn1FromPublicKey

▸ **asn1FromPublicKey**(`bn`: BigNumber): *Buffer*

*Defined in [packages/contractkit/src/utils/ber-utils.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/ber-utils.ts#L23)*

This is used only for mocking
Creates an asn1 key to emulate KMS response

**Parameters:**

Name | Type |
------ | ------ |
`bn` | BigNumber |

**Returns:** *Buffer*

___

###  parseBERSignature

▸ **parseBERSignature**(`b`: Buffer): *object*

*Defined in [packages/contractkit/src/utils/ber-utils.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/ber-utils.ts#L44)*

AWS returns DER encoded signatures but DER is valid BER

**Parameters:**

Name | Type |
------ | ------ |
`b` | Buffer |

**Returns:** *object*

* **r**: *Buffer*

* **s**: *Buffer*

___

###  publicKeyFromAsn1

▸ **publicKeyFromAsn1**(`b`: Buffer): *BigNumber*

*Defined in [packages/contractkit/src/utils/ber-utils.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/ber-utils.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`b` | Buffer |

**Returns:** *BigNumber*

___

### `Const` toArrayBuffer

▸ **toArrayBuffer**(`b`: Buffer): *ArrayBuffer*

*Defined in [packages/contractkit/src/utils/ber-utils.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/ber-utils.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`b` | Buffer |

**Returns:** *ArrayBuffer*
