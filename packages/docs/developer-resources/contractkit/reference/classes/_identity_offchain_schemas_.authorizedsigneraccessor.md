# Class: AuthorizedSignerAccessor

## Hierarchy

* **AuthorizedSignerAccessor**

## Index

### Constructors

* [constructor](_identity_offchain_schemas_.authorizedsigneraccessor.md#constructor)

### Properties

* [basePath](_identity_offchain_schemas_.authorizedsigneraccessor.md#basepath)
* [wrapper](_identity_offchain_schemas_.authorizedsigneraccessor.md#wrapper)

### Methods

* [read](_identity_offchain_schemas_.authorizedsigneraccessor.md#read)
* [write](_identity_offchain_schemas_.authorizedsigneraccessor.md#write)

## Constructors

###  constructor

\+ **new AuthorizedSignerAccessor**(`wrapper`: [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)): *[AuthorizedSignerAccessor](_identity_offchain_schemas_.authorizedsigneraccessor.md)*

*Defined in [contractkit/src/identity/offchain/schemas.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`wrapper` | [OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md) |

**Returns:** *[AuthorizedSignerAccessor](_identity_offchain_schemas_.authorizedsigneraccessor.md)*

## Properties

###  basePath

• **basePath**: *string* = "/account/authorizedSigners"

*Defined in [contractkit/src/identity/offchain/schemas.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L26)*

___

###  wrapper

• **wrapper**: *[OffchainDataWrapper](_identity_offchain_data_wrapper_.offchaindatawrapper.md)*

*Defined in [contractkit/src/identity/offchain/schemas.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L27)*

## Methods

###  read

▸ **read**(`account`: [Address](../modules/_base_.md#address), `signer`: [Address](../modules/_base_.md#address)): *Promise‹undefined | object›*

*Defined in [contractkit/src/identity/offchain/schemas.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`signer` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹undefined | object›*

___

###  write

▸ **write**(`signer`: [Address](../modules/_base_.md#address), `proofOfPossession`: string, `filteredDataPaths`: string): *Promise‹void›*

*Defined in [contractkit/src/identity/offchain/schemas.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schemas.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | [Address](../modules/_base_.md#address) |
`proofOfPossession` | string |
`filteredDataPaths` | string |

**Returns:** *Promise‹void›*
