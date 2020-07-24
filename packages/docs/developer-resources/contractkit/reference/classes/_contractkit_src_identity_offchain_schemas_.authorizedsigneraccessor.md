# Class: AuthorizedSignerAccessor

## Hierarchy

* **AuthorizedSignerAccessor**

## Index

### Constructors

* [constructor](_contractkit_src_identity_offchain_schemas_.authorizedsigneraccessor.md#constructor)

### Properties

* [basePath](_contractkit_src_identity_offchain_schemas_.authorizedsigneraccessor.md#basepath)
* [wrapper](_contractkit_src_identity_offchain_schemas_.authorizedsigneraccessor.md#wrapper)

### Methods

* [read](_contractkit_src_identity_offchain_schemas_.authorizedsigneraccessor.md#read)
* [write](_contractkit_src_identity_offchain_schemas_.authorizedsigneraccessor.md#write)

## Constructors

###  constructor

\+ **new AuthorizedSignerAccessor**(`wrapper`: [OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md)): *[AuthorizedSignerAccessor](_contractkit_src_identity_offchain_schemas_.authorizedsigneraccessor.md)*

*Defined in [contractkit/src/identity/offchain/schemas.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[AuthorizedSignerAccessor](_contractkit_src_identity_offchain_schemas_.authorizedsigneraccessor.md)*

## Properties

###  basePath

• **basePath**: *string* = "/account/authorizedSigners"

*Defined in [contractkit/src/identity/offchain/schemas.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L25)*

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_contractkit_src_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [contractkit/src/identity/offchain/schemas.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L26)*

## Methods

###  read

▸ **read**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `signer`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹undefined | object›*

*Defined in [contractkit/src/identity/offchain/schemas.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹undefined | object›*

___

###  write

▸ **write**(`signer`: [Address](../modules/_contractkit_src_base_.md#address), `proofOfPossession`: string, `filteredDataPaths`: string): *Promise‹void›*

*Defined in [contractkit/src/identity/offchain/schemas.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | [Address](../modules/_contractkit_src_base_.md#address) |
`proofOfPossession` | string |
`filteredDataPaths` | string |

**Returns:** *Promise‹void›*
