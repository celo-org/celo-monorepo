# Class: PrivatePictureAccessor

## Hierarchy

* [PrivateBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md)

  ↳ **PrivatePictureAccessor**

## Implements

* [PrivateAccessor](../interfaces/_contractkit_src_identity_offchain_accessors_interfaces_.privateaccessor.md)‹Buffer›

## Index

### Constructors

* [constructor](_contractkit_src_identity_offchain_accessors_pictures_.privatepictureaccessor.md#constructor)

### Properties

* [dataPath](_contractkit_src_identity_offchain_accessors_pictures_.privatepictureaccessor.md#datapath)
* [read](_contractkit_src_identity_offchain_accessors_pictures_.privatepictureaccessor.md#read)
* [wrapper](_contractkit_src_identity_offchain_accessors_pictures_.privatepictureaccessor.md#wrapper)

### Methods

* [readAsResult](_contractkit_src_identity_offchain_accessors_pictures_.privatepictureaccessor.md#readasresult)
* [write](_contractkit_src_identity_offchain_accessors_pictures_.privatepictureaccessor.md#write)

## Constructors

###  constructor

\+ **new PrivatePictureAccessor**(`wrapper`: [OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md)): *[PrivatePictureAccessor](_contractkit_src_identity_offchain_accessors_pictures_.privatepictureaccessor.md)*

*Overrides [PrivateBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md).[constructor](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md#constructor)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/pictures.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/pictures.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[PrivatePictureAccessor](_contractkit_src_identity_offchain_accessors_pictures_.privatepictureaccessor.md)*

## Properties

###  dataPath

• **dataPath**: *string*

*Inherited from [PrivateBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md).[dataPath](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md#datapath)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L42)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PrivateAccessor](../interfaces/_contractkit_src_identity_offchain_accessors_interfaces_.privateaccessor.md).[read](../interfaces/_contractkit_src_identity_offchain_accessors_interfaces_.privateaccessor.md#read)*

*Inherited from [PrivateBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md).[read](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md#read)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L52)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Overrides [PrivateBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md).[wrapper](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md#wrapper)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/pictures.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/pictures.ts#L11)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[OkResult](../interfaces/_base_src_result_.okresult.md)‹Buffer‹›› | [ErrorResult](../interfaces/_base_src_result_.errorresult.md)‹[InvalidDataError](_contractkit_src_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_contractkit_src_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_contractkit_src_identity_offchain_accessors_errors_.invalidkey.md)‹›››*

*Inherited from [PrivateBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md).[readAsResult](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md#readasresult)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹[OkResult](../interfaces/_base_src_result_.okresult.md)‹Buffer‹›› | [ErrorResult](../interfaces/_base_src_result_.errorresult.md)‹[InvalidDataError](_contractkit_src_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_contractkit_src_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_contractkit_src_identity_offchain_accessors_errors_.invalidkey.md)‹›››*

___

###  write

▸ **write**(`data`: Buffer, `toAddresses`: [Address](../modules/_contractkit_src_base_.md#address)[], `symmetricKey?`: Buffer): *Promise‹void | [InvalidDataError](_contractkit_src_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_contractkit_src_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_contractkit_src_identity_offchain_accessors_errors_.invalidkey.md)‹››*

*Inherited from [PrivateBinaryAccessor](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md).[write](_contractkit_src_identity_offchain_accessors_binary_.privatebinaryaccessor.md#write)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`toAddresses` | [Address](../modules/_contractkit_src_base_.md#address)[] |
`symmetricKey?` | Buffer |

**Returns:** *Promise‹void | [InvalidDataError](_contractkit_src_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_contractkit_src_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_contractkit_src_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_contractkit_src_identity_offchain_accessors_errors_.invalidkey.md)‹››*
