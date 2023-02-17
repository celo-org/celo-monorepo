[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["kit"](../modules/_kit_.md) › [ContractKit](_kit_.contractkit.md)

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

*Defined in [packages/sdk/contractkit/src/kit.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L113)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

### `Readonly` _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L106)*

factory for core contract's native web3 wrappers

___

### `Readonly` celoTokens

• **celoTokens**: *[CeloTokens](_celo_tokens_.celotokens.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L110)*

helper for interacting with CELO & stable tokens

___

### `Readonly` connection

• **connection**: *Connection*

*Defined in [packages/sdk/contractkit/src/kit.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L115)*

___

### `Readonly` contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:108](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L108)*

factory for core contract's kit wrappers

___

###  gasPriceSuggestionMultiplier

• **gasPriceSuggestionMultiplier**: *number* = 5

*Defined in [packages/sdk/contractkit/src/kit.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L113)*

**`deprecated`** no longer needed since gasPrice is available on minimumClientVersion node rpc

___

### `Readonly` registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L104)*

core contract's address registry

## Accessors

###  defaultAccount

• **get defaultAccount**(): *Address | undefined*

*Defined in [packages/sdk/contractkit/src/kit.ts:249](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L249)*

**Returns:** *Address | undefined*

• **set defaultAccount**(`address`: Address | undefined): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:245](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L245)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [packages/sdk/contractkit/src/kit.ts:273](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L273)*

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: Address | undefined): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:269](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L269)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address &#124; undefined |

**Returns:** *void*

___

###  gasInflationFactor

• **get gasInflationFactor**(): *number*

*Defined in [packages/sdk/contractkit/src/kit.ts:257](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L257)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:253](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L253)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

*Defined in [packages/sdk/contractkit/src/kit.ts:265](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L265)*

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:261](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L261)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

___

###  web3

• **get web3**(): *Web3‹›*

*Defined in [packages/sdk/contractkit/src/kit.ts:311](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L311)*

**Returns:** *Web3‹›*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:241](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L241)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  fillGasPrice

▸ **fillGasPrice**(`tx`: CeloTx): *Promise‹CeloTx›*

*Defined in [packages/sdk/contractkit/src/kit.ts:285](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L285)*

**`deprecated`** no longer needed since gasPrice is available on minimumClientVersion node rpc

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *Promise‹CeloTx›*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:232](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L232)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSize

▸ **getEpochSize**(): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:217](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L217)*

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:222](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L222)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getHumanReadableNetworkConfig

▸ **getHumanReadableNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md) | Record‹never, unknown››*

*Defined in [packages/sdk/contractkit/src/kit.ts:192](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L192)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md) | Record‹never, unknown››*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:227](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L227)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(`humanReadable`: boolean): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md) | Record‹[CeloContract](../enums/_base_.celocontract.md) & "exchanges" & "stableTokens", unknown››*

*Defined in [packages/sdk/contractkit/src/kit.ts:143](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L143)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`humanReadable` | boolean | false |

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md) | Record‹[CeloContract](../enums/_base_.celocontract.md) & "exchanges" & "stableTokens", unknown››*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [packages/sdk/contractkit/src/kit.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L126)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  getWallet

▸ **getWallet**(): *undefined | ReadOnlyWallet*

*Defined in [packages/sdk/contractkit/src/kit.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L122)*

**Returns:** *undefined | ReadOnlyWallet*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/kit.ts:277](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L277)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/kit.ts:281](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L281)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: CeloTx): *Promise‹TransactionResult›*

*Defined in [packages/sdk/contractkit/src/kit.ts:292](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L292)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *Promise‹TransactionResult›*

___

###  sendTransactionObject

▸ **sendTransactionObject**(`txObj`: CeloTxObject‹any›, `tx?`: Omit‹CeloTx, "data"›): *Promise‹TransactionResult›*

*Defined in [packages/sdk/contractkit/src/kit.ts:296](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L296)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | CeloTxObject‹any› |
`tx?` | Omit‹CeloTx, "data"› |

**Returns:** *Promise‹TransactionResult›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`tokenContract`: [CeloTokenContract](../modules/_base_.md#celotokencontract)): *Promise‹void›*

*Defined in [packages/sdk/contractkit/src/kit.ts:198](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L198)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tokenContract` | [CeloTokenContract](../modules/_base_.md#celotokencontract) | CELO (GoldToken) or a supported StableToken contract  |

**Returns:** *Promise‹void›*

___

###  signTypedData

▸ **signTypedData**(`signer`: string, `typedData`: EIP712TypedData): *Promise‹Signature›*

*Defined in [packages/sdk/contractkit/src/kit.ts:303](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L303)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | string |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹Signature›*

___

###  stop

▸ **stop**(): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:307](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L307)*

**Returns:** *void*

___

###  updateGasPriceInConnectionLayer

▸ **updateGasPriceInConnectionLayer**(`currency`: Address): *Promise‹void›*

*Defined in [packages/sdk/contractkit/src/kit.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L210)*

**`deprecated`** no longer needed since gasPrice is available on minimumClientVersion node rpc

**Parameters:**

Name | Type |
------ | ------ |
`currency` | Address |

**Returns:** *Promise‹void›*
