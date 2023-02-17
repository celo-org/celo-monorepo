[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/BlockchainParameters"](../modules/_wrappers_blockchainparameters_.md) › [BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)

# Class: BlockchainParametersWrapper

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
* [getEpochNumber](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getepochnumber)
* [getEpochSize](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getepochsize)
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
* [getEpochNumberOfBlock](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getepochnumberofblock)
* [getEpochSizeNumber](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getepochsizenumber)
* [getFirstBlockNumberForEpoch](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getfirstblocknumberforepoch)
* [getLastBlockNumberForEpoch](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getlastblocknumberforepoch)
* [getMinimumClientVersion](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getminimumclientversion)
* [getPastEvents](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getpastevents)
* [version](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#version)

## Constructors

###  constructor

\+ **new BlockchainParametersWrapper**(`connection`: Connection, `contract`: BlockchainParameters): *[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | BlockchainParameters |

**Returns:** *[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)*

## Properties

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *BlockchainParameters["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  getBlockGasLimit

• **getBlockGasLimit**: *function* = proxyCall(this.contract.methods.blockGasLimit, undefined, valueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L41)*

Getting the block gas limit.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getEpochNumber

• **getEpochNumber**: *function* = proxyCall(this.contract.methods.getEpochNumber, undefined, valueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:132](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L132)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getEpochSize

• **getEpochSize**: *function* = proxyCall(this.contract.methods.getEpochSize, undefined, valueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L134)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getIntrinsicGasForAlternativeFeeCurrency

• **getIntrinsicGasForAlternativeFeeCurrency**: *function* = proxyCall(
    this.contract.methods.intrinsicGasForAlternativeFeeCurrency,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L24)*

Get the extra intrinsic gas for transactions, where gas is paid using non-gold currency.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getUptimeLookbackWindow

• **getUptimeLookbackWindow**: *function* = proxyCall(
    this.contract.methods.getUptimeLookbackWindow,
    undefined,
    valueToInt
  )

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L82)*

Getting the uptime lookback window.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  methodIds

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L68)*

___

###  setBlockGasLimit

• **setBlockGasLimit**: *function* = proxySend(this.connection, this.contract.methods.setBlockGasLimit)

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L46)*

Setting the block gas limit.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setIntrinsicGasForAlternativeFeeCurrency

• **setIntrinsicGasForAlternativeFeeCurrency**: *function* = proxySend(
    this.connection,
    this.contract.methods.setIntrinsicGasForAlternativeFeeCurrency
  )

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L33)*

Setting the extra intrinsic gas for transactions, where gas is paid using non-gold currency.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setMinimumClientVersion

• **setMinimumClientVersion**: *function* = proxySend(
    this.connection,
    this.contract.methods.setMinimumClientVersion
  )

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L63)*

Set minimum client version.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setUptimeLookbackWindow

• **setUptimeLookbackWindow**: *function* = proxySend(
    this.connection,
    this.contract.methods.setUptimeLookbackWindow
  )

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L90)*

Setting the uptime lookback window.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[BlockchainParametersConfig](../interfaces/_wrappers_blockchainparameters_.blockchainparametersconfig.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L71)*

Returns current configuration parameters.

**Returns:** *Promise‹[BlockchainParametersConfig](../interfaces/_wrappers_blockchainparameters_.blockchainparametersconfig.md)›*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSizeNumber

▸ **getEpochSizeNumber**(): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L95)*

**Returns:** *Promise‹number›*

___

###  getFirstBlockNumberForEpoch

▸ **getFirstBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L111)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getMinimumClientVersion

▸ **getMinimumClientVersion**(): *Promise‹[ClientVersion](../interfaces/_wrappers_blockchainparameters_.clientversion.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BlockchainParameters.ts#L51)*

Get minimum client version.

**Returns:** *Promise‹[ClientVersion](../interfaces/_wrappers_blockchainparameters_.clientversion.md)›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹BlockchainParameters›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹BlockchainParameters› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
