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

*Defined in [packages/sdk/contractkit/src/kit.ts:87](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |

**Returns:** *[ContractKit](_kit_.contractkit.md)*

## Properties

### `Readonly` _web3Contracts

• **_web3Contracts**: *[Web3ContractCache](_web3_contract_cache_.web3contractcache.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:80](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L80)*

factory for core contract's native web3 wrappers

___

### `Readonly` celoTokens

• **celoTokens**: *[CeloTokens](_celo_tokens_.celotokens.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:84](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L84)*

helper for interacting with CELO & stable tokens

___

### `Readonly` connection

• **connection**: *Connection*

*Defined in [packages/sdk/contractkit/src/kit.ts:89](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L89)*

___

### `Readonly` contracts

• **contracts**: *[WrapperCache](_contract_cache_.wrappercache.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:82](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L82)*

factory for core contract's kit wrappers

___

###  gasPriceSuggestionMultiplier

• **gasPriceSuggestionMultiplier**: *number* = 5

*Defined in [packages/sdk/contractkit/src/kit.ts:87](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L87)*

___

### `Readonly` registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/sdk/contractkit/src/kit.ts:78](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L78)*

core contract's address registry

## Accessors

###  defaultAccount

• **get defaultAccount**(): *Address | undefined*

*Defined in [packages/sdk/contractkit/src/kit.ts:287](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L287)*

**Returns:** *Address | undefined*

• **set defaultAccount**(`address`: Address | undefined): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:283](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L283)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address &#124; undefined |

**Returns:** *void*

___

###  defaultFeeCurrency

• **get defaultFeeCurrency**(): *undefined | string*

*Defined in [packages/sdk/contractkit/src/kit.ts:311](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L311)*

**Returns:** *undefined | string*

• **set defaultFeeCurrency**(`address`: Address | undefined): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:307](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L307)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address &#124; undefined |

**Returns:** *void*

___

###  gasInflationFactor

• **get gasInflationFactor**(): *number*

*Defined in [packages/sdk/contractkit/src/kit.ts:295](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L295)*

**Returns:** *number*

• **set gasInflationFactor**(`factor`: number): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:291](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L291)*

**Parameters:**

Name | Type |
------ | ------ |
`factor` | number |

**Returns:** *void*

___

###  gasPrice

• **get gasPrice**(): *number*

*Defined in [packages/sdk/contractkit/src/kit.ts:303](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L303)*

**Returns:** *number*

• **set gasPrice**(`price`: number): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:299](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L299)*

**Parameters:**

Name | Type |
------ | ------ |
`price` | number |

**Returns:** *void*

___

###  web3

• **get web3**(): *Web3‹›*

*Defined in [packages/sdk/contractkit/src/kit.ts:349](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L349)*

**Returns:** *Web3‹›*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:279](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L279)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  fillGasPrice

▸ **fillGasPrice**(`tx`: CeloTx): *Promise‹CeloTx›*

*Defined in [packages/sdk/contractkit/src/kit.ts:323](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L323)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *Promise‹CeloTx›*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:264](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L264)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSize

▸ **getEpochSize**(): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:237](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L237)*

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:244](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L244)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getHumanReadableNetworkConfig

▸ **getHumanReadableNetworkConfig**(): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/kit.ts:167](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L167)*

**Returns:** *Promise‹object›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/kit.ts:254](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L254)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getNetworkConfig

▸ **getNetworkConfig**(): *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

*Defined in [packages/sdk/contractkit/src/kit.ts:117](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L117)*

**Returns:** *Promise‹[NetworkConfig](../interfaces/_kit_.networkconfig.md)›*

___

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹AccountBalance›*

*Defined in [packages/sdk/contractkit/src/kit.ts:100](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹AccountBalance›*

___

###  getWallet

▸ **getWallet**(): *undefined | ReadOnlyWallet*

*Defined in [packages/sdk/contractkit/src/kit.ts:96](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L96)*

**Returns:** *undefined | ReadOnlyWallet*

___

###  isListening

▸ **isListening**(): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/kit.ts:315](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L315)*

**Returns:** *Promise‹boolean›*

___

###  isSyncing

▸ **isSyncing**(): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/kit.ts:319](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L319)*

**Returns:** *Promise‹boolean›*

___

###  sendTransaction

▸ **sendTransaction**(`tx`: CeloTx): *Promise‹TransactionResult›*

*Defined in [packages/sdk/contractkit/src/kit.ts:330](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L330)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *Promise‹TransactionResult›*

___

###  sendTransactionObject

▸ **sendTransactionObject**(`txObj`: CeloTxObject‹any›, `tx?`: Omit‹CeloTx, "data"›): *Promise‹TransactionResult›*

*Defined in [packages/sdk/contractkit/src/kit.ts:334](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L334)*

**Parameters:**

Name | Type |
------ | ------ |
`txObj` | CeloTxObject‹any› |
`tx?` | Omit‹CeloTx, "data"› |

**Returns:** *Promise‹TransactionResult›*

___

###  setFeeCurrency

▸ **setFeeCurrency**(`tokenContract`: [CeloTokenContract](../modules/_base_.md#celotokencontract)): *Promise‹void›*

*Defined in [packages/sdk/contractkit/src/kit.ts:218](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L218)*

Set CeloToken to use to pay for gas fees

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tokenContract` | [CeloTokenContract](../modules/_base_.md#celotokencontract) | CELO (GoldToken) or a supported StableToken contract  |

**Returns:** *Promise‹void›*

___

###  signTypedData

▸ **signTypedData**(`signer`: string, `typedData`: EIP712TypedData): *Promise‹Signature›*

*Defined in [packages/sdk/contractkit/src/kit.ts:341](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L341)*

**Parameters:**

Name | Type |
------ | ------ |
`signer` | string |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹Signature›*

___

###  stop

▸ **stop**(): *void*

*Defined in [packages/sdk/contractkit/src/kit.ts:345](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L345)*

**Returns:** *void*

___

###  updateGasPriceInConnectionLayer

▸ **updateGasPriceInConnectionLayer**(`currency`: Address): *Promise‹void›*

*Defined in [packages/sdk/contractkit/src/kit.ts:230](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L230)*

**Parameters:**

Name | Type |
------ | ------ |
`currency` | Address |

**Returns:** *Promise‹void›*
