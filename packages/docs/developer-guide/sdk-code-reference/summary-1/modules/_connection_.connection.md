# Connection

## Hierarchy

* **Connection**

## Index

### Constructors

* [constructor]()

### Properties

* [paramsPopulator]()
* [rpcCaller]()
* [wallet]()
* [web3]()

### Accessors

* [defaultAccount]()
* [defaultFeeCurrency]()
* [defaultGasInflationFactor]()
* [defaultGasPrice]()

### Methods

* [addAccount]()
* [chainId]()
* [coinbase]()
* [estimateGas]()
* [estimateGasWithInflationFactor]()
* [fillGasPrice]()
* [gasPrice]()
* [getAbiCoder]()
* [getAccounts]()
* [getBalance]()
* [getBlock]()
* [getBlockNumber]()
* [getLocalAccounts]()
* [getNodeAccounts]()
* [getTransaction]()
* [getTransactionCount]()
* [getTransactionReceipt]()
* [isListening]()
* [isLocalAccount]()
* [isSyncing]()
* [nonce]()
* [removeAccount]()
* [sendSignedTransaction]()
* [sendTransaction]()
* [sendTransactionObject]()
* [setGasPriceForCurrency]()
* [setProvider]()
* [sign]()
* [signTypedData]()
* [stop]()

## Constructors

### constructor

+ **new Connection**\(`web3`: Web3, `wallet?`: [ReadOnlyWallet]()\): [_Connection_]()

_Defined in_ [_packages/sdk/connect/src/connection.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L52)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `web3` | Web3 |
| `wallet?` | [ReadOnlyWallet]() |

**Returns:** [_Connection_]()

## Properties

### `Readonly` paramsPopulator

• **paramsPopulator**: [_TxParamsNormalizer_]()

_Defined in_ [_packages/sdk/connect/src/connection.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L48)

### rpcCaller

• **rpcCaller**: [_RpcCaller_]()

_Defined in_ [_packages/sdk/connect/src/connection.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L49)

### `Optional` wallet

• **wallet**? : [_ReadOnlyWallet_]()

_Defined in_ [_packages/sdk/connect/src/connection.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L54)

### `Readonly` web3

• **web3**: _Web3_

_Defined in_ [_packages/sdk/connect/src/connection.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L54)

## Accessors

### defaultAccount

