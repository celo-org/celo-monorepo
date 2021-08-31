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

+ **new Connection**\(`web3`: Web3, `wallet?`: [ReadOnlyWallet](), `handleRevert`: boolean\): [_Connection_]()

_Defined in_ [_packages/sdk/connect/src/connection.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L52)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `web3` | Web3 | - |
| `wallet?` | [ReadOnlyWallet]() | - |
| `handleRevert` | boolean | true |

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

_Defined in_ [_packages/sdk/connect/src/connection.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L98)

Default account for generated transactions \(eg. tx.from\)

**Returns:** [_Address_](_types_.md#address) _\| undefined_

• **set defaultAccount**\(`address`: [Address](_types_.md#address) \| undefined\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:90_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L90)

Set default account for generated transactions \(eg. tx.from \)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) \| undefined |

**Returns:** _void_

### defaultFeeCurrency

• **get defaultFeeCurrency**\(\): _undefined \| string_

_Defined in_ [_packages/sdk/connect/src/connection.ts:130_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L130)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** _undefined \| string_

• **set defaultFeeCurrency**\(`address`: [Address](_types_.md#address) \| undefined\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:126_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L126)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_types_.md#address) \| undefined | ERC20 address |

**Returns:** _void_

### defaultGasInflationFactor

• **get defaultGasInflationFactor**\(\): _number_

_Defined in_ [_packages/sdk/connect/src/connection.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L106)

**Returns:** _number_

• **set defaultGasInflationFactor**\(`factor`: number\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L102)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `factor` | number |

**Returns:** _void_

### defaultGasPrice

• **get defaultGasPrice**\(\): _number_

_Defined in_ [_packages/sdk/connect/src/connection.ts:114_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L114)

**Returns:** _number_

• **set defaultGasPrice**\(`price`: number\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:110_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L110)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `price` | number |

**Returns:** _void_

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:138_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L138)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _void_

### chainId

▸ **chainId**\(\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:371_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L371)

**Returns:** _Promise‹number›_

### coinbase

▸ **coinbase**\(\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:388_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L388)

**Returns:** _Promise‹string›_

### estimateGas

▸ **estimateGas**\(`tx`: [CeloTx](_types_.md#celotx), `gasEstimator`: function, `caller`: function\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:324_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L324)

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

_Defined in_ [_packages/sdk/connect/src/connection.ts:355_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L355)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](_types_.md#celotx) |
| `gasEstimator?` | undefined \| function |
| `caller?` | undefined \| function |

**Returns:** _Promise‹number›_

### fillGasPrice

▸ **fillGasPrice**\(`tx`: [CeloTx](_types_.md#celotx)\): [_CeloTx_](_types_.md#celotx)

_Defined in_ [_packages/sdk/connect/src/connection.ts:310_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L310)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](_types_.md#celotx) |

**Returns:** [_CeloTx_](_types_.md#celotx)

### gasPrice

▸ **gasPrice**\(`feeCurrency?`: [Address](_types_.md#address)\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:394_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L394)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `feeCurrency?` | [Address](_types_.md#address) |

**Returns:** _Promise‹string›_

### getAbiCoder

▸ **getAbiCoder**\(\): [_AbiCoder_]()

_Defined in_ [_packages/sdk/connect/src/connection.ts:351_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L351)

**Returns:** [_AbiCoder_]()

### getAccounts

▸ **getAccounts**\(\): _Promise‹string\[\]›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:171_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L171)

**Returns:** _Promise‹string\[\]›_

### getBalance

▸ **getBalance**\(`address`: [Address](_types_.md#address), `defaultBlock?`: [BlockNumber](_types_.md#blocknumber)\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:429_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L429)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |
| `defaultBlock?` | [BlockNumber](_types_.md#blocknumber) |

**Returns:** _Promise‹string›_

### getBlock

▸ **getBlock**\(`blockHashOrBlockNumber`: [BlockNumber](_types_.md#blocknumber), `fullTxObjects`: boolean\): _Promise‹Block›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:410_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L410)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `blockHashOrBlockNumber` | [BlockNumber](_types_.md#blocknumber) | - |
| `fullTxObjects` | boolean | true |

**Returns:** _Promise‹Block›_

### getBlockNumber

▸ **getBlockNumber**\(\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:404_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L404)

**Returns:** _Promise‹number›_

### getLocalAccounts

▸ **getLocalAccounts**\(\): _string\[\]_

_Defined in_ [_packages/sdk/connect/src/connection.ts:167_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L167)

**Returns:** _string\[\]_

### getNodeAccounts

▸ **getNodeAccounts**\(\): _Promise‹string\[\]›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:162_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L162)

**Returns:** _Promise‹string\[\]›_

### getTransaction

▸ **getTransaction**\(`transactionHash`: string\): _Promise‹_[_CeloTxPending_](_types_.md#celotxpending)_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:438_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L438)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `transactionHash` | string |

**Returns:** _Promise‹_[_CeloTxPending_](_types_.md#celotxpending)_›_

### getTransactionCount

▸ **getTransactionCount**\(`address`: [Address](_types_.md#address)\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:377_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L377)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |

**Returns:** _Promise‹number›_

### getTransactionReceipt

▸ **getTransactionReceipt**\(`txhash`: string\): _Promise‹_[_CeloTxReceipt_](_types_.md#celotxreceipt) _\| null›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:446_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L446)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txhash` | string |

**Returns:** _Promise‹_[_CeloTxReceipt_](_types_.md#celotxreceipt) _\| null›_

### isListening

▸ **isListening**\(\): _Promise‹boolean›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:179_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L179)

**Returns:** _Promise‹boolean›_

### isLocalAccount

▸ **isLocalAccount**\(`address?`: [Address](_types_.md#address)\): _boolean_

_Defined in_ [_packages/sdk/connect/src/connection.ts:134_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L134)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | [Address](_types_.md#address) |

**Returns:** _boolean_

### isSyncing

▸ **isSyncing**\(\): _Promise‹boolean›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:183_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L183)

**Returns:** _Promise‹boolean›_

### nonce

▸ **nonce**\(`address`: [Address](_types_.md#address)\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:384_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L384)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |

**Returns:** _Promise‹number›_

### removeAccount

▸ **removeAccount**\(`address`: string\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:150_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L150)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _void_

### sendSignedTransaction

▸ **sendSignedTransaction**\(`signedTransactionData`: string\): _Promise‹_[_TransactionResult_]()_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:305_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L305)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signedTransactionData` | string |

**Returns:** _Promise‹_[_TransactionResult_]()_›_

### sendTransaction

▸ **sendTransaction**\(`tx`: [CeloTx](_types_.md#celotx)\): _Promise‹_[_TransactionResult_]()_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:207_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L207)

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

_Defined in_ [_packages/sdk/connect/src/connection.ts:224_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L224)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txObj` | [CeloTxObject]()‹any› |
| `tx?` | Omit‹[CeloTx](_types_.md#celotx), "data"› |

**Returns:** _Promise‹_[_TransactionResult_]()_›_

### setGasPriceForCurrency

▸ **setGasPriceForCurrency**\(`address`: [Address](_types_.md#address), `gasPrice`: string\): _Promise‹void›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:320_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L320)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_types_.md#address) |
| `gasPrice` | string |

**Returns:** _Promise‹void›_

### setProvider

▸ **setProvider**\(`provider`: [Provider]()\): _boolean_

_Defined in_ [_packages/sdk/connect/src/connection.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L71)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `provider` | [Provider]() |

**Returns:** _boolean_

### sign

▸ **sign**\(`dataToSign`: string, `address`: [Address](_types_.md#address) \| number\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:278_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L278)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `dataToSign` | string |
| `address` | [Address](_types_.md#address) \| number |

**Returns:** _Promise‹string›_

### signTypedData

▸ **signTypedData**\(`signer`: string, `typedData`: EIP712TypedData\): _Promise‹Signature›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:250_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L250)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | string |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹Signature›_

### stop

▸ **stop**\(\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:472_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L472)

**Returns:** _void_

