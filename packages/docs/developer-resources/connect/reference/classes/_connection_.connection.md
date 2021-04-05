# Class: Connection

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

###  constructor

\+ **new Connection**(`web3`: Web3, `wallet?`: [ReadOnlyWallet](../interfaces/_wallet_.readonlywallet.md), `handleRevert`: boolean): *[Connection](_connection_.connection.md)*

*Defined in [packages/sdk/connect/src/connection.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L52)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`web3` | Web3 | - |
`wallet?` | [ReadOnlyWallet](../interfaces/_wallet_.readonlywallet.md) | - |
`handleRevert` | boolean | true |

**Returns:** *[Connection](_connection_.connection.md)*

## Properties

### `Readonly` paramsPopulator

• **paramsPopulator**: *[TxParamsNormalizer](_utils_tx_params_normalizer_.txparamsnormalizer.md)*

*Defined in [packages/sdk/connect/src/connection.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L48)*

___

###  rpcCaller

• **rpcCaller**: *[RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)*

*Defined in [packages/sdk/connect/src/connection.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L49)*

___

### `Optional` wallet

• **wallet**? : *[ReadOnlyWallet](../interfaces/_wallet_.readonlywallet.md)*

*Defined in [packages/sdk/connect/src/connection.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L54)*

___

### `Readonly` web3

• **web3**: *Web3*

*Defined in [packages/sdk/connect/src/connection.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L54)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_types_.md#address) | undefined*

*Defined in [packages/sdk/connect/src/connection.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L98)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_types_.md#address) | undefined*

