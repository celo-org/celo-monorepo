# ContractKit

## Hierarchy

* **ContractKit**

## Index

### Constructors

* [constructor](_kit_.contractkit.md#constructor)

### Properties

* [\_web3Contracts](_kit_.contractkit.md#readonly-_web3contracts)
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

### constructor

+ **new ContractKit**\(`connection`: Connection\): [_ContractKit_](_kit_.contractkit.md)

_Defined in_ [_contractkit/src/kit.ts:86_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L86)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `connection` | Connection |

**Returns:** [_ContractKit_](_kit_.contractkit.md)

## Properties

### `Readonly` \_web3Contracts

• **\_web3Contracts**: [_Web3ContractCache_](_web3_contract_cache_.web3contractcache.md)

_Defined in_ [_contractkit/src/kit.ts:81_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L81)

factory for core contract's native web3 wrappers

### `Readonly` connection

• **connection**: _Connection_

_Defined in_ [_contractkit/src/kit.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L88)

### `Readonly` contracts

• **contracts**: [_WrapperCache_](_contract_cache_.wrappercache.md)

_Defined in_ [_contractkit/src/kit.ts:83_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L83)

factory for core contract's kit wrappers

### gasPriceSuggestionMultiplier

• **gasPriceSuggestionMultiplier**: _number_ = 5

_Defined in_ [_contractkit/src/kit.ts:86_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L86)

### `Readonly` registry

• **registry**: [_AddressRegistry_](_address_registry_.addressregistry.md)

_Defined in_ [_contractkit/src/kit.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L79)

core contract's address registry

## Accessors

### defaultAccount

• **get defaultAccount**\(\): _Address \| undefined_

_Defined in_ [_contractkit/src/kit.ts:290_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L290)

**Returns:** _Address \| undefined_

• **set defaultAccount**\(`address`: Address \| undefined\): _void_

_Defined in_ [_contractkit/src/kit.ts:286_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L286)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address \| undefined |

**Returns:** _void_

### defaultFeeCurrency

• **get defaultFeeCurrency**\(\): _undefined \| string_

_Defined in_ [_contractkit/src/kit.ts:314_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L314)

**Returns:** _undefined \| string_

• **set defaultFeeCurrency**\(`address`: Address \| undefined\): _void_

_Defined in_ [_contractkit/src/kit.ts:310_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L310)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address \| undefined |

**Returns:** _void_

### gasInflationFactor

• **get gasInflationFactor**\(\): _number_

_Defined in_ [_contractkit/src/kit.ts:298_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L298)

**Returns:** _number_

• **set gasInflationFactor**\(`factor`: number\): _void_

_Defined in_ [_contractkit/src/kit.ts:294_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L294)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `factor` | number |

**Returns:** _void_

### gasPrice

• **get gasPrice**\(\): _number_

_Defined in_ [_contractkit/src/kit.ts:306_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L306)

**Returns:** _number_

• **set gasPrice**\(`price`: number\): _void_

_Defined in_ [_contractkit/src/kit.ts:302_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L302)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `price` | number |

**Returns:** _void_

### web3

• **get web3**\(\): _Web3‹›_

_Defined in_ [_contractkit/src/kit.ts:352_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L352)

**Returns:** _Web3‹›_

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string\): _void_

_Defined in_ [_contractkit/src/kit.ts:282_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L282)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _void_

### fillGasPrice

▸ **fillGasPrice**\(`tx`: CeloTx\): _Promise‹CeloTx›_

_Defined in_ [_contractkit/src/kit.ts:326_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L326)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | CeloTx |

**Returns:** _Promise‹CeloTx›_

### getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**\(`blockNumber`: number\): _Promise‹number›_

_Defined in_ [_contractkit/src/kit.ts:267_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L267)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber` | number |

**Returns:** _Promise‹number›_

### getEpochSize

▸ **getEpochSize**\(\): _Promise‹number›_

_Defined in_ [_contractkit/src/kit.ts:240_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L240)

**Returns:** _Promise‹number›_

### getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**\(`epochNumber`: number\): _Promise‹number›_

_Defined in_ [_contractkit/src/kit.ts:247_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L247)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `epochNumber` | number |

**Returns:** _Promise‹number›_

### getHumanReadableNetworkConfig

▸ **getHumanReadableNetworkConfig**\(\): _Promise‹object›_

_Defined in_ [_contractkit/src/kit.ts:171_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L171)

**Returns:** _Promise‹object›_

### getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**\(`epochNumber`: number\): _Promise‹number›_

_Defined in_ [_contractkit/src/kit.ts:257_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L257)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `epochNumber` | number |

**Returns:** _Promise‹number›_

### getNetworkConfig

▸ **getNetworkConfig**\(\): _Promise‹_[_NetworkConfig_](../interfaces/_kit_.networkconfig.md)_›_

_Defined in_ [_contractkit/src/kit.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L120)

**Returns:** _Promise‹_[_NetworkConfig_](../interfaces/_kit_.networkconfig.md)_›_

### getTotalBalance

▸ **getTotalBalance**\(`address`: string\): _Promise‹AccountBalance›_

_Defined in_ [_contractkit/src/kit.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L98)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹AccountBalance›_

### getWallet

▸ **getWallet**\(\): _undefined \| ReadOnlyWallet_

_Defined in_ [_contractkit/src/kit.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L94)

**Returns:** _undefined \| ReadOnlyWallet_

### isListening

▸ **isListening**\(\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/kit.ts:318_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L318)

**Returns:** _Promise‹boolean›_

### isSyncing

▸ **isSyncing**\(\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/kit.ts:322_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L322)

**Returns:** _Promise‹boolean›_

### sendTransaction

▸ **sendTransaction**\(`tx`: CeloTx\): _Promise‹TransactionResult›_

_Defined in_ [_contractkit/src/kit.ts:333_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L333)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | CeloTx |

**Returns:** _Promise‹TransactionResult›_

### sendTransactionObject

▸ **sendTransactionObject**\(`txObj`: CeloTxObject‹any›, `tx?`: Omit‹CeloTx, "data"›\): _Promise‹TransactionResult›_

_Defined in_ [_contractkit/src/kit.ts:337_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L337)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txObj` | CeloTxObject‹any› |
| `tx?` | Omit‹CeloTx, "data"› |

**Returns:** _Promise‹TransactionResult›_

### setFeeCurrency

▸ **setFeeCurrency**\(`token`: [CeloToken](../modules/_base_.md#celotoken)\): _Promise‹void›_

_Defined in_ [_contractkit/src/kit.ts:223_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L223)

Set CeloToken to use to pay for gas fees

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | [CeloToken](../modules/_base_.md#celotoken) | cUSD \(StableToken\) or CELO \(GoldToken\) |

**Returns:** _Promise‹void›_

### signTypedData

▸ **signTypedData**\(`signer`: string, `typedData`: EIP712TypedData\): _Promise‹Signature›_

_Defined in_ [_contractkit/src/kit.ts:344_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L344)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signer` | string |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹Signature›_

### stop

▸ **stop**\(\): _void_

_Defined in_ [_contractkit/src/kit.ts:348_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L348)

**Returns:** _void_

### updateGasPriceInConnectionLayer

▸ **updateGasPriceInConnectionLayer**\(`currency`: Address\): _Promise‹void›_

_Defined in_ [_contractkit/src/kit.ts:233_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L233)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `currency` | Address |

**Returns:** _Promise‹void›_

