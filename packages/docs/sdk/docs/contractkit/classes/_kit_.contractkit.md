[@celo/contractkit](../README.md) › ["kit"](../modules/_kit_.md) › [ContractKit](_kit_.contractkit.md)

# Class: ContractKit

## Hierarchy

* **ContractKit**

## Index

### Constructors

* [constructor](_kit_.contractkit.md#constructor)

### Properties

* [_web3Contracts](_kit_.contractkit.md#readonly-_web3contracts)
* [celoTokens](_kit_.contractkit.md#readonly-celotokens)
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

*Defined in [packages/sdk/contractkit/src/kit.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

### `Readonly` _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L81)*

factory for core contract's native web3 wrappers

___

### `Readonly` celoTokens

• **celoTokens**: *[CeloTokens](_celo_tokens_.celotokens.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L85)*

helper for interacting with CELO & stable tokens

___

### `Readonly` connection

• **connection**: *Connection*

*Defined in [packages/sdk/contractkit/src/kit.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L90)*

___

### `Readonly` contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L83)*

factory for core contract's kit wrappers

___

###  gasPriceSuggestionMultiplier

• **gasPriceSuggestionMultiplier**: *number* = 5

*Defined in [packages/sdk/contractkit/src/kit.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L88)*

___

### `Readonly` registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L79)*

core contract's address registry

## Accessors

###  defaultAccount

• **get defaultAccount**(): *Address | undefined*

*Defined in [packages/sdk/contractkit/src/kit.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L239)*

**Returns:** *Address | undefined*

• **set defaultAccount**(`address`: Address | undefined): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:235](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L235)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [packages/sdk/contractkit/src/kit.ts:263](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L263)*

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: Address | undefined): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:259](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L259)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address &#124; undefined |

**Returns:** *void*

___

###  gasInflationFactor

• **get gasInflationFactor**(): *number*

*Defined in [packages/sdk/contractkit/src/kit.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L247)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L243)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

*Defined in [packages/sdk/contractkit/src/kit.ts:255](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L255)*

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:251](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L251)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

___

###  web3

• **get web3**(): *Web3‹›*

*Defined in [packages/sdk/contractkit/src/kit.ts:301](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L301)*

**Returns:** *Web3‹›*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:231](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L231)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  fillGasPrice

▸ **fillGasPrice**(`tx`: CeloTx): *Promise‹CeloTx›*

*Defined in [packages/sdk/contractkit/src/kit.ts:275](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L275)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *Promise‹CeloTx›*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:216](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L216)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSize

▸ **getEpochSize**(): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:189](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L189)*

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:196](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L196)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getHumanReadableNetworkConfig

▸ **getHumanReadableNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md) | Record‹never, unknown››*

*Defined in [packages/sdk/contractkit/src/kit.ts:164](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L164)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md) | Record‹never, unknown››*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:206](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L206)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(`humanReadable`: boolean): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md) | Record‹[CeloContract](../enums/_base_.celocontract.md) & "exchanges" & "stableTokens", unknown››*

*Defined in [packages/sdk/contractkit/src/kit.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L118)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`humanReadable` | boolean | false |

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md) | Record‹[CeloContract](../enums/_base_.celocontract.md) & "exchanges" & "stableTokens", unknown››*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [packages/sdk/contractkit/src/kit.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  getWallet

▸ **getWallet**(): *undefined | ReadOnlyWallet*

*Defined in [packages/sdk/contractkit/src/kit.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L97)*

**Returns:** *undefined | ReadOnlyWallet*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/kit.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L267)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/kit.ts:271](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L271)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: CeloTx): *Promise‹TransactionResult›*

*Defined in [packages/sdk/contractkit/src/kit.ts:282](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L282)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *Promise‹TransactionResult›*

___

###  sendTransactionObject

▸ **sendTransactionObject**(`txObj`: CeloTxObject‹any›, `tx?`: Omit‹CeloTx, "data"›): *Promise‹TransactionResult›*

*Defined in [packages/sdk/contractkit/src/kit.ts:286](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L286)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | CeloTxObject‹any› |
`tx?` | Omit‹CeloTx, "data"› |

**Returns:** *Promise‹TransactionResult›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`tokenContract`: [CeloTokenContract](../modules/_base_.md#celotokencontract)): *Promise‹void›*

*Defined in [packages/sdk/contractkit/src/kit.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L170)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tokenContract` | [CeloTokenContract](../modules/_base_.md#celotokencontract) | CELO (GoldToken) or a supported StableToken contract  |

**Returns:** *Promise‹void›*

___

###  signTypedData

▸ **signTypedData**(`signer`: string, `typedData`: EIP712TypedData): *Promise‹Signature›*

*Defined in [packages/sdk/contractkit/src/kit.ts:293](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L293)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | string |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹Signature›*

___

###  stop

▸ **stop**(): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:297](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L297)*

**Returns:** *void*

___

###  updateGasPriceInConnectionLayer

▸ **updateGasPriceInConnectionLayer**(`currency`: Address): *Promise‹void›*

*Defined in [packages/sdk/contractkit/src/kit.ts:182](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L182)*

**Parameters:**

Name | Type |
------ | ------ |
`currency` | Address |

**Returns:** *Promise‹void›*
