# CeloTxObject

## Type parameters

▪ **T**

## Hierarchy

* **CeloTxObject**

## Index

### Properties

* [\_parent](_types_.celotxobject.md#_parent)
* [arguments](_types_.celotxobject.md#arguments)

### Methods

* [call](_types_.celotxobject.md#call)
* [encodeABI](_types_.celotxobject.md#encodeabi)
* [estimateGas](_types_.celotxobject.md#estimategas)
* [send](_types_.celotxobject.md#send)

## Properties

### \_parent

• **\_parent**: _Contract_

_Defined in_ [_packages/sdk/connect/src/types.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L20)

### arguments

• **arguments**: _any\[\]_

_Defined in_ [_packages/sdk/connect/src/types.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L15)

## Methods

### call

▸ **call**\(`tx?`: [CeloTx](../modules/_types_.md#celotx)\): _Promise‹T›_

_Defined in_ [_packages/sdk/connect/src/types.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L16)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx?` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** _Promise‹T›_

### encodeABI

▸ **encodeABI**\(\): _string_

_Defined in_ [_packages/sdk/connect/src/types.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L19)

**Returns:** _string_

### estimateGas

▸ **estimateGas**\(`tx?`: [CeloTx](../modules/_types_.md#celotx)\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/types.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L18)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx?` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** _Promise‹number›_

### send

▸ **send**\(`tx?`: [CeloTx](../modules/_types_.md#celotx)\): _PromiEvent‹_[_CeloTxReceipt_](../modules/_types_.md#celotxreceipt)_›_

_Defined in_ [_packages/sdk/connect/src/types.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx?` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** _PromiEvent‹_[_CeloTxReceipt_](../modules/_types_.md#celotxreceipt)_›_

