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
* [getIntrinsicGasForAlternativeFeeCurrency](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getintrinsicgasforalternativefeecurrency)
* [methodIds](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#methodids)
* [setBlockGasLimit](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#setblockgaslimit)
* [setIntrinsicGasForAlternativeFeeCurrency](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#setintrinsicgasforalternativefeecurrency)
* [setMinimumClientVersion](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#setminimumclientversion)

### Accessors

* [address](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#address)

### Methods

* [getConfig](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getconfig)
* [getMinimumClientVersion](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getminimumclientversion)
* [getPastEvents](_wrappers_blockchainparameters_.blockchainparameterswrapper.md#getpastevents)

## Constructors

###  constructor

\+ **new BlockchainParametersWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: BlockchainParameters): *[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | BlockchainParameters |

**Returns:** *[BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)*

## Properties

###  eventTypes

• **eventTypes**: *object* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)*

#### Type declaration:

___

###  events

• **events**: *BlockchainParameters["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

___

###  getBlockGasLimit

• **getBlockGasLimit**: *function* = proxyCall(this.contract.methods.blockGasLimit, undefined, valueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/BlockchainParameters.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L41)*

Getting the block gas limit.

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

*Defined in [packages/contractkit/src/wrappers/BlockchainParameters.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L24)*

Get the extra intrinsic gas for transactions, where gas is paid using non-gold currency.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  methodIds

• **methodIds**: *object* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)*

#### Type declaration:

___

###  setBlockGasLimit

• **setBlockGasLimit**: *function* = proxySend(this.kit, this.contract.methods.setBlockGasLimit)

*Defined in [packages/contractkit/src/wrappers/BlockchainParameters.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L46)*

Setting the block gas limit.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setIntrinsicGasForAlternativeFeeCurrency

• **setIntrinsicGasForAlternativeFeeCurrency**: *function* = proxySend(
    this.kit,
    this.contract.methods.setIntrinsicGasForAlternativeFeeCurrency
  )

*Defined in [packages/contractkit/src/wrappers/BlockchainParameters.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L33)*

Setting the extra intrinsic gas for transactions, where gas is paid using non-gold currency.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setMinimumClientVersion

• **setMinimumClientVersion**: *function* = proxySend(this.kit, this.contract.methods.setMinimumClientVersion)

*Defined in [packages/contractkit/src/wrappers/BlockchainParameters.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L63)*

Set minimum client version.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[BlockchainParametersConfig](../interfaces/_wrappers_blockchainparameters_.blockchainparametersconfig.md)›*

*Defined in [packages/contractkit/src/wrappers/BlockchainParameters.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L68)*

Returns current configuration parameters.

**Returns:** *Promise‹[BlockchainParametersConfig](../interfaces/_wrappers_blockchainparameters_.blockchainparametersconfig.md)›*

___

###  getMinimumClientVersion

▸ **getMinimumClientVersion**(): *Promise‹[ClientVersion](../interfaces/_wrappers_blockchainparameters_.clientversion.md)›*

*Defined in [packages/contractkit/src/wrappers/BlockchainParameters.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BlockchainParameters.ts#L51)*

Get minimum client version.

**Returns:** *Promise‹[ClientVersion](../interfaces/_wrappers_blockchainparameters_.clientversion.md)›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹BlockchainParameters›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹BlockchainParameters› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*
