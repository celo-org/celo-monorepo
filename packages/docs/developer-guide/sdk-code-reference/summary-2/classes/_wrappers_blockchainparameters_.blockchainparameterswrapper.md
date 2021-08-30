# BlockchainParametersWrapper

Network parameters that are configurable by governance.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹BlockchainParameters›

  ↳ **BlockchainParametersWrapper**

## Index

### Constructors

* [constructor](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#eventtypes)
* [events](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#events)
* [getBlockGasLimit](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getblockgaslimit)
* [getIntrinsicGasForAlternativeFeeCurrency](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getintrinsicgasforalternativefeecurrency)
* [getUptimeLookbackWindow](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getuptimelookbackwindow)
* [methodIds](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#methodids)
* [setBlockGasLimit](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#setblockgaslimit)
* [setIntrinsicGasForAlternativeFeeCurrency](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#setintrinsicgasforalternativefeecurrency)
* [setMinimumClientVersion](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#setminimumclientversion)
* [setUptimeLookbackWindow](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#setuptimelookbackwindow)

### Accessors

* [address](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#address)

### Methods

* [getConfig](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getconfig)
* [getMinimumClientVersion](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getminimumclientversion)
* [getPastEvents](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getpastevents)

## Constructors

### constructor

+ **new BlockchainParametersWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: BlockchainParameters\): [_BlockchainParametersWrapper_](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | BlockchainParameters |

**Returns:** [_BlockchainParametersWrapper_](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _BlockchainParameters\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### getBlockGasLimit

• **getBlockGasLimit**: _function_ = proxyCall\(this.contract.methods.blockGasLimit, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/BlockchainParameters.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L41)

Getting the block gas limit.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getIntrinsicGasForAlternativeFeeCurrency

• **getIntrinsicGasForAlternativeFeeCurrency**: _function_ = proxyCall\( this.contract.methods.intrinsicGasForAlternativeFeeCurrency, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/BlockchainParameters.ts:24_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L24)

Get the extra intrinsic gas for transactions, where gas is paid using non-gold currency.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getUptimeLookbackWindow

• **getUptimeLookbackWindow**: _function_ = proxyCall\( this.contract.methods.getUptimeLookbackWindow, undefined, valueToInt \)

_Defined in_ [_contractkit/src/wrappers/BlockchainParameters.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L79)

Getting the uptime lookback window.

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
    methodABI === undefined
      ? '0x'
      : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_methodIds_](_wrappers_basewrapper_.basewrapper.md#methodids)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

### setBlockGasLimit

• **setBlockGasLimit**: _function_ = proxySend\(this.kit, this.contract.methods.setBlockGasLimit\)

_Defined in_ [_contractkit/src/wrappers/BlockchainParameters.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L46)

Setting the block gas limit.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setIntrinsicGasForAlternativeFeeCurrency

• **setIntrinsicGasForAlternativeFeeCurrency**: _function_ = proxySend\( this.kit, this.contract.methods.setIntrinsicGasForAlternativeFeeCurrency \)

_Defined in_ [_contractkit/src/wrappers/BlockchainParameters.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L33)

Setting the extra intrinsic gas for transactions, where gas is paid using non-gold currency.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setMinimumClientVersion

• **setMinimumClientVersion**: _function_ = proxySend\(this.kit, this.contract.methods.setMinimumClientVersion\)

_Defined in_ [_contractkit/src/wrappers/BlockchainParameters.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L63)

Set minimum client version.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setUptimeLookbackWindow

• **setUptimeLookbackWindow**: _function_ = proxySend\(this.kit, this.contract.methods.setUptimeLookbackWindow\)

_Defined in_ [_contractkit/src/wrappers/BlockchainParameters.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L87)

Setting the uptime lookback window.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_BlockchainParametersConfig_](../interfaces/_wrappers_blockchainparameters_.blockchainparametersconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/BlockchainParameters.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L68)

Returns current configuration parameters.

**Returns:** _Promise‹_[_BlockchainParametersConfig_](../interfaces/_wrappers_blockchainparameters_.blockchainparametersconfig.md)_›_

### getMinimumClientVersion

▸ **getMinimumClientVersion**\(\): _Promise‹_[_ClientVersion_](../interfaces/_wrappers_blockchainparameters_.clientversion.md)_›_

_Defined in_ [_contractkit/src/wrappers/BlockchainParameters.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L51)

Get minimum client version.

**Returns:** _Promise‹_[_ClientVersion_](../interfaces/_wrappers_blockchainparameters_.clientversion.md)_›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹BlockchainParameters›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹BlockchainParameters› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

