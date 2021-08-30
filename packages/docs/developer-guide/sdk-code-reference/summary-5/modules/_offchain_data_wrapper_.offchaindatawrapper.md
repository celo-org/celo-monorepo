# OffchainDataWrapper

## Hierarchy

* **OffchainDataWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [kit]()
* [readDataFrom]()
* [self]()
* [signer]()
* [storageWriter]()

### Methods

* [readDataFromAsResult]()
* [writeDataTo]()

## Constructors

### constructor

+ **new OffchainDataWrapper**\(`self`: string, `kit`: ContractKit, `signer?`: undefined \| string\): [_OffchainDataWrapper_]()

_Defined in_ [_packages/sdk/identity/src/offchain-data-wrapper.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L56)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `self` | string |
| `kit` | ContractKit |
| `signer?` | undefined \| string |

**Returns:** [_OffchainDataWrapper_]()

## Properties

### `Readonly` kit

• **kit**: _ContractKit_

_Defined in_ [_packages/sdk/identity/src/offchain-data-wrapper.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L58)

### readDataFrom

• **readDataFrom**: _Object_ = makeAsyncThrowable\(this.readDataFromAsResult.bind\(this\)\)

_Defined in_ [_packages/sdk/identity/src/offchain-data-wrapper.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L93)

### `Readonly` self

• **self**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain-data-wrapper.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L58)

### signer

• **signer**: _string_

_Defined in_ [_packages/sdk/identity/src/offchain-data-wrapper.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L56)

### storageWriter

• **storageWriter**: [_StorageWriter_]() _\| undefined_

_Defined in_ [_packages/sdk/identity/src/offchain-data-wrapper.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L55)

## Methods

### readDataFromAsResult

▸ **readDataFromAsResult**&lt;**DataType**&gt;\(`account`: Address, `dataPath`: string, `checkOffchainSigners`: boolean, `type?`: t.Type‹DataType›\): _Promise‹Result‹Buffer,_ [_OffchainErrors_](_offchain_data_wrapper_.md#offchainerrors)_››_

_Defined in_ [_packages/sdk/identity/src/offchain-data-wrapper.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L62)

**Type parameters:**

▪ **DataType**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |
| `dataPath` | string |
| `checkOffchainSigners` | boolean |
| `type?` | t.Type‹DataType› |

**Returns:** _Promise‹Result‹Buffer,_ [_OffchainErrors_](_offchain_data_wrapper_.md#offchainerrors)_››_

### writeDataTo

▸ **writeDataTo**\(`data`: Buffer, `signature`: Buffer, `dataPath`: string\): _Promise‹_[_OffchainErrors_](_offchain_data_wrapper_.md#offchainerrors) _\| void›_

_Defined in_ [_packages/sdk/identity/src/offchain-data-wrapper.ts:95_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L95)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | Buffer |
| `signature` | Buffer |
| `dataPath` | string |

**Returns:** _Promise‹_[_OffchainErrors_](_offchain_data_wrapper_.md#offchainerrors) _\| void›_

