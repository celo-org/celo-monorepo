[@celo/base](../README.md) › ["signatureUtils"](_signatureutils_.md)

# Module: "signatureUtils"

## Index

### Interfaces

* [Signature](../interfaces/_signatureutils_.signature.md)
* [Signer](../interfaces/_signatureutils_.signer.md)

### Variables

* [POP_SIZE](_signatureutils_.md#const-pop_size)

### Functions

* [NativeSigner](_signatureutils_.md#nativesigner)
* [serializeSignature](_signatureutils_.md#serializesignature)

### Object literals

* [SignatureBase](_signatureutils_.md#const-signaturebase)

## Variables

### `Const` POP_SIZE

• **POP_SIZE**: *65* = 65

*Defined in [packages/sdk/base/src/signatureUtils.ts:1](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L1)*

## Functions

###  NativeSigner

▸ **NativeSigner**(`signFn`: function, `signer`: string): *[Signer](../interfaces/_signatureutils_.signer.md)*

*Defined in [packages/sdk/base/src/signatureUtils.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L8)*

**Parameters:**

▪ **signFn**: *function*

▸ (`message`: string, `signer`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`signer` | string |

▪ **signer**: *string*

**Returns:** *[Signer](../interfaces/_signatureutils_.signer.md)*

___

###  serializeSignature

▸ **serializeSignature**(`signature`: [Signature](../interfaces/_signatureutils_.signature.md)): *[serializeSignature](_signatureutils_.md#serializesignature)*

*Defined in [packages/sdk/base/src/signatureUtils.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`signature` | [Signature](../interfaces/_signatureutils_.signature.md) |

**Returns:** *[serializeSignature](_signatureutils_.md#serializesignature)*

## Object literals

### `Const` SignatureBase

### ▪ **SignatureBase**: *object*

*Defined in [packages/sdk/base/src/signatureUtils.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L33)*

###  NativeSigner

• **NativeSigner**: *[NativeSigner](_signatureutils_.md#nativesigner)*

*Defined in [packages/sdk/base/src/signatureUtils.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L34)*

###  serializeSignature

• **serializeSignature**: *[serializeSignature](_signatureutils_.md#serializesignature)*

*Defined in [packages/sdk/base/src/signatureUtils.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L35)*
