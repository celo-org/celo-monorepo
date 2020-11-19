# Class: PublicBinaryAccessor

Schema for writing any generic binary data

## Hierarchy

* **PublicBinaryAccessor**

  ↳ [PublicPictureAccessor](_identity_offchain_accessors_pictures_.publicpictureaccessor.md)

## Implements

* [PublicAccessor](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md)‹Buffer›

## Index

### Constructors

* [constructor](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#constructor)

### Properties

* [dataPath](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#datapath)
* [read](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#read)
* [wrapper](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#wrapper)

### Methods

* [readAsResult](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#readasresult)
* [write](_identity_offchain_accessors_binary_.publicbinaryaccessor.md#write)

## Constructors

###  constructor

\+ **new PublicBinaryAccessor**(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string): *[PublicBinaryAccessor](_identity_offchain_accessors_binary_.publicbinaryaccessor.md)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`dataPath` | string |

**Returns:** *[PublicBinaryAccessor](_identity_offchain_accessors_binary_.publicbinaryaccessor.md)*

## Properties

###  dataPath

• **dataPath**: *string*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L12)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PublicAccessor](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md).[read](../interfaces/_identity_offchain_accessors_interfaces_.publicaccessor.md#read)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L35)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L12)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: [Address](../modules/_base_.md#address)): *Promise‹ErrorResult‹[OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹›› | OkResult‹Buffer‹›››*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹ErrorResult‹[OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹›› | OkResult‹Buffer‹›››*

___

###  write

▸ **write**(`data`: Buffer): *Promise‹undefined | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹››*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |

**Returns:** *Promise‹undefined | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹››*
