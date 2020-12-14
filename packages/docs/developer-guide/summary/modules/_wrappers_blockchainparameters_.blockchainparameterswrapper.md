# BlockchainParametersWrapper

Network parameters that are configurable by governance.

## Hierarchy

* [BaseWrapper]()‹BlockchainParameters›

  ↳ **BlockchainParametersWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [eventTypes]()
* [events]()
* [getBlockGasLimit]()
* [getIntrinsicGasForAlternativeFeeCurrency]()
* [methodIds]()
* [setBlockGasLimit]()
* [setIntrinsicGasForAlternativeFeeCurrency]()
* [setMinimumClientVersion]()

### Accessors

* [address]()

### Methods

* [getConfig]()
* [getMinimumClientVersion]()
* [getPastEvents]()

## Constructors

### constructor

+ **new BlockchainParametersWrapper**\(`kit`: [ContractKit](), `contract`: BlockchainParameters\): [_BlockchainParametersWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | BlockchainParameters |

**Returns:** [_BlockchainParametersWrapper_]()

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

### events

• **events**: _BlockchainParameters\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### getBlockGasLimit

• **getBlockGasLimit**: _function_ = proxyCall\(this.contract.methods.blockGasLimit, undefined, valueToBigNumber\)

_Defined in_ [_packages/contractkit/src/wrappers/BlockchainParameters.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L41)

Getting the block gas limit.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getIntrinsicGasForAlternativeFeeCurrency

• **getIntrinsicGasForAlternativeFeeCurrency**: _function_ = proxyCall\( this.contract.methods.intrinsicGasForAlternativeFeeCurrency, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/BlockchainParameters.ts:24_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L24)

Get the extra intrinsic gas for transactions, where gas is paid using non-gold currency.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### methodIds

• **methodIds**: _Record‹keyof T\["methods"\], string›_ = Object.keys\(this.contract.methods\).reduce, string&gt;&gt;\( \(acc, method: Methods\) =&gt; { const methodABI = this.contract.options.jsonInterface.find\(\(item\) =&gt; item.name === method\)

```text
  acc[method] =
    methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)

### setBlockGasLimit

• **setBlockGasLimit**: _function_ = proxySend\(this.kit, this.contract.methods.setBlockGasLimit\)

_Defined in_ [_packages/contractkit/src/wrappers/BlockchainParameters.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L46)

Setting the block gas limit.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setIntrinsicGasForAlternativeFeeCurrency

• **setIntrinsicGasForAlternativeFeeCurrency**: _function_ = proxySend\( this.kit, this.contract.methods.setIntrinsicGasForAlternativeFeeCurrency \)

_Defined in_ [_packages/contractkit/src/wrappers/BlockchainParameters.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L33)

Setting the extra intrinsic gas for transactions, where gas is paid using non-gold currency.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setMinimumClientVersion

• **setMinimumClientVersion**: _function_ = proxySend\(this.kit, this.contract.methods.setMinimumClientVersion\)

_Defined in_ [_packages/contractkit/src/wrappers/BlockchainParameters.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L63)

Set minimum client version.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_BlockchainParametersConfig_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/BlockchainParameters.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L68)

Returns current configuration parameters.

**Returns:** _Promise‹_[_BlockchainParametersConfig_]()_›_

### getMinimumClientVersion

▸ **getMinimumClientVersion**\(\): _Promise‹_[_ClientVersion_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/BlockchainParameters.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L51)

Get minimum client version.

**Returns:** _Promise‹_[_ClientVersion_]()_›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹BlockchainParameters›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹BlockchainParameters› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

