# Class: AuthorizedSignerAccessor

## Hierarchy

* **AuthorizedSignerAccessor**

## Index

### Constructors

* [constructor](_identity_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#constructor)

### Properties

* [basePath](_identity_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#basepath)
* [read](_identity_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#read)
* [wrapper](_identity_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#wrapper)

### Methods

* [readAsResult](_identity_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#readasresult)
* [write](_identity_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md#write)

## Constructors

###  constructor

\+ **new AuthorizedSignerAccessor**(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)): *[AuthorizedSignerAccessor](_identity_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[AuthorizedSignerAccessor](_identity_offchain_accessors_authorized_signer_.authorizedsigneraccessor.md)*

## Properties

###  basePath

• **basePath**: *string* = "/account/authorizedSigners"

*Defined in [packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L17)*

___

###  read

• **read**: *function* = makeAsyncThrowable(this.readAsResult.bind(this))

*Defined in [packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L35)*

#### Type declaration:

▸ (...`args`: TArgs): *Promise‹TResult›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L18)*

## Methods

###  readAsResult

▸ **readAsResult**(`account`: [Address](../modules/_base_.md#address), `signer`: [Address](../modules/_base_.md#address)): *Promise‹ErrorResult‹[InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_identity_offchain_accessors_errors_.invalidkey.md)‹›› | OkResult‹object››*

*Defined in [packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`signer` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹ErrorResult‹[InvalidDataError](_identity_offchain_accessors_errors_.invaliddataerror.md)‹› | [OffchainError](_identity_offchain_accessors_errors_.offchainerror.md)‹› | [UnknownCiphertext](_identity_offchain_accessors_errors_.unknownciphertext.md)‹› | [UnavailableKey](_identity_offchain_accessors_errors_.unavailablekey.md)‹› | [InvalidKey](_identity_offchain_accessors_errors_.invalidkey.md)‹›› | OkResult‹object››*

___

###  write

▸ **write**(`signer`: [Address](../modules/_base_.md#address), `proofOfPossession`: string, `filteredDataPaths`: string): *Promise‹[OffchainErrors](../modules/_identity_offchain_data_wrapper_.md#offchainerrors) | void›*

*Defined in [packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | [Address](../modules/_base_.md#address) |
`proofOfPossession` | string |
`filteredDataPaths` | string |

**Returns:** *Promise‹[OffchainErrors](../modules/_identity_offchain_data_wrapper_.md#offchainerrors) | void›*
