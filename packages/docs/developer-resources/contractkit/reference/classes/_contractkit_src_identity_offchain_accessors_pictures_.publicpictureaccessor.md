# Class: PublicPictureAccessor

## Hierarchy

* [PublicBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md)

  ↳ **PublicPictureAccessor**

## Implements

* [PublicAccessor](../interfaces/_contractkit_src_identity_offchain_accessors_interfaces_.publicaccessor.md)‹Buffer›

## Index

### Constructors

* [constructor](_contractkit_src_identity_offchain_accessors_pictures_.publicpictureaccessor.md#constructor)

### Properties

* [dataPath](_contractkit_src_identity_offchain_accessors_pictures_.publicpictureaccessor.md#datapath)
* [read](_contractkit_src_identity_offchain_accessors_pictures_.publicpictureaccessor.md#read)
* [wrapper](_contractkit_src_identity_offchain_accessors_pictures_.publicpictureaccessor.md#wrapper)

### Methods

* [readAsResult](_contractkit_src_identity_offchain_accessors_pictures_.publicpictureaccessor.md#readasresult)
* [write](_contractkit_src_identity_offchain_accessors_pictures_.publicpictureaccessor.md#write)

## Constructors

###  constructor

\+ **new PublicPictureAccessor**(`wrapper`: [OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md)): *[PublicPictureAccessor](_contractkit_src_identity_offchain_accessors_pictures_.publicpictureaccessor.md)*

*Overrides [PublicBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md).[constructor](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md#constructor)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/pictures.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/pictures.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[PublicPictureAccessor](_contractkit_src_identity_offchain_accessors_pictures_.publicpictureaccessor.md)*

## Properties

###  dataPath

• **dataPath**: *string*

*Inherited from [PublicBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md).[dataPath](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md#datapath)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L12)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PublicAccessor](../interfaces/_contractkit_src_identity_offchain_accessors_interfaces_.publicaccessor.md).[read](../interfaces/_contractkit_src_identity_offchain_accessors_interfaces_.publicaccessor.md#read)*

*Inherited from [PublicBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md).[read](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md#read)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L35)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Overrides [PublicBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md).[wrapper](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md#wrapper)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/pictures.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/pictures.ts#L5)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹ErrorResult‹[OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)‹›› | OkResult‹Buffer‹›››*

*Inherited from [PublicBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md).[readAsResult](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md#readasresult)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹ErrorResult‹[OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)‹›› | OkResult‹Buffer‹›››*

___

###  write

▸ **write**(`data`: Buffer): *Promise‹undefined | [OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)‹››*

*Inherited from [PublicBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md).[write](_contractkit_src_identity_offchain_accessors_binary_.publicbinaryaccessor.md#write)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |

**Returns:** *Promise‹undefined | [OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)‹››*
