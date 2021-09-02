# Class: PrivatePictureAccessor

## Hierarchy

* [PrivateBinaryAccessor](_offchain_accessors_binary_.privatebinaryaccessor.md)

  ↳ **PrivatePictureAccessor**

## Implements

* [PrivateAccessor](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md)‹Buffer›

## Index

### Constructors

* [constructor](_offchain_accessors_pictures_.privatepictureaccessor.md#constructor)

### Properties

* [dataPath](_offchain_accessors_pictures_.privatepictureaccessor.md#readonly-datapath)
* [read](_offchain_accessors_pictures_.privatepictureaccessor.md#read)
* [wrapper](_offchain_accessors_pictures_.privatepictureaccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_offchain_accessors_pictures_.privatepictureaccessor.md#readasresult)
* [write](_offchain_accessors_pictures_.privatepictureaccessor.md#write)

## Constructors

###  constructor

\+ **new PrivatePictureAccessor**(`wrapper`: [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)): *[PrivatePictureAccessor](_offchain_accessors_pictures_.privatepictureaccessor.md)*

*Overrides [PrivateBinaryAccessor](_offchain_accessors_binary_.privatebinaryaccessor.md).[constructor](_offchain_accessors_binary_.privatebinaryaccessor.md#constructor)*

*Defined in [packages/sdk/identity/src/offchain/accessors/pictures.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/pictures.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[PrivatePictureAccessor](_offchain_accessors_pictures_.privatepictureaccessor.md)*

## Properties

### `Readonly` dataPath

• **dataPath**: *string*

*Inherited from [PrivateBinaryAccessor](_offchain_accessors_binary_.privatebinaryaccessor.md).[dataPath](_offchain_accessors_binary_.privatebinaryaccessor.md#readonly-datapath)*

*Defined in [packages/sdk/identity/src/offchain/accessors/binary.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L42)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Implementation of [PrivateAccessor](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md).[read](../interfaces/_offchain_accessors_interfaces_.privateaccessor.md#read)*

*Inherited from [PrivateBinaryAccessor](_offchain_accessors_binary_.privatebinaryaccessor.md).[read](_offchain_accessors_binary_.privatebinaryaccessor.md#read)*

*Defined in [packages/sdk/identity/src/offchain/accessors/binary.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L52)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

### `Readonly` wrapper

• **wrapper**: *[OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)*

*Overrides [PrivateBinaryAccessor](_offchain_accessors_binary_.privatebinaryaccessor.md).[wrapper](_offchain_accessors_binary_.privatebinaryaccessor.md#readonly-wrapper)*

*Defined in [packages/sdk/identity/src/offchain/accessors/pictures.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/pictures.ts#L11)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: Address): *Promise‹Result‹Buffer‹›, [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

*Inherited from [PrivateBinaryAccessor](_offchain_accessors_binary_.privatebinaryaccessor.md).[readAsResult](_offchain_accessors_binary_.privatebinaryaccessor.md#readasresult)*

*Defined in [packages/sdk/identity/src/offchain/accessors/binary.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *Promise‹Result‹Buffer‹›, [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

___

###  write

▸ **write**(`data`: Buffer, `toAddresses`: Address[], `symmetricKey?`: Buffer): *Promise‹void | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_offchain_accessors_errors_.invalidkey.md)‹››*

*Inherited from [PrivateBinaryAccessor](_offchain_accessors_binary_.privatebinaryaccessor.md).[write](_offchain_accessors_binary_.privatebinaryaccessor.md#write)*

*Defined in [packages/sdk/identity/src/offchain/accessors/binary.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/binary.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Buffer |
`toAddresses` | Address[] |
`symmetricKey?` | Buffer |

**Returns:** *Promise‹void | [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_offchain_accessors_errors_.invalidkey.md)‹››*
