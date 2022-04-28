[@celo/connect](../README.md) › [Globals](../globals.md) › ["types"](../modules/_types_.md) › [CeloTxObject](_types_.celotxobject.md)

# Interface: CeloTxObject <**T**>

## Type parameters

▪ **T**

## Hierarchy

* **CeloTxObject**

## Index

### Properties

* [_parent](_types_.celotxobject.md#_parent)
* [arguments](_types_.celotxobject.md#arguments)

### Methods

* [call](_types_.celotxobject.md#call)
* [encodeABI](_types_.celotxobject.md#encodeabi)
* [estimateGas](_types_.celotxobject.md#estimategas)
* [send](_types_.celotxobject.md#send)

## Properties

###  _parent

• **_parent**: *Contract*

*Defined in [types.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L20)*

___

###  arguments

• **arguments**: *any[]*

*Defined in [types.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L15)*

## Methods

###  call

▸ **call**(`tx?`: [CeloTx](../modules/_types_.md#celotx)): *Promise‹T›*

*Defined in [types.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`tx?` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** *Promise‹T›*

___

###  encodeABI

▸ **encodeABI**(): *string*

*Defined in [types.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L19)*

**Returns:** *string*

___

###  estimateGas

▸ **estimateGas**(`tx?`: [CeloTx](../modules/_types_.md#celotx)): *Promise‹number›*

*Defined in [types.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`tx?` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** *Promise‹number›*

___

###  send

▸ **send**(`tx?`: [CeloTx](../modules/_types_.md#celotx)): *PromiEvent‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt)›*

*Defined in [types.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/types.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`tx?` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** *PromiEvent‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt)›*
