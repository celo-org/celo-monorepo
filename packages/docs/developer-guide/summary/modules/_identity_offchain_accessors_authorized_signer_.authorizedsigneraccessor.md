# AuthorizedSignerAccessor

## Hierarchy

* **AuthorizedSignerAccessor**

## Index

### Constructors

* [constructor]()

### Properties

* [basePath]()
* [read]()
* [wrapper]()

### Methods

* [readAsResult]()
* [write]()

## Constructors

### constructor

+ **new AuthorizedSignerAccessor**\(`wrapper`: [OffchainDataWrapper]()\): [_AuthorizedSignerAccessor_]()

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `wrapper` | [OffchainDataWrapper]() |

**Returns:** [_AuthorizedSignerAccessor_]()

## Properties

### basePath

• **basePath**: _string_ = "/account/authorizedSigners"

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L17)

### read

• **read**: _function_ = makeAsyncThrowable\(this.readAsResult.bind\(this\)\)

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L35)

#### Type declaration:

▸ \(...`args`: TArgs\): _Promise‹TResult›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

### `Readonly` wrapper

• **wrapper**: [_OffchainDataWrapper_]()

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L18)

## Methods

### readAsResult

▸ **readAsResult**\(`account`: [Address](_base_.md#address), `signer`: [Address](_base_.md#address)\): _Promise‹Result‹object,_ [_SchemaErrors_](_identity_offchain_accessors_errors_.md#schemaerrors)_››_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L20)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |
| `signer` | [Address](_base_.md#address) |

**Returns:** _Promise‹Result‹object,_ [_SchemaErrors_](_identity_offchain_accessors_errors_.md#schemaerrors)_››_

### write

▸ **write**\(`signer`: [Address](_base_.md#address), `proofOfPossession`: string, `filteredDataPaths`: string\): _Promise‹_[_OffchainErrors_](_identity_offchain_data_wrapper_.md#offchainerrors) _\| void›_

_Defined in_ [_packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/authorized-signer.ts#L37)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | [Address](_base_.md#address) |
| `proofOfPossession` | string |
| `filteredDataPaths` | string |

**Returns:** _Promise‹_[_OffchainErrors_](_identity_offchain_data_wrapper_.md#offchainerrors) _\| void›_

