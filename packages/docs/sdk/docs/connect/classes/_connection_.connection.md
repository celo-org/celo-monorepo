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

### Methods

* [addAccount](_connection_.connection.md#addaccount)
* [chainId](_connection_.connection.md#chainid)
* [coinbase](_connection_.connection.md#coinbase)
* [estimateGas](_connection_.connection.md#estimategas)
* [estimateGasWithInflationFactor](_connection_.connection.md#estimategaswithinflationfactor)
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
* [setFeeMarketGas](_connection_.connection.md#setfeemarketgas)
* [setProvider](_connection_.connection.md#setprovider)
* [sign](_connection_.connection.md#sign)
* [signTypedData](_connection_.connection.md#signtypeddata)
* [stop](_connection_.connection.md#stop)

## Constructors

###  constructor

\+ **new Connection**(`web3`: Web3, `wallet?`: [ReadOnlyWallet](../interfaces/_wallet_.readonlywallet.md), `handleRevert`: boolean): *[Connection](_connection_.connection.md)*

*Defined in [connection.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L60)*

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

*Defined in [connection.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L59)*

___

###  rpcCaller

• **rpcCaller**: *[RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)*

*Defined in [connection.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L60)*

___

### `Optional` wallet

• **wallet**? : *[ReadOnlyWallet](../interfaces/_wallet_.readonlywallet.md)*

*Defined in [connection.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L62)*

___

### `Readonly` web3

• **web3**: *Web3*

*Defined in [connection.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L62)*

## Accessors

###  defaultAccount

• **get defaultAccount**(): *[Address](../modules/_types_.md#address) | undefined*

*Defined in [connection.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L114)*

Default account for generated transactions (eg. tx.from)

**Returns:** *[Address](../modules/_types_.md#address) | undefined*

• **set defaultAccount**(`address`: [Address](../modules/_types_.md#address) | undefined): *void*

*Defined in [connection.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L106)*

Set default account for generated transactions (eg. tx.from )

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [connection.ts:138](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L138)*

Set the ERC20 address for the token to use to pay for transaction fees.
The ERC20 must be whitelisted for gas.

Set to `null` to use CELO

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: [Address](../modules/_types_.md#address) | undefined): *void*

*Defined in [connection.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L134)*

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

*Defined in [connection.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L122)*

**Returns:** *number*

• **set defaultGasInflationFactor**(`factor`: number): *void*

*Defined in [connection.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L118)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [connection.ts:146](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L146)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  chainId

▸ **chainId**(): *Promise‹number›*

*Defined in [connection.ts:404](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L404)*

**Returns:** *Promise‹number›*

___

###  coinbase

▸ **coinbase**(): *Promise‹string›*

*Defined in [connection.ts:426](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L426)*

**Returns:** *Promise‹string›*

___

###  estimateGas

▸ **estimateGas**(`tx`: [CeloTx](../modules/_types_.md#celotx), `gasEstimator`: function, `caller`: function): *Promise‹number›*

*Defined in [connection.ts:356](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L356)*

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

*Defined in [connection.ts:387](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L387)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](../modules/_types_.md#celotx) |
`gasEstimator?` | undefined &#124; function |
`caller?` | undefined &#124; function |

**Returns:** *Promise‹number›*

___

###  gasPrice

▸ **gasPrice**(`feeCurrency?`: [Address](../modules/_types_.md#address)): *Promise‹string›*

*Defined in [connection.ts:432](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L432)*

**Parameters:**

Name | Type |
------ | ------ |
`feeCurrency?` | [Address](../modules/_types_.md#address) |

**Returns:** *Promise‹string›*

___

###  getAbiCoder

▸ **getAbiCoder**(): *[AbiCoder](../interfaces/_abi_types_.abicoder.md)*

*Defined in [connection.ts:383](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L383)*

**Returns:** *[AbiCoder](../interfaces/_abi_types_.abicoder.md)*

___

###  getAccounts

▸ **getAccounts**(): *Promise‹string[]›*

*Defined in [connection.ts:179](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L179)*

**Returns:** *Promise‹string[]›*

___

###  getBalance

▸ **getBalance**(`address`: [Address](../modules/_types_.md#address), `defaultBlock?`: [BlockNumber](../modules/_types_.md#blocknumber)): *Promise‹string›*

*Defined in [connection.ts:475](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L475)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |
`defaultBlock?` | [BlockNumber](../modules/_types_.md#blocknumber) |

**Returns:** *Promise‹string›*

___

###  getBlock

▸ **getBlock**(`blockHashOrBlockNumber`: [BlockNumber](../modules/_types_.md#blocknumber), `fullTxObjects`: boolean): *Promise‹Block›*

*Defined in [connection.ts:450](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L450)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`blockHashOrBlockNumber` | [BlockNumber](../modules/_types_.md#blocknumber) | - |
`fullTxObjects` | boolean | true |

**Returns:** *Promise‹Block›*

___

###  getBlockHeader

▸ **getBlockHeader**(`blockHashOrBlockNumber`: [BlockNumber](../modules/_types_.md#blocknumber)): *Promise‹BlockHeader›*

*Defined in [connection.ts:463](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L463)*

**Parameters:**

Name | Type |
------ | ------ |
`blockHashOrBlockNumber` | [BlockNumber](../modules/_types_.md#blocknumber) |

**Returns:** *Promise‹BlockHeader›*

___

###  getBlockNumber

▸ **getBlockNumber**(): *Promise‹number›*

*Defined in [connection.ts:441](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L441)*

**Returns:** *Promise‹number›*

___

###  getLocalAccounts

▸ **getLocalAccounts**(): *string[]*

*Defined in [connection.ts:175](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L175)*

**Returns:** *string[]*

___

###  getNodeAccounts

▸ **getNodeAccounts**(): *Promise‹string[]›*

*Defined in [connection.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L170)*

**Returns:** *Promise‹string[]›*

___

###  getTransaction

▸ **getTransaction**(`transactionHash`: string): *Promise‹[CeloTxPending](../modules/_types_.md#celotxpending)›*

*Defined in [connection.ts:484](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L484)*

**Parameters:**

Name | Type |
------ | ------ |
`transactionHash` | string |

**Returns:** *Promise‹[CeloTxPending](../modules/_types_.md#celotxpending)›*

___

###  getTransactionCount

▸ **getTransactionCount**(`address`: [Address](../modules/_types_.md#address)): *Promise‹number›*

*Defined in [connection.ts:415](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L415)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |

**Returns:** *Promise‹number›*

___

###  getTransactionReceipt

▸ **getTransactionReceipt**(`txhash`: string): *Promise‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt) | null›*

*Defined in [connection.ts:492](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L492)*

**Parameters:**

Name | Type |
------ | ------ |
`txhash` | string |

**Returns:** *Promise‹[CeloTxReceipt](../modules/_types_.md#celotxreceipt) | null›*

___

###  hexToAscii

▸ **hexToAscii**(`hex`: string): *string*

*Defined in [connection.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L99)*

**Parameters:**

Name | Type |
------ | ------ |
`hex` | string |

**Returns:** *string*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [connection.ts:187](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L187)*

**Returns:** *Promise‹boolean›*

___

###  isLocalAccount

▸ **isLocalAccount**(`address?`: [Address](../modules/_types_.md#address)): *boolean*

*Defined in [connection.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L142)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_types_.md#address) |

**Returns:** *boolean*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [connection.ts:191](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L191)*

**Returns:** *Promise‹boolean›*

___

###  keccak256

▸ **keccak256**(`value`: string | BN): *string*

*Defined in [connection.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L95)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | string &#124; BN |

**Returns:** *string*

___

###  nonce

▸ **nonce**(`address`: [Address](../modules/_types_.md#address)): *Promise‹number›*

*Defined in [connection.ts:422](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L422)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_types_.md#address) |

**Returns:** *Promise‹number›*

___

###  removeAccount

▸ **removeAccount**(`address`: string): *void*

*Defined in [connection.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L158)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *void*

___

###  sendSignedTransaction

▸ **sendSignedTransaction**(`signedTransactionData`: string): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [connection.ts:329](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L329)*

**Parameters:**

Name | Type |
------ | ------ |
`signedTransactionData` | string |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: [CeloTx](../modules/_types_.md#celotx)): *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

*Defined in [connection.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L215)*

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

*Defined in [connection.ts:231](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L231)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | [CeloTxObject](../interfaces/_types_.celotxobject.md)‹any› |
`tx?` | Omit‹[CeloTx](../modules/_types_.md#celotx), "data"› |

**Returns:** *Promise‹[TransactionResult](_utils_tx_result_.transactionresult.md)›*

___

###  setFeeMarketGas

▸ **setFeeMarketGas**(`tx`: [CeloTx](../modules/_types_.md#celotx)): *Promise‹[CeloTx](../modules/_types_.md#celotx)›*

*Defined in [connection.ts:333](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L333)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** *Promise‹[CeloTx](../modules/_types_.md#celotx)›*

___

###  setProvider

▸ **setProvider**(`provider`: [Provider](../interfaces/_types_.provider.md)): *boolean*

*Defined in [connection.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`provider` | [Provider](../interfaces/_types_.provider.md) |

**Returns:** *boolean*

___

###  sign

▸ **sign**(`dataToSign`: string, `address`: [Address](../modules/_types_.md#address) | number): *Promise‹string›*

*Defined in [connection.ts:302](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L302)*

**Parameters:**

Name | Type |
------ | ------ |
`dataToSign` | string |
`address` | [Address](../modules/_types_.md#address) &#124; number |

**Returns:** *Promise‹string›*

___

###  signTypedData

▸ **signTypedData**(`signer`: string, `typedData`: EIP712TypedData, `version?`: 1 | 3 | 4 | 5): *Promise‹Signature›*

*Defined in [connection.ts:263](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L263)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | string |
`typedData` | EIP712TypedData |
`version?` | 1 &#124; 3 &#124; 4 &#124; 5 |

**Returns:** *Promise‹Signature›*

___

###  stop

▸ **stop**(): *void*

*Defined in [connection.ts:517](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/connection.ts#L517)*

**Returns:** *void*