• **set defaultAccount**(`address`: [Address](../modules/_types_.md#address) | undefined): *void*

*Defined in [packages/sdk/connect/src/connection.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L90)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [packages/sdk/connect/src/connection.ts:130](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L130)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_types_.md#address) | undefined): *void*

*Defined in [packages/sdk/connect/src/connection.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L126)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_types_.md#address) &#124; undefined | ERC20 address  |

**Returns:** *void*

___

###  defaultGasInflationFactor

• **get defaultGasInflationFactor**(): *number*

*Defined in [packages/sdk/connect/src/connection.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L106)*

**Returns:** *number*

• **set defaultGasInflationFactor**(`factor`: number): *void*

*Defined in [packages/sdk/connect/src/connection.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L102)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  defaultGasPrice

• **get defaultGasPrice**(): *number*

*Defined in [packages/sdk/connect/src/connection.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L114)*

**Returns:** *number*

• **set defaultGasPrice**(`price`: number): *void*

*Defined in [packages/sdk/connect/src/connection.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L110)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/sdk/connect/src/connection.ts:138](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L138)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  chainId

▸ **chainId**(): *Promise‹number›*

*Defined in [packages/sdk/connect/src/connection.ts:371](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L371)*

**Returns:** *Promise‹number›*

___

###  coinbase

▸ **coinbase**(): *Promise‹string›*

*Defined in [packages/sdk/connect/src/connection.ts:388](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L388)*

**Returns:** *Promise‹string›*

___

###  estimateGas

▸ **estimateGas**(`tx`: [CeloTx](../modules/_types_.md#celotx), `gasEstimator`: function, `caller`: function): *Promise‹number›*

*Defined in [packages/sdk/connect/src/connection.ts:324](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L324)*

**Parameters:**

▪ **tx**: *[CeloTx](../modules/_types_.md#celotx)*

▪`Default value`  **gasEstimator**: *function*= this.web3.eth.estimateGas

▸ (`tx`: [CeloTx](../modules/_types_.md#celotx)): *Promise‹number›*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](../modules/_types_.md#celotx) |

▪`Default value`  **caller**: *function*= this.web3.eth.call

▸ (`tx`: [CeloTx](../modules/_types_.md#celotx)): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** *Promise‹number›*

___

###  estimateGasWithInflationFactor

▸ **estimateGasWithInflationFactor**(`tx`: [CeloTx](../modules/_types_.md#celotx), `gasEstimator?`: undefined | function, `caller?`: undefined | function): *Promise‹number›*

*Defined in [packages/sdk/connect/src/connection.ts:355](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L355)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](../modules/_types_.md#celotx) |
`gasEstimator?` | undefined &#124; function |
`caller?` | undefined &#124; function |

**Returns:** *Promise‹number›*

___

###  fillGasPrice

▸ **fillGasPrice**(`tx`: [CeloTx](../modules/_types_.md#celotx)): *[CeloTx](../modules/_types_.md#celotx)*

*Defined in [packages/sdk/connect/src/connection.ts:310](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L310)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** *[CeloTx](../modules/_types_.md#celotx)*

___

###  gasPrice

▸ **gasPrice**(`feeCurrency?`: [Address](../modules/_types_.md#address)): *Promise‹string›*

*Defined in [packages/sdk/connect/src/connection.ts:394](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L394)*

**Parameters:**

Name | Type |
------ | ------ |
`feeCurrency?` | [Address](../modules/_types_.md#address) |

**Returns:** *Promise‹string›*

___

###  getAbiCoder

▸ **getAbiCoder**(): *[AbiCoder](../interfaces/_abi_types_.abicoder.md)*

*Defined in [packages/sdk/connect/src/connection.ts:351](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L351)*

**Returns:** *[AbiCoder](../interfaces/_abi_types_.abicoder.md)*

___

###  getAccounts

▸ **getAccounts**(): *Promise‹string[]›*

*Defined in [packages/sdk/connect/src/connection.ts:171](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L171)*

**Returns:** *Promise‹string[]›*

___

###  getBalance

▸ **getBalance**(`address`: [Address](../modules/_types_.md#address), `defaultBlock?`: [BlockNumber](../modules/_types_.md#blocknumber)): *Promise‹string›*

*Defined in [packages/sdk/connect/src/connection.ts:429](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L429)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |
`defaultBlock?` | [BlockNumber](../modules/_types_.md#blocknumber) |

**Returns:** *Promise‹string›*

___

###  getBlock

▸ **getBlock**(`blockHashOrBlockNumber`: [BlockNumber](../modules/_types_.md#blocknumber), `fullTxObjects`: boolean): *Promise‹Block›*

*Defined in [packages/sdk/connect/src/connection.ts:410](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L410)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`blockHashOrBlockNumber` | [BlockNumber](../modules/_types_.md#blocknumber) | - |
`fullTxObjects` | boolean | true |

**Returns:** *Promise‹Block›*

___

###  getBlockNumber

▸ **getBlockNumber**(): *Promise‹number›*

*Defined in [packages/sdk/connect/src/connection.ts:404](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L404)*

**Returns:** *Promise‹number›*

___

###  getLocalAccounts

▸ **getLocalAccounts**(): *string[]*

*Defined in [packages/sdk/connect/src/connection.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L167)*

**Returns:** *string[]*

___

###  getNodeAccounts

▸ **getNodeAccounts**(): *Promise‹string[]›*

*Defined in [packages/sdk/connect/src/connection.ts:162](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L162)*

**Returns:** *Promise‹string[]›*

___

###  getTransaction

▸ **getTransaction**(`transactionHash`: string): *Promise‹[CeloTxPending](../modules/_types_.md#celotxpending)›*

*Defined in [packages/sdk/connect/src/connection.ts:438](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L438)*

**Parameters:**

Name | Type |
------ | ------ |
`transactionHash` | string |

**Returns:** *Promise‹[CeloTxPending](../modules/_types_.md#celotxpending)›*

___

###  getTransactionCount

▸ **getTransactionCount**(`address`: [Address](../modules/_types_.md#address)): *Promise‹number›*

*Defined in [packages/sdk/connect/src/connection.ts:377](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L377)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |

**Returns:** *Promise‹number›*

___

###  getTransactionReceipt

▸ **getTransactionReceipt**(`txhash`: string): *Promise‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt) | null›*

*Defined in [packages/sdk/connect/src/connection.ts:446](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L446)*

**Parameters:**

Name | Type |
------ | ------ |
`txhash` | string |

**Returns:** *Promise‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt) | null›*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [packages/sdk/connect/src/connection.ts:179](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L179)*

**Returns:** *Promise‹boolean›*

___

###  isLocalAccount

▸ **isLocalAccount**(`address?`: [Address](../modules/_types_.md#address)): *boolean*

*Defined in [packages/sdk/connect/src/connection.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L134)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_types_.md#address) |

**Returns:** *boolean*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [packages/sdk/connect/src/connection.ts:183](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L183)*

**Returns:** *Promise‹boolean›*

___

###  nonce

▸ **nonce**(`address`: [Address](../modules/_types_.md#address)): *Promise‹number›*

*Defined in [packages/sdk/connect/src/connection.ts:384](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L384)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |

**Returns:** *Promise‹number›*

___

###  removeAccount

▸ **removeAccount**(`address`: string): *void*

*Defined in [packages/sdk/connect/src/connection.ts:150](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L150)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *void*

___

###  sendSignedTransaction

▸ **sendSignedTransaction**(`signedTransactionData`: string): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [packages/sdk/connect/src/connection.ts:305](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L305)*

**Parameters:**

Name | Type |
------ | ------ |
`signedTransactionData` | string |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: [CeloTx](../modules/_types_.md#celotx)): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [packages/sdk/connect/src/connection.ts:207](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L207)*

Send a transaction to celo-blockchain.

Similar to `web3.eth.sendTransaction()` but with following differences:
 - applies kit tx's defaults
 - estimatesGas before sending
 - returns a `TransactionResult` instead of `PromiEvent`

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  sendTransactionObject

▸ **sendTransactionObject**(`txObj`: [CeloTxObject](../interfaces/_types_.celotxobject.md)‹any›, `tx?`: Omit‹[CeloTx](../modules/_types_.md#celotx), "data"›): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [packages/sdk/connect/src/connection.ts:224](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L224)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | [CeloTxObject](../interfaces/_types_.celotxobject.md)‹any› |
`tx?` | Omit‹[CeloTx](../modules/_types_.md#celotx), "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setGasPriceForCurrency

▸ **setGasPriceForCurrency**(`address`: [Address](../modules/_types_.md#address), `gasPrice`: string): *Promise‹void›*

*Defined in [packages/sdk/connect/src/connection.ts:320](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L320)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |
`gasPrice` | string |

**Returns:** *Promise‹void›*

___

###  setProvider

▸ **setProvider**(`provider`: [Provider](../interfaces/_types_.provider.md)): *boolean*

*Defined in [packages/sdk/connect/src/connection.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L71)*

**Parameters:**

Name | Type |
------ | ------ |
`provider` | [Provider](../interfaces/_types_.provider.md) |

**Returns:** *boolean*

___

###  sign

▸ **sign**(`dataToSign`: string, `address`: [Address](../modules/_types_.md#address) | number): *Promise‹string›*

*Defined in [packages/sdk/connect/src/connection.ts:278](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L278)*

**Parameters:**

Name | Type |
------ | ------ |
`dataToSign` | string |
`address` | [Address](../modules/_types_.md#address) &#124; number |

**Returns:** *Promise‹string›*

___

###  signTypedData

▸ **signTypedData**(`signer`: string, `typedData`: EIP712TypedData): *Promise‹Signature›*

*Defined in [packages/sdk/connect/src/connection.ts:250](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L250)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | string |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹Signature›*

___

###  stop

▸ **stop**(): *void*

*Defined in [packages/sdk/connect/src/connection.ts:472](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L472)*

**Returns:** *void*
