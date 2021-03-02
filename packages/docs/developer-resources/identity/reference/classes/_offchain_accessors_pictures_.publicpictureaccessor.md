# Class: PublicPictureAccessor

## Hierarchy

* [PublicBinaryAccessor](_offchain_accessors_binary_.publicbinaryaccessor.md)

  ↳ **PublicPictureAccessor**

## Implements

* [PublicAccessor](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md)‹Buffer›

## Index

### Constructors

* [constructor](_offchain_accessors_pictures_.publicpictureaccessor.md#constructor)

### Properties

* [dataPath](_offchain_accessors_pictures_.publicpictureaccessor.md#readonly-datapath)
* [read](_offchain_accessors_pictures_.publicpictureaccessor.md#read)
* [wrapper](_offchain_accessors_pictures_.publicpictureaccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_offchain_accessors_pictures_.publicpictureaccessor.md#readasresult)
* [write](_offchain_accessors_pictures_.publicpictureaccessor.md#write)

## Constructors

###  constructor

\+ **new PublicPictureAccessor**(`wrapper`: [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)): *[PublicPictureAccessor](_offchain_accessors_pictures_.publicpictureaccessor.md)*

*Overrides [PublicBinaryAccessor](_offchain_accessors_binary_.publicbinaryaccessor.md).[constructor](_offchain_accessors_binary_.publicbinaryaccessor.md#constructor)*

*Defined in [packages/sdk/identity/src/offchain/accessors/pictures.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/pictures.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[PublicPictureAccessor](_offchain_accessors_pictures_.publicpictureaccessor.md)*

## Properties

### `Readonly` dataPath

• **dataPath**: *string*

*Inherited from [PublicBinaryAccessor](_offchain_accessors_binary_.publicbinaryaccessor.md).[dataPath](_offchain_accessors_binary_.publicbinaryaccessor.md#readonly-datapath)*

*Defined in [packages/sdk/identity/src/offchain/accessors/binary.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L12)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PublicAccessor](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md).[read](../interfaces/_offchain_accessors_interfaces_.publicaccessor.md#read)*

*Inherited from [PublicBinaryAccessor](_offchain_accessors_binary_.publicbinaryaccessor.md).[read](_offchain_accessors_binary_.publicbinaryaccessor.md#read)*

*Defined in [packages/sdk/identity/src/offchain/accessors/binary.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L35)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

### `Readonly` wrapper

• **wrapper**: *[OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)*

*Overrides [PublicBinaryAccessor](_offchain_accessors_binary_.publicbinaryaccessor.md).[wrapper](_offchain_accessors_binary_.publicbinaryaccessor.md#readonly-wrapper)*

*Defined in [packages/sdk/identity/src/offchain/accessors/pictures.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/pictures.ts#L5)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: Address): *Promise‹ErrorResult‹[OffchainError](_offchain_accessors_errors_.offchainerror.md)‹›› | OkResult‹Buffer‹›››*

*Inherited from [PublicBinaryAccessor](_offchain_accessors_binary_.publicbinaryaccessor.md).[readAsResult](_offchain_accessors_binary_.publicbinaryaccessor.md#readasresult)*

*Defined in [packages/sdk/identity/src/offchain/accessors/binary.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *Promise‹ErrorResult‹[OffchainError](_offchain_accessors_errors_.offchainerror.md)‹›› | OkResult‹Buffer‹›››*

___

###  write

▸ **write**(`data`: Buffer): *Promise‹undefined | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹››*

*Inherited from [PublicBinaryAccessor](_offchain_accessors_binary_.publicbinaryaccessor.md).[write](_offchain_accessors_binary_.publicbinaryaccessor.md#write)*

*Defined in [packages/sdk/identity/src/offchain/accessors/binary.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |

**Returns:** *Promise‹undefined | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹››*
