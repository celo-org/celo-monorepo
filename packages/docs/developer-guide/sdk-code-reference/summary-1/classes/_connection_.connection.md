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

+ **new Connection**\(`web3`: Web3, `wallet?`: [ReadOnlyWallet](../interfaces/_wallet_.readonlywallet.md)\): [_Connection_](_connection_.connection.md)

_Defined in_ [_packages/sdk/connect/src/connection.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L52)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `web3` | Web3 |
| `wallet?` | [ReadOnlyWallet](../interfaces/_wallet_.readonlywallet.md) |

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

_Defined in_ [_packages/sdk/connect/src/connection.ts:96_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L96)

Default account for generated transactions \(eg. tx.from\)

**Returns:** [_Address_](../modules/_types_.md#address) _\| undefined_

• **set defaultAccount**\(`address`: [Address](../modules/_types_.md#address) \| undefined\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L88)

Set default account for generated transactions \(eg. tx.from \)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) \| undefined |

**Returns:** _void_

### defaultFeeCurrency

• **get defaultFeeCurrency**\(\): _undefined \| string_

_Defined in_ [_packages/sdk/connect/src/connection.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L128)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** _undefined \| string_

• **set defaultFeeCurrency**\(`address`: [Address](../modules/_types_.md#address) \| undefined\): _void_

_Defined in_ [_packages/sdk/connect/src/connection.ts:124_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L124)

Set the ERC20 address for the token to use to pay for transaction fees. The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) \| undefined | ERC20 address |

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

▸ **estimateGas**\(`tx`: [CeloTx](../modules/_types_.md#celotx), `gasEstimator`: function, `caller`: function\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:322_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L322)

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

_Defined in_ [_packages/sdk/connect/src/connection.ts:353_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L353)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](../modules/_types_.md#celotx) |
| `gasEstimator?` | undefined \| function |
| `caller?` | undefined \| function |

**Returns:** _Promise‹number›_

### fillGasPrice

▸ **fillGasPrice**\(`tx`: [CeloTx](../modules/_types_.md#celotx)\): [_CeloTx_](../modules/_types_.md#celotx)

_Defined in_ [_packages/sdk/connect/src/connection.ts:308_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L308)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** [_CeloTx_](../modules/_types_.md#celotx)

### gasPrice

▸ **gasPrice**\(`feeCurrency?`: [Address](../modules/_types_.md#address)\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:392_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L392)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `feeCurrency?` | [Address](../modules/_types_.md#address) |

**Returns:** _Promise‹string›_

### getAbiCoder

▸ **getAbiCoder**\(\): [_AbiCoder_](../interfaces/_abi_types_.abicoder.md)

_Defined in_ [_packages/sdk/connect/src/connection.ts:349_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L349)

**Returns:** [_AbiCoder_](../interfaces/_abi_types_.abicoder.md)

### getAccounts

▸ **getAccounts**\(\): _Promise‹string\[\]›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:169_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L169)

**Returns:** _Promise‹string\[\]›_

### getBalance

▸ **getBalance**\(`address`: [Address](../modules/_types_.md#address), `defaultBlock?`: [BlockNumber](../modules/_types_.md#blocknumber)\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:427_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L427)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) |
| `defaultBlock?` | [BlockNumber](../modules/_types_.md#blocknumber) |

**Returns:** _Promise‹string›_

### getBlock

▸ **getBlock**\(`blockHashOrBlockNumber`: [BlockNumber](../modules/_types_.md#blocknumber), `fullTxObjects`: boolean\): _Promise‹Block›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:408_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L408)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `blockHashOrBlockNumber` | [BlockNumber](../modules/_types_.md#blocknumber) | - |
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

▸ **getTransaction**\(`transactionHash`: string\): _Promise‹_[_CeloTxPending_](../modules/_types_.md#celotxpending)_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:436_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L436)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `transactionHash` | string |

**Returns:** _Promise‹_[_CeloTxPending_](../modules/_types_.md#celotxpending)_›_

### getTransactionCount

▸ **getTransactionCount**\(`address`: [Address](../modules/_types_.md#address)\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:375_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L375)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) |

**Returns:** _Promise‹number›_

### getTransactionReceipt

▸ **getTransactionReceipt**\(`txhash`: string\): _Promise‹_[_CeloTxReceipt_](../modules/_types_.md#celotxreceipt) _\| null›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:444_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L444)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txhash` | string |

**Returns:** _Promise‹_[_CeloTxReceipt_](../modules/_types_.md#celotxreceipt) _\| null›_

### isListening

▸ **isListening**\(\): _Promise‹boolean›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:177_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L177)

**Returns:** _Promise‹boolean›_

### isLocalAccount

▸ **isLocalAccount**\(`address?`: [Address](../modules/_types_.md#address)\): _boolean_

_Defined in_ [_packages/sdk/connect/src/connection.ts:132_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L132)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | [Address](../modules/_types_.md#address) |

**Returns:** _boolean_

### isSyncing

▸ **isSyncing**\(\): _Promise‹boolean›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:181_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L181)

**Returns:** _Promise‹boolean›_

### nonce

▸ **nonce**\(`address`: [Address](../modules/_types_.md#address)\): _Promise‹number›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:382_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L382)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) |

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

▸ **sendSignedTransaction**\(`signedTransactionData`: string\): _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:303_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L303)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signedTransactionData` | string |

**Returns:** _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

### sendTransaction

▸ **sendTransaction**\(`tx`: [CeloTx](../modules/_types_.md#celotx)\): _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:205_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L205)

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

_Defined in_ [_packages/sdk/connect/src/connection.ts:222_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L222)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txObj` | [CeloTxObject](../interfaces/_types_.celotxobject.md)‹any› |
| `tx?` | Omit‹[CeloTx](../modules/_types_.md#celotx), "data"› |

**Returns:** _Promise‹_[_TransactionResult_](_utils_tx_result_.transactionresult.md)_›_

### setGasPriceForCurrency

▸ **setGasPriceForCurrency**\(`address`: [Address](../modules/_types_.md#address), `gasPrice`: string\): _Promise‹void›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:318_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L318)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_types_.md#address) |
| `gasPrice` | string |

**Returns:** _Promise‹void›_

### setProvider

▸ **setProvider**\(`provider`: [Provider](../interfaces/_types_.provider.md)\): _boolean_

_Defined in_ [_packages/sdk/connect/src/connection.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L69)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `provider` | [Provider](../interfaces/_types_.provider.md) |

**Returns:** _boolean_

### sign

▸ **sign**\(`dataToSign`: string, `address`: [Address](../modules/_types_.md#address) \| number\): _Promise‹string›_

_Defined in_ [_packages/sdk/connect/src/connection.ts:276_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L276)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `dataToSign` | string |
| `address` | [Address](../modules/_types_.md#address) \| number |

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

