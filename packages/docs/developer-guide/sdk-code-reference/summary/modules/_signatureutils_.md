# signatureUtils

## Index

### Interfaces

* [Signature]()
* [Signer]()

### Variables

* [POP\_SIZE](_signatureutils_.md#const-pop_size)

### Functions

* [NativeSigner](_signatureutils_.md#nativesigner)
* [serializeSignature](_signatureutils_.md#serializesignature)

### Object literals

* [SignatureBase](_signatureutils_.md#const-signaturebase)

## Variables

### `Const` POP\_SIZE

• **POP\_SIZE**: _65_ = 65

_Defined in_ [_packages/sdk/base/src/signatureUtils.ts:1_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L1)

## Functions

### NativeSigner

▸ **NativeSigner**\(`signFn`: function, `signer`: string\): [_Signer_]()

_Defined in_ [_packages/sdk/base/src/signatureUtils.ts:8_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L8)

**Parameters:**

▪ **signFn**: _function_

▸ \(`message`: string, `signer`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |
| `signer` | string |

▪ **signer**: _string_

**Returns:** [_Signer_]()

### serializeSignature

▸ **serializeSignature**\(`signature`: [Signature]()\): _string_

_Defined in_ [_packages/sdk/base/src/signatureUtils.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L25)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signature` | [Signature]() |

**Returns:** _string_

## Object literals

### `Const` SignatureBase

### ▪ **SignatureBase**: _object_

_Defined in_ [_packages/sdk/base/src/signatureUtils.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L32)

### NativeSigner

• **NativeSigner**: [_NativeSigner_](_signatureutils_.md#nativesigner)

_Defined in_ [_packages/sdk/base/src/signatureUtils.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L33)

### serializeSignature

• **serializeSignature**: [_serializeSignature_](_signatureutils_.md#serializesignature)

_Defined in_ [_packages/sdk/base/src/signatureUtils.ts:34_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/signatureUtils.ts#L34)

