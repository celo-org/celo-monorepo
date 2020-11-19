# Class: PrivateBinaryAccessor

Schema for writing any encrypted binary data.

## Hierarchy

* **PrivateBinaryAccessor**

  ↳ [PrivatePictureAccessor](_identity_offchain_accessors_pictures_.privatepictureaccessor.md)

## Implements

* [PrivateAccessor](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md)‹Buffer›

## Index

### Constructors

* [constructor](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#constructor)

### Properties

* [dataPath](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#datapath)
* [read](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#read)
* [wrapper](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#wrapper)

### Methods

* [readAsResult](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#readasresult)
* [write](_identity_offchain_accessors_binary_.privatebinaryaccessor.md#write)

## Constructors

###  constructor

\+ **new PrivateBinaryAccessor**(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md), `dataPath`: string): *[PrivateBinaryAccessor](_identity_offchain_accessors_binary_.privatebinaryaccessor.md)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |
`dataPath` | string |

**Returns:** *[PrivateBinaryAccessor](_identity_offchain_accessors_binary_.privatebinaryaccessor.md)*

## Properties

###  dataPath

• **dataPath**: *string*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L42)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PrivateAccessor](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md).[read](../interfaces/_identity_offchain_accessors_interfaces_.privateaccessor.md#read)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L52)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L42)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: [Address](../modules/_base_.md#address)): *Promise‹OkResult‹Buffer‹›› | ErrorResult‹[InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_identity_offchain_accessors_errors_.invalidkey.md)‹›››*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹OkResult‹Buffer‹›› | ErrorResult‹[InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_identity_offchain_accessors_errors_.invalidkey.md)‹›››*

___

###  write

▸ **write**(`data`: Buffer, `toAddresses`: [Address](../modules/_base_.md#address)[], `symmetricKey?`: Buffer): *Promise‹void | [InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_identity_offchain_accessors_errors_.invalidkey.md)‹››*

*Defined in [packages/contractkit/src/identity/offchain/accessors/binary.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/binary.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`toAddresses` | [Address](../modules/_base_.md#address)[] |
`symmetricKey?` | Buffer |

**Returns:** *Promise‹void | [InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_identity_offchain_accessors_errors_.invalidkey.md)‹››*
