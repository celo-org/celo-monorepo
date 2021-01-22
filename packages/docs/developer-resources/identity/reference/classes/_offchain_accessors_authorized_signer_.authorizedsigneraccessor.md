# Class: AuthorizedSignerAccessor

## Hierarchy

* **AuthorizedSignerAccessor**

## Index

### Constructors

* [constructor](_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#constructor)

### Properties

* [basePath](_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#basepath)
* [read](_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#read)
* [wrapper](_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#readonly-wrapper)

### Methods

* [readAsResult](_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#readasresult)
* [write](_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#write)

## Constructors

###  constructor

\+ **new AuthorizedSignerAccessor**(`wrapper`: [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)): *[AuthorizedSignerAccessor](_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md)*

*Defined in [packages/sdk/identity/src/offchain/accessors/authorized-signer.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/authorized-signer.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[AuthorizedSignerAccessor](_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md)*

## Properties

###  basePath

• **basePath**: *string* = "/account/authorizedSigners"

*Defined in [packages/sdk/identity/src/offchain/accessors/authorized-signer.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/authorized-signer.ts#L17)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Defined in [packages/sdk/identity/src/offchain/accessors/authorized-signer.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/authorized-signer.ts#L35)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

### `Readonly` wrapper

• **wrapper**: *[OffchainDataWrapper](_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/sdk/identity/src/offchain/accessors/authorized-signer.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/authorized-signer.ts#L18)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: Address, `signer`: Address): *Promise‹Result‹object, [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

*Defined in [packages/sdk/identity/src/offchain/accessors/authorized-signer.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/authorized-signer.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |
`signer` | Address |

**Returns:** *Promise‹Result‹object, [SchemaErrors](../modules/_offchain_accessors_errors_.md#schemaerrors)››*

___

###  write

▸ **write**(`signer`: Address, `proofOfPossession`: string, `filteredDataPaths`: string): *Promise‹[OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors) | void›*

*Defined in [packages/sdk/identity/src/offchain/accessors/authorized-signer.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/authorized-signer.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | Address |
`proofOfPossession` | string |
`filteredDataPaths` | string |

**Returns:** *Promise‹[OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors) | void›*