• **get defaultAccount**\(\): [_Address_](_types_.md#address) _\| undefined_

_Defined in_ [_packages/sdk/connect/src/connection.ts:96_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L96)

Default account for generated transactions \(eg. tx.from\)

**Returns:** [_Address_](_types_.md#address) _\| undefined_

• **set defaultAccount**\(`address`: [Address](_types_.md#address) \| undefined\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L88)

Set default account for generated transactions \(eg. tx.from \)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) \| undefined |

**Returns:** _void_

### defaultFeeCurrency

• **get defaultFeeCurrency**\(\): _undefined \| string_

_Defined in_ [_packages/sdk/connect/src/connection.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L128)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** _undefined \| string_

• **set defaultFeeCurrency**\(`address`: [Address](_types_.md#address) \| undefined\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:124_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L124)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_types_.md#address) \| undefined | ERC20 address |

**Returns:** _void_

### defaultGasInflationFactor

• **get defaultGasInflationFactor**\(\): _number_

_Defined in_ [_packages/sdk/connect/src/connection.ts:104_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L104)

**Returns:** _number_

• **set defaultGasInflationFactor**\(`factor`: number\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L100)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `factor` | number |

**Returns:** _void_

### defaultGasPrice

• **get defaultGasPrice**\(\): _number_

_Defined in_ [_packages/sdk/connect/src/connection.ts:112_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L112)

**Returns:** _number_

• **set defaultGasPrice**\(`price`: number\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:108_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L108)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `price` | number |

**Returns:** _void_

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:136_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L136)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _void_

### chainId

▸ **chainId**\(\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:369_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L369)

**Returns:** _Promise‹number›_

### coinbase

▸ **coinbase**\(\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:386_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L386)

**Returns:** _Promise‹string›_

### estimateGas

▸ **estimateGas**\(`tx`: [CeloTx](_types_.md#celotx), `gasEstimator`: function, `caller`: function\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:322_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L322)

**Parameters:**

▪ **tx**: [_CeloTx_](_types_.md#celotx)

▪`Default value` **gasEstimator**: _function_= this.web3.eth.estimateGas

▸ \(`tx`: [CeloTx](_types_.md#celotx)\): _Promise‹number›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](_types_.md#celotx) |

▪`Default value` **caller**: _function_= this.web3.eth.call

▸ \(`tx`: [CeloTx](_types_.md#celotx)\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](_types_.md#celotx) |

**Returns:** _Promise‹number›_

### estimateGasWithInflationFactor

▸ **estimateGasWithInflationFactor**\(`tx`: [CeloTx](_types_.md#celotx), `gasEstimator?`: undefined \| function, `caller?`: undefined \| function\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:353_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L353)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](_types_.md#celotx) |
| `gasEstimator?` | undefined \| function |
| `caller?` | undefined \| function |

**Returns:** _Promise‹number›_

### fillGasPrice

▸ **fillGasPrice**\(`tx`: [CeloTx](_types_.md#celotx)\): [_CeloTx_](_types_.md#celotx)

_Defined in_ [_packages/sdk/connect/src/connection.ts:308_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L308)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](_types_.md#celotx) |

**Returns:** [_CeloTx_](_types_.md#celotx)

### gasPrice

▸ **gasPrice**\(`feeCurrency?`: [Address](_types_.md#address)\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:392_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L392)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `feeCurrency?` | [Address](_types_.md#address) |

**Returns:** _Promise‹string›_

### getAbiCoder

▸ **getAbiCoder**\(\): [_AbiCoder_]()

_Defined in_ [_packages/sdk/connect/src/connection.ts:349_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L349)

**Returns:** [_AbiCoder_]()

### getAccounts

▸ **getAccounts**\(\): _Promise‹string\[\]›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:169_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L169)

**Returns:** _Promise‹string\[\]›_

### getBalance

▸ **getBalance**\(`address`: [Address](_types_.md#address), `defaultBlock?`: [BlockNumber](_types_.md#blocknumber)\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:427_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L427)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |
| `defaultBlock?` | [BlockNumber](_types_.md#blocknumber) |

**Returns:** _Promise‹string›_

### getBlock

▸ **getBlock**\(`blockHashOrBlockNumber`: [BlockNumber](_types_.md#blocknumber), `fullTxObjects`: boolean\): _Promise‹Block›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:408_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L408)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `blockHashOrBlockNumber` | [BlockNumber](_types_.md#blocknumber) | - |
| `fullTxObjects` | boolean | true |

**Returns:** _Promise‹Block›_

### getBlockNumber

▸ **getBlockNumber**\(\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:402_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L402)

**Returns:** _Promise‹number›_

### getLocalAccounts

▸ **getLocalAccounts**\(\): _string\[\]_

_Defined in_ [_packages/sdk/connect/src/connection.ts:165_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L165)

**Returns:** _string\[\]_

### getNodeAccounts

▸ **getNodeAccounts**\(\): _Promise‹string\[\]›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:160_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L160)

**Returns:** _Promise‹string\[\]›_

### getTransaction

▸ **getTransaction**\(`transactionHash`: string\): _Promise‹_[_CeloTxPending_](_types_.md#celotxpending)_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:436_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L436)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `transactionHash` | string |

**Returns:** _Promise‹_[_CeloTxPending_](_types_.md#celotxpending)_›_

### getTransactionCount

▸ **getTransactionCount**\(`address`: [Address](_types_.md#address)\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:375_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L375)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |

**Returns:** _Promise‹number›_

### getTransactionReceipt

▸ **getTransactionReceipt**\(`txhash`: string\): _Promise‹_[_CeloTxReceipt_](_types_.md#celotxreceipt) _\| null›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:444_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L444)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txhash` | string |

**Returns:** _Promise‹_[_CeloTxReceipt_](_types_.md#celotxreceipt) _\| null›_

### isListening

▸ **isListening**\(\): _Promise‹boolean›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:177_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L177)

**Returns:** _Promise‹boolean›_

### isLocalAccount

▸ **isLocalAccount**\(`address?`: [Address](_types_.md#address)\): _boolean_

_Defined in_ [_packages/sdk/connect/src/connection.ts:132_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L132)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | [Address](_types_.md#address) |

**Returns:** _boolean_

### isSyncing

▸ **isSyncing**\(\): _Promise‹boolean›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:181_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L181)

**Returns:** _Promise‹boolean›_

### nonce

▸ **nonce**\(`address`: [Address](_types_.md#address)\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:382_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L382)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |

**Returns:** _Promise‹number›_

### removeAccount

▸ **removeAccount**\(`address`: string\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:148_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L148)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _void_

### sendSignedTransaction

▸ **sendSignedTransaction**\(`signedTransactionData`: string\): _Promise‹_[_TransactionResult_]()_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:303_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L303)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signedTransactionData` | string |

**Returns:** _Promise‹_[_TransactionResult_]()_›_

### sendTransaction

▸ **sendTransaction**\(`tx`: [CeloTx](_types_.md#celotx)\): _Promise‹_[_TransactionResult_]()_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:205_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L205)

Send a transaction to celo-blockchain.

Similar to `web3.eth.sendTransaction()` but with following differences:

* applies kit tx's defaults
* estimatesGas before sending
* returns a `TransactionResult` instead of `PromiEvent`

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](_types_.md#celotx) |

**Returns:** _Promise‹_[_TransactionResult_]()_›_

### sendTransactionObject

▸ **sendTransactionObject**\(`txObj`: [CeloTxObject]()‹any›, `tx?`: Omit‹[CeloTx](_types_.md#celotx), "data"›\): _Promise‹_[_TransactionResult_]()_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:222_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L222)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txObj` | [CeloTxObject]()‹any› |
| `tx?` | Omit‹[CeloTx](_types_.md#celotx), "data"› |

**Returns:** _Promise‹_[_TransactionResult_]()_›_

### setGasPriceForCurrency

▸ **setGasPriceForCurrency**\(`address`: [Address](_types_.md#address), `gasPrice`: string\): _Promise‹void›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:318_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L318)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |
| `gasPrice` | string |

**Returns:** _Promise‹void›_

### setProvider

▸ **setProvider**\(`provider`: [Provider]()\): _boolean_

_Defined in_ [_packages/sdk/connect/src/connection.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L69)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `provider` | [Provider]() |

**Returns:** _boolean_

### sign

▸ **sign**\(`dataToSign`: string, `address`: [Address](_types_.md#address) \| number\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:276_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L276)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `dataToSign` | string |
| `address` | [Address](_types_.md#address) \| number |

**Returns:** _Promise‹string›_

### signTypedData

▸ **signTypedData**\(`signer`: string, `typedData`: EIP712TypedData\): _Promise‹Signature›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:248_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L248)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | string |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹Signature›_

### stop

▸ **stop**\(\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:470_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L470)

**Returns:** _void_

