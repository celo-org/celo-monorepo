[@celo/connect](../README.md) › [Globals](../globals.md) › ["connection"](../modules/_connection_.md) › [Connection](_connection_.connection.md)

# Class: Connection

Connection is a Class for connecting to Celo, sending Transactions, etc

**`param`** an instance of web3

**`optional`** wallet a child class of {@link WalletBase}

**`optional`** handleRevert sets handleRevert on the web3.eth instance passed in

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
* [getBlockHeader](_connection_.connection.md#getblockheader)
* [getBlockNumber](_connection_.connection.md#getblocknumber)
* [getLocalAccounts](_connection_.connection.md#getlocalaccounts)
* [getNodeAccounts](_connection_.connection.md#getnodeaccounts)
* [getTransaction](_connection_.connection.md#gettransaction)
* [getTransactionCount](_connection_.connection.md#gettransactioncount)
* [getTransactionReceipt](_connection_.connection.md#gettransactionreceipt)
* [hexToAscii](_connection_.connection.md#hextoascii)
* [isListening](_connection_.connection.md#islistening)
* [isLocalAccount](_connection_.connection.md#islocalaccount)
* [isSyncing](_connection_.connection.md#issyncing)
* [keccak256](_connection_.connection.md#keccak256)
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

*Defined in [connection.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L61)*

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

*Defined in [connection.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L57)*

___

###  rpcCaller

• **rpcCaller**: *[RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)*

*Defined in [connection.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L58)*

___

### `Optional` wallet

• **wallet**? : *[ReadOnlyWallet](../interfaces/_wallet_.readonlywallet.md)*

*Defined in [connection.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L63)*

___

### `Readonly` web3

• **web3**: *Web3*

*Defined in [connection.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L63)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_types_.md#address) | undefined*

*Defined in [connection.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L115)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_types_.md#address) | undefined*

• **set defaultAccount**(`address`: [Address](../modules/_types_.md#address) | undefined): *void*

*Defined in [connection.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L107)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [connection.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L147)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_types_.md#address) | undefined): *void*

*Defined in [connection.ts:143](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L143)*

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

*Defined in [connection.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L123)*

**Returns:** *number*

• **set defaultGasInflationFactor**(`factor`: number): *void*

*Defined in [connection.ts:119](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L119)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  defaultGasPrice

• **get defaultGasPrice**(): *number*

*Defined in [connection.ts:131](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L131)*

**Returns:** *number*

• **set defaultGasPrice**(`price`: number): *void*

*Defined in [connection.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L127)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [connection.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L155)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  chainId

▸ **chainId**(): *Promise‹number›*

*Defined in [connection.ts:388](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L388)*

**Returns:** *Promise‹number›*

___

###  coinbase

▸ **coinbase**(): *Promise‹string›*

*Defined in [connection.ts:405](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L405)*

**Returns:** *Promise‹string›*

___

###  estimateGas

▸ **estimateGas**(`tx`: [CeloTx](../modules/_types_.md#celotx), `gasEstimator`: function, `caller`: function): *Promise‹number›*

*Defined in [connection.ts:341](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L341)*

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

*Defined in [connection.ts:372](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L372)*

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

*Defined in [connection.ts:327](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L327)*

**`deprecated`** no longer needed since gasPrice is available on minimumClientVersion node rpc

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** *[CeloTx](../modules/_types_.md#celotx)*

___

###  gasPrice

▸ **gasPrice**(`feeCurrency?`: [Address](../modules/_types_.md#address)): *Promise‹string›*

*Defined in [connection.ts:411](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L411)*

**Parameters:**

Name | Type |
------ | ------ |
`feeCurrency?` | [Address](../modules/_types_.md#address) |

**Returns:** *Promise‹string›*

___

###  getAbiCoder

▸ **getAbiCoder**(): *[AbiCoder](../interfaces/_abi_types_.abicoder.md)*

*Defined in [connection.ts:368](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L368)*

**Returns:** *[AbiCoder](../interfaces/_abi_types_.abicoder.md)*

___

###  getAccounts

▸ **getAccounts**(): *Promise‹string[]›*

*Defined in [connection.ts:188](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L188)*

**Returns:** *Promise‹string[]›*

___

###  getBalance

▸ **getBalance**(`address`: [Address](../modules/_types_.md#address), `defaultBlock?`: [BlockNumber](../modules/_types_.md#blocknumber)): *Promise‹string›*

*Defined in [connection.ts:458](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L458)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |
`defaultBlock?` | [BlockNumber](../modules/_types_.md#blocknumber) |

**Returns:** *Promise‹string›*

___

###  getBlock

▸ **getBlock**(`blockHashOrBlockNumber`: [BlockNumber](../modules/_types_.md#blocknumber), `fullTxObjects`: boolean): *Promise‹Block›*

*Defined in [connection.ts:430](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L430)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`blockHashOrBlockNumber` | [BlockNumber](../modules/_types_.md#blocknumber) | - |
`fullTxObjects` | boolean | true |

**Returns:** *Promise‹Block›*

___

###  getBlockHeader

▸ **getBlockHeader**(`blockHashOrBlockNumber`: [BlockNumber](../modules/_types_.md#blocknumber)): *Promise‹BlockHeader›*

*Defined in [connection.ts:446](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L446)*

**Parameters:**

Name | Type |
------ | ------ |
`blockHashOrBlockNumber` | [BlockNumber](../modules/_types_.md#blocknumber) |

**Returns:** *Promise‹BlockHeader›*

___

###  getBlockNumber

▸ **getBlockNumber**(): *Promise‹number›*

*Defined in [connection.ts:421](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L421)*

**Returns:** *Promise‹number›*

___

###  getLocalAccounts

▸ **getLocalAccounts**(): *string[]*

*Defined in [connection.ts:184](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L184)*

**Returns:** *string[]*

___

###  getNodeAccounts

▸ **getNodeAccounts**(): *Promise‹string[]›*

*Defined in [connection.ts:179](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L179)*

**Returns:** *Promise‹string[]›*

___

###  getTransaction

▸ **getTransaction**(`transactionHash`: string): *Promise‹[CeloTxPending](../modules/_types_.md#celotxpending)›*

*Defined in [connection.ts:467](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L467)*

**Parameters:**

Name | Type |
------ | ------ |
`transactionHash` | string |

**Returns:** *Promise‹[CeloTxPending](../modules/_types_.md#celotxpending)›*

___

###  getTransactionCount

▸ **getTransactionCount**(`address`: [Address](../modules/_types_.md#address)): *Promise‹number›*

*Defined in [connection.ts:394](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L394)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |

**Returns:** *Promise‹number›*

___

###  getTransactionReceipt

▸ **getTransactionReceipt**(`txhash`: string): *Promise‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt) | null›*

*Defined in [connection.ts:475](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L475)*

**Parameters:**

Name | Type |
------ | ------ |
`txhash` | string |

**Returns:** *Promise‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt) | null›*

___

###  hexToAscii

▸ **hexToAscii**(`hex`: string): *string*

*Defined in [connection.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`hex` | string |

**Returns:** *string*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [connection.ts:196](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L196)*

**Returns:** *Promise‹boolean›*

___

###  isLocalAccount

▸ **isLocalAccount**(`address?`: [Address](../modules/_types_.md#address)): *boolean*

*Defined in [connection.ts:151](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L151)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_types_.md#address) |

**Returns:** *boolean*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [connection.ts:200](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L200)*

**Returns:** *Promise‹boolean›*

___

###  keccak256

▸ **keccak256**(`value`: string | BN): *string*

*Defined in [connection.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | string &#124; BN |

**Returns:** *string*

___

###  nonce

▸ **nonce**(`address`: [Address](../modules/_types_.md#address)): *Promise‹number›*

*Defined in [connection.ts:401](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L401)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |

**Returns:** *Promise‹number›*

___

###  removeAccount

▸ **removeAccount**(`address`: string): *void*

*Defined in [connection.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L167)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *void*

___

###  sendSignedTransaction

▸ **sendSignedTransaction**(`signedTransactionData`: string): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [connection.ts:322](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L322)*

**Parameters:**

Name | Type |
------ | ------ |
`signedTransactionData` | string |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: [CeloTx](../modules/_types_.md#celotx)): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [connection.ts:224](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L224)*

Send a transaction to celo-blockchain.

Similar to `web3.eth.sendTransaction()` but with following differences:
 - applies connections tx's defaults
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

*Defined in [connection.ts:241](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L241)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | [CeloTxObject](../interfaces/_types_.celotxobject.md)‹any› |
`tx?` | Omit‹[CeloTx](../modules/_types_.md#celotx), "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setGasPriceForCurrency

▸ **setGasPriceForCurrency**(`address`: [Address](../modules/_types_.md#address), `gasPrice`: string): *Promise‹void›*

*Defined in [connection.ts:337](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L337)*

**`deprecated`** no longer needed since gasPrice is available on minimumClientVersion node rpc

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |
`gasPrice` | string |

**Returns:** *Promise‹void›*

___

###  setProvider

▸ **setProvider**(`provider`: [Provider](../interfaces/_types_.provider.md)): *boolean*

*Defined in [connection.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`provider` | [Provider](../interfaces/_types_.provider.md) |

**Returns:** *boolean*

___

###  sign

▸ **sign**(`dataToSign`: string, `address`: [Address](../modules/_types_.md#address) | number): *Promise‹string›*

*Defined in [connection.ts:295](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L295)*

**Parameters:**

Name | Type |
------ | ------ |
`dataToSign` | string |
`address` | [Address](../modules/_types_.md#address) &#124; number |

**Returns:** *Promise‹string›*

___

###  signTypedData

▸ **signTypedData**(`signer`: string, `typedData`: EIP712TypedData): *Promise‹Signature›*

*Defined in [connection.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L267)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | string |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹Signature›*

___

###  stop

▸ **stop**(): *void*

*Defined in [connection.ts:501](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L501)*

**Returns:** *void*
