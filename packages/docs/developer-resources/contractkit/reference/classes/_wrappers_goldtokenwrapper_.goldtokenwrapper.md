# Class: GoldTokenWrapper

ERC-20 contract for Celo native currency.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹GoldToken›

  ↳ **GoldTokenWrapper**

## Index

### Constructors

* [constructor](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#constructor)

### Properties

* [allowance](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#allowance)
* [approve](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#approve)
* [decimals](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#decimals)
* [decreaseAllowance](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#decreaseallowance)
* [eventTypes](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#eventtypes)
* [events](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#events)
* [increaseAllowance](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#increaseallowance)
* [methodIds](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#methodids)
* [name](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#name)
* [symbol](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#symbol)
* [totalSupply](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#totalsupply)
* [transfer](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#transfer)
* [transferFrom](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#transferfrom)
* [transferWithComment](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#transferwithcomment)

### Accessors

* [address](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#address)

### Methods

* [balanceOf](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#balanceof)
* [getPastEvents](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#getpastevents)

## Constructors

###  constructor

\+ **new GoldTokenWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: GoldToken): *[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | GoldToken |

**Returns:** *[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)*

## Properties

###  allowance

• **allowance**: *function* = proxyCall(this.contract.methods.allowance, undefined, valueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L28)*

Querying allowance.

**`param`** Account who has given the allowance.

**`param`** Address of account to whom the allowance was given.

**`returns`** Amount of allowance.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  approve

• **approve**: *function* = proxySend(this.kit, this.contract.methods.approve)

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L59)*

Approve a user to transfer CELO on behalf of another user.

**`param`** The address which is being approved to spend CELO.

**`param`** The amount of CELO approved to the spender.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  decimals

• **decimals**: *function* = proxyCall(this.contract.methods.decimals, undefined, valueToInt)

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L45)*

Returns the number of decimals used in the token.

**`returns`** Number of decimals.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  decreaseAllowance

• **decreaseAllowance**: *function* = proxySend(this.kit, this.contract.methods.decreaseAllowance)

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L77)*

Decreases the allowance of another user.

**`param`** The address which is being approved to spend CELO.

**`param`** The decrement of the amount of CELO approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

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

• **events**: *GoldToken["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

___

###  increaseAllowance

• **increaseAllowance**: *function* = proxySend(
    this.kit,
    this.contract.methods.increaseAllowance,
    tupleParser(stringIdentity, valueToString)
  )

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L66)*

Increases the allowance of another user.

**`param`** The address which is being approved to spend CELO.

**`param`** The increment of the amount of CELO approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

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

###  name

• **name**: *function* = proxyCall(this.contract.methods.name, undefined, (a: any) => a.toString())

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L34)*

Returns the name of the token.

**`returns`** Name of the token.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  symbol

• **symbol**: *function* = proxyCall(this.contract.methods.symbol, undefined, (a: any) => a.toString())

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L40)*

Returns the three letter symbol of the token.

**`returns`** Symbol of the token.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  totalSupply

• **totalSupply**: *function* = proxyCall(this.contract.methods.totalSupply, undefined, valueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L51)*

Returns the total supply of the token, that is, the amount of tokens currently minted.

**`returns`** Total supply.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transfer

• **transfer**: *function* = proxySend(this.kit, this.contract.methods.transfer)

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L94)*

Transfers CELO from one address to another.

**`param`** The address to transfer CELO to.

**`param`** The amount of CELO to transfer.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transferFrom

• **transferFrom**: *function* = proxySend(this.kit, this.contract.methods.transferFrom)

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L103)*

Transfers CELO from one address to another on behalf of a user.

**`param`** The address to transfer CELO from.

**`param`** The address to transfer CELO to.

**`param`** The amount of CELO to transfer.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transferWithComment

• **transferWithComment**: *function* = proxySend(this.kit, this.contract.methods.transferWithComment)

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L86)*

Transfers CELO from one address to another with a comment.

**`param`** The address to transfer CELO to.

**`param`** The amount of CELO to transfer.

**`param`** The transfer comment

**`returns`** True if the transaction succeeds.

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

###  balanceOf

▸ **balanceOf**(`account`: [Address](../modules/_base_.md#address)): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L110)*

Gets the balance of the specified address.

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹BigNumber‹››*

The balance of the specified address.

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹GoldToken›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹GoldToken› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*
