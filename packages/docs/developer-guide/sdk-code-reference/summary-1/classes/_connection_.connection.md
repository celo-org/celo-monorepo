# Connection

## Hierarchy

* **Connection**

## Index

### Constructors

* [constructor](_connection_.connection.md#constructor)

### Properties

* [paramsPopulator](_connection_.connection.md#readonly-paramspopulator)
* [rpcCaller](_connection_.connection.md#rpccaller)
* [wallet](_connection_.connection.md#optional-wallet)
* [web3](_connection_.connection.md#readonly-web3)

### Accessors

* [defaultAccount](_connection_.connection.md#defaultaccount)
* [defaultFeeCurrency](_connection_.connection.md#defaultfeecurrency)
* [defaultGasInflationFactor](_connection_.connection.md#defaultgasinflationfactor)
* [defaultGasPrice](_connection_.connection.md#defaultgasprice)

### Methods

* [addAccount](_connection_.connection.md#addaccount)
* [chainId](_connection_.connection.md#chainid)
* [coinbase](_connection_.connection.md#coinbase)
* [estimateGas](_connection_.connection.md#estimategas)
* [estimateGasWithInflationFactor](_connection_.connection.md#estimategaswithinflationfactor)
* [fillGasPrice](_connection_.connection.md#fillgasprice)
* [gasPrice](_connection_.connection.md#gasprice)
* [getAbiCoder](_connection_.connection.md#getabicoder)
* [getAccounts](_connection_.connection.md#getaccounts)
* [getBalance](_connection_.connection.md#getbalance)
* [getBlock](_connection_.connection.md#getblock)
* [getBlockNumber](_connection_.connection.md#getblocknumber)
* [getLocalAccounts](_connection_.connection.md#getlocalaccounts)
* [getNodeAccounts](_connection_.connection.md#getnodeaccounts)
* [getTransaction](_connection_.connection.md#gettransaction)
* [getTransactionCount](_connection_.connection.md#gettransactioncount)
* [getTransactionReceipt](_connection_.connection.md#gettransactionreceipt)
* [isListening](_connection_.connection.md#islistening)
* [isLocalAccount](_connection_.connection.md#islocalaccount)
* [isSyncing](_connection_.connection.md#issyncing)
* [nonce](_connection_.connection.md#nonce)
* [removeAccount](_connection_.connection.md#removeaccount)
* [sendSignedTransaction](_connection_.connection.md#sendsignedtransaction)
* [sendTransaction](_connection_.connection.md#sendtransaction)
* [sendTransactionObject](_connection_.connection.md#sendtransactionobject)
* [setGasPriceForCurrency](_connection_.connection.md#setgaspriceforcurrency)
* [setProvider](_connection_.connection.md#setprovider)
* [sign](_connection_.connection.md#sign)
* [signTypedData](_connection_.connection.md#signtypeddata)
* [stop](_connection_.connection.md#stop)

## Constructors

### constructor

+ **new Connection**\(`web3`: Web3, `wallet?`: [ReadOnlyWallet](../interfaces/_wallet_.readonlywallet.md), `handleRevert`: boolean\): [_Connection_](_connection_.connection.md)

_Defined in_ [_packages/sdk/connect/src/connection.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L52)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `web3` | Web3 | - |
| `wallet?` | [ReadOnlyWallet](../interfaces/_wallet_.readonlywallet.md) | - |
| `handleRevert` | boolean | true |

**Returns:** [_Connection_](_connection_.connection.md)

## Properties

### `Readonly` paramsPopulator

• **paramsPopulator**: [_TxParamsNormalizer_](_utils_tx_params_normalizer_.txparamsnormalizer.md)

_Defined in_ [_packages/sdk/connect/src/connection.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L48)

### rpcCaller

• **rpcCaller**: [_RpcCaller_](../interfaces/_utils_rpc_caller_.rpccaller.md)

_Defined in_ [_packages/sdk/connect/src/connection.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L49)

### `Optional` wallet

• **wallet**? : [_ReadOnlyWallet_](../interfaces/_wallet_.readonlywallet.md)

_Defined in_ [_packages/sdk/connect/src/connection.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L54)

### `Readonly` web3

• **web3**: _Web3_

_Defined in_ [_packages/sdk/connect/src/connection.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L54)

## Accessors

### defaultAccount

• **get defaultAccount**\(\): [_Address_](../modules/_types_.md#address) _\| undefined_

_Defined in_ [_packages/sdk/connect/src/connection.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L98)

Default account for generated transactions \(eg. tx.from\)

**Returns:** [_Address_](../modules/_types_.md#address) _\| undefined_

• **set defaultAccount**\(`address`: [Address](../modules/_types_.md#address) \| undefined\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:90_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L90)

Set default account for generated transactions \(eg. tx.from \)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) \| undefined |

**Returns:** _void_

### defaultFeeCurrency

• **get defaultFeeCurrency**\(\): _undefined \| string_

_Defined in_ [_packages/sdk/connect/src/connection.ts:130_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L130)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** _undefined \| string_

• **set defaultFeeCurrency**\(`address`: [Address](../modules/_types_.md#address) \| undefined\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:126_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L126)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) \| undefined | ERC20 address |

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

▸ **estimateGas**\(`tx`: [CeloTx](../modules/_types_.md#celotx), `gasEstimator`: function, `caller`: function\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:324_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L324)

**Parameters:**

▪ **tx**: [_CeloTx_](../modules/_types_.md#celotx)

▪`Default value` **gasEstimator**: _function_= this.web3.eth.estimateGas

▸ \(`tx`: [CeloTx](../modules/_types_.md#celotx)\): _Promise‹number›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](../modules/_types_.md#celotx) |

▪`Default value` **caller**: _function_= this.web3.eth.call

▸ \(`tx`: [CeloTx](../modules/_types_.md#celotx)\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** _Promise‹number›_

### estimateGasWithInflationFactor

▸ **estimateGasWithInflationFactor**\(`tx`: [CeloTx](../modules/_types_.md#celotx), `gasEstimator?`: undefined \| function, `caller?`: undefined \| function\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:355_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L355)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](../modules/_types_.md#celotx) |
| `gasEstimator?` | undefined \| function |
| `caller?` | undefined \| function |

**Returns:** _Promise‹number›_

### fillGasPrice

▸ **fillGasPrice**\(`tx`: [CeloTx](../modules/_types_.md#celotx)\): [_CeloTx_](../modules/_types_.md#celotx)

_Defined in_ [_packages/sdk/connect/src/connection.ts:310_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L310)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** [_CeloTx_](../modules/_types_.md#celotx)

### gasPrice

▸ **gasPrice**\(`feeCurrency?`: [Address](../modules/_types_.md#address)\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:394_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L394)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `feeCurrency?` | [Address](../modules/_types_.md#address) |

**Returns:** _Promise‹string›_

### getAbiCoder

▸ **getAbiCoder**\(\): [_AbiCoder_](../interfaces/_abi_types_.abicoder.md)

_Defined in_ [_packages/sdk/connect/src/connection.ts:351_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L351)

**Returns:** [_AbiCoder_](../interfaces/_abi_types_.abicoder.md)

### getAccounts

▸ **getAccounts**\(\): _Promise‹string\[\]›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:171_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L171)

**Returns:** _Promise‹string\[\]›_

### getBalance

▸ **getBalance**\(`address`: [Address](../modules/_types_.md#address), `defaultBlock?`: [BlockNumber](../modules/_types_.md#blocknumber)\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:429_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L429)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) |
| `defaultBlock?` | [BlockNumber](../modules/_types_.md#blocknumber) |

**Returns:** _Promise‹string›_

### getBlock

▸ **getBlock**\(`blockHashOrBlockNumber`: [BlockNumber](../modules/_types_.md#blocknumber), `fullTxObjects`: boolean\): _Promise‹Block›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:410_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L410)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `blockHashOrBlockNumber` | [BlockNumber](../modules/_types_.md#blocknumber) | - |
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

▸ **getTransaction**\(`transactionHash`: string\): _Promise‹_[_CeloTxPending_](../modules/_types_.md#celotxpending)_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:438_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L438)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `transactionHash` | string |

**Returns:** _Promise‹_[_CeloTxPending_](../modules/_types_.md#celotxpending)_›_

### getTransactionCount

▸ **getTransactionCount**\(`address`: [Address](../modules/_types_.md#address)\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:377_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L377)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) |

**Returns:** _Promise‹number›_

### getTransactionReceipt

▸ **getTransactionReceipt**\(`txhash`: string\): _Promise‹_[_CeloTxReceipt_](../modules/_types_.md#celotxreceipt) _\| null›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:446_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L446)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txhash` | string |

**Returns:** _Promise‹_[_CeloTxReceipt_](../modules/_types_.md#celotxreceipt) _\| null›_

### isListening

▸ **isListening**\(\): _Promise‹boolean›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:179_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L179)

**Returns:** _Promise‹boolean›_

### isLocalAccount

▸ **isLocalAccount**\(`address?`: [Address](../modules/_types_.md#address)\): _boolean_

_Defined in_ [_packages/sdk/connect/src/connection.ts:134_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L134)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | [Address](../modules/_types_.md#address) |

**Returns:** _boolean_

### isSyncing

▸ **isSyncing**\(\): _Promise‹boolean›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:183_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L183)

**Returns:** _Promise‹boolean›_

### nonce

▸ **nonce**\(`address`: [Address](../modules/_types_.md#address)\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:384_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L384)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) |

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

▸ **sendSignedTransaction**\(`signedTransactionData`: string\): _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:305_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L305)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signedTransactionData` | string |

**Returns:** _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

### sendTransaction

▸ **sendTransaction**\(`tx`: [CeloTx](../modules/_types_.md#celotx)\): _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:207_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L207)

Send a transaction to celo-blockchain.

Similar to `web3.eth.sendTransaction()` but with following differences:

* applies kit tx's defaults
* estimatesGas before sending
* returns a `TransactionResult` instead of `PromiEvent`

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

### sendTransactionObject

▸ **sendTransactionObject**\(`txObj`: [CeloTxObject](../interfaces/_types_.celotxobject.md)‹any›, `tx?`: Omit‹[CeloTx](../modules/_types_.md#celotx), "data"›\): _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:224_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L224)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txObj` | [CeloTxObject](../interfaces/_types_.celotxobject.md)‹any› |
| `tx?` | Omit‹[CeloTx](../modules/_types_.md#celotx), "data"› |

**Returns:** _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

### setGasPriceForCurrency

▸ **setGasPriceForCurrency**\(`address`: [Address](../modules/_types_.md#address), `gasPrice`: string\): _Promise‹void›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:320_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L320)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) |
| `gasPrice` | string |

**Returns:** _Promise‹void›_

### setProvider

▸ **setProvider**\(`provider`: [Provider](../interfaces/_types_.provider.md)\): _boolean_

_Defined in_ [_packages/sdk/connect/src/connection.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L71)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `provider` | [Provider](../interfaces/_types_.provider.md) |

**Returns:** _boolean_

### sign

▸ **sign**\(`dataToSign`: string, `address`: [Address](../modules/_types_.md#address) \| number\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:278_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L278)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `dataToSign` | string |
| `address` | [Address](../modules/_types_.md#address) \| number |

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

