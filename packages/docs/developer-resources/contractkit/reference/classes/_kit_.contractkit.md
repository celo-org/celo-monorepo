# Class: ContractKit

## Hierarchy

* **ContractKit**

## Index

### Constructors

* [constructor](_kit_.contractkit.md#constructor)

### Properties

* [_web3Contracts](_kit_.contractkit.md#readonly-_web3contracts)
* [connection](_kit_.contractkit.md#readonly-connection)
* [contracts](_kit_.contractkit.md#readonly-contracts)
* [gasPriceSuggestionMultiplier](_kit_.contractkit.md#gaspricesuggestionmultiplier)
* [registry](_kit_.contractkit.md#readonly-registry)

### Accessors

* [defaultAccount](_kit_.contractkit.md#defaultaccount)
* [defaultFeeCurrency](_kit_.contractkit.md#defaultfeecurrency)
* [gasInflationFactor](_kit_.contractkit.md#gasinflationfactor)
* [gasPrice](_kit_.contractkit.md#gasprice)
* [web3](_kit_.contractkit.md#web3)

### Methods

* [addAccount](_kit_.contractkit.md#addaccount)
* [fillGasPrice](_kit_.contractkit.md#fillgasprice)
* [getEpochNumberOfBlock](_kit_.contractkit.md#getepochnumberofblock)
* [getEpochSize](_kit_.contractkit.md#getepochsize)
* [getFirstBlockNumberForEpoch](_kit_.contractkit.md#getfirstblocknumberforepoch)
* [getHumanReadableNetworkConfig](_kit_.contractkit.md#gethumanreadablenetworkconfig)
* [getLastBlockNumberForEpoch](_kit_.contractkit.md#getlastblocknumberforepoch)
* [getNetworkConfig](_kit_.contractkit.md#getnetworkconfig)
* [getTotalBalance](_kit_.contractkit.md#gettotalbalance)
* [getWallet](_kit_.contractkit.md#getwallet)
* [isListening](_kit_.contractkit.md#islistening)
* [isSyncing](_kit_.contractkit.md#issyncing)
* [sendTransaction](_kit_.contractkit.md#sendtransaction)
* [sendTransactionObject](_kit_.contractkit.md#sendtransactionobject)
* [setFeeCurrency](_kit_.contractkit.md#setfeecurrency)
* [signTypedData](_kit_.contractkit.md#signtypeddata)
* [stop](_kit_.contractkit.md#stop)
* [updateGasPriceInConnectionLayer](_kit_.contractkit.md#updategaspriceinconnectionlayer)

## Constructors

###  constructor

\+ **new ContractKit**(`connection`: Connection): *[ContractKit](_kit_.contractkit.md)*

*Defined in [contractkit/src/kit.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L86)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

### `Readonly` _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [contractkit/src/kit.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L81)*

factory for core contract's native web3 wrappers

___

### `Readonly` connection

• **connection**: *Connection*

*Defined in [contractkit/src/kit.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L88)*

___

### `Readonly` contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [contractkit/src/kit.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L83)*

factory for core contract's kit wrappers

___

###  gasPriceSuggestionMultiplier

• **gasPriceSuggestionMultiplier**: *number* = 5

*Defined in [contractkit/src/kit.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L86)*

___

### `Readonly` registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [contractkit/src/kit.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L79)*

core contract's address registry

## Accessors

###  defaultAccount

• **get defaultAccount**(): *Address | undefined*

*Defined in [contractkit/src/kit.ts:291](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L291)*

**Returns:** *Address | undefined*

• **set defaultAccount**(`address`: Address | undefined): *void*

*Defined in [contractkit/src/kit.ts:287](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L287)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [contractkit/src/kit.ts:315](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L315)*

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: Address | undefined): *void*

*Defined in [contractkit/src/kit.ts:311](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L311)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address &#124; undefined |

**Returns:** *void*

___

###  gasInflationFactor

• **get gasInflationFactor**(): *number*

*Defined in [contractkit/src/kit.ts:299](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L299)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [contractkit/src/kit.ts:295](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L295)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

*Defined in [contractkit/src/kit.ts:307](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L307)*

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

*Defined in [contractkit/src/kit.ts:303](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L303)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

___

###  web3

• **get web3**(): *Web3‹›*

*Defined in [contractkit/src/kit.ts:353](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L353)*

**Returns:** *Web3‹›*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/kit.ts:283](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L283)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  fillGasPrice

▸ **fillGasPrice**(`tx`: CeloTx): *Promise‹CeloTx›*

*Defined in [contractkit/src/kit.ts:327](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L327)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *Promise‹CeloTx›*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:268](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L268)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSize

▸ **getEpochSize**(): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:241](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L241)*

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:248](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L248)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getHumanReadableNetworkConfig

▸ **getHumanReadableNetworkConfig**(): *Promise‹object›*

*Defined in [contractkit/src/kit.ts:172](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L172)*

**Returns:** *Promise‹object›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [contractkit/src/kit.ts:258](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L258)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

*Defined in [contractkit/src/kit.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L121)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [contractkit/src/kit.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L98)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  getWallet

▸ **getWallet**(): *undefined | ReadOnlyWallet*

*Defined in [contractkit/src/kit.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L94)*

**Returns:** *undefined | ReadOnlyWallet*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [contractkit/src/kit.ts:319](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L319)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [contractkit/src/kit.ts:323](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L323)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: CeloTx): *Promise‹TransactionResult›*

*Defined in [contractkit/src/kit.ts:334](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L334)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *Promise‹TransactionResult›*

___

###  sendTransactionObject

▸ **sendTransactionObject**(`txObj`: CeloTxObject‹any›, `tx?`: Omit‹CeloTx, "data"›): *Promise‹TransactionResult›*

*Defined in [contractkit/src/kit.ts:338](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L338)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | CeloTxObject‹any› |
`tx?` | Omit‹CeloTx, "data"› |

**Returns:** *Promise‹TransactionResult›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`token`: [CeloToken](../modules/_base_.md#celotoken)): *Promise‹void›*

*Defined in [contractkit/src/kit.ts:224](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L224)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | [CeloToken](../modules/_base_.md#celotoken) | cUSD (StableToken) or CELO (GoldToken)  |

**Returns:** *Promise‹void›*

___

###  signTypedData

▸ **signTypedData**(`signer`: string, `typedData`: EIP712TypedData): *Promise‹Signature›*

*Defined in [contractkit/src/kit.ts:345](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L345)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | string |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹Signature›*

___

###  stop

▸ **stop**(): *void*

*Defined in [contractkit/src/kit.ts:349](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L349)*

**Returns:** *void*

___

###  updateGasPriceInConnectionLayer

▸ **updateGasPriceInConnectionLayer**(`currency`: Address): *Promise‹void›*

*Defined in [contractkit/src/kit.ts:234](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L234)*

**Parameters:**

Name | Type |
------ | ------ |
`currency` | Address |

**Returns:** *Promise‹void›*
