[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/GoldTokenWrapper"](../modules/_wrappers_goldtokenwrapper_.md) › [GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)

# Class: GoldTokenWrapper

ERC-20 contract for Celo native currency.

## Hierarchy

  ↳ [CeloTokenWrapper](_wrappers_celotokenwrapper_.celotokenwrapper.md)‹GoldToken›

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
* [version](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#version)

## Constructors

###  constructor

\+ **new GoldTokenWrapper**(`connection`: Connection, `contract`: GoldToken): *[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | GoldToken |

**Returns:** *[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)*

## Properties

###  allowance

• **allowance**: *function* = proxyCall(this.contract.methods.allowance, undefined, valueToBigNumber)

*Inherited from [Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md).[allowance](_wrappers_erc20wrapper_.erc20wrapper.md#allowance)*

*Defined in [packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts#L18)*

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

• **approve**: *function* = proxySend(this.connection, this.contract.methods.approve)

*Inherited from [Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md).[approve](_wrappers_erc20wrapper_.erc20wrapper.md#approve)*

*Defined in [packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts#L32)*

Approve a user to transfer the token on behalf of another user.

**`param`** The address which is being approved to spend the token.

**`param`** The amount of the token approved to the spender.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  decimals

• **decimals**: *function* = proxyCall(this.contract.methods.decimals, undefined, valueToInt)

*Inherited from [CeloTokenWrapper](_wrappers_celotokenwrapper_.celotokenwrapper.md).[decimals](_wrappers_celotokenwrapper_.celotokenwrapper.md#decimals)*

*Defined in [packages/sdk/contractkit/src/wrappers/CeloTokenWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/CeloTokenWrapper.ts#L29)*

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

• **decreaseAllowance**: *function* = proxySend(this.connection, this.contract.methods.decreaseAllowance)

*Defined in [packages/sdk/contractkit/src/wrappers/GoldTokenWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GoldTokenWrapper.ts#L37)*

Decreases the allowance of another user.

**`param`** The address which is being approved to spend CELO.

**`param`** The decrement of the amount of CELO approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *GoldToken["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  increaseAllowance

• **increaseAllowance**: *function* = proxySend(
    this.connection,
    this.contract.methods.increaseAllowance,
    tupleParser(stringIdentity, valueToString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/GoldTokenWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GoldTokenWrapper.ts#L26)*

Increases the allowance of another user.

**`param`** The address which is being approved to spend CELO.

**`param`** The increment of the amount of CELO approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

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

###  name

• **name**: *function* = proxyCall(this.contract.methods.name)

*Inherited from [CeloTokenWrapper](_wrappers_celotokenwrapper_.celotokenwrapper.md).[name](_wrappers_celotokenwrapper_.celotokenwrapper.md#name)*

*Defined in [packages/sdk/contractkit/src/wrappers/CeloTokenWrapper.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/CeloTokenWrapper.ts#L18)*

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

• **symbol**: *function* = proxyCall(this.contract.methods.symbol)

*Inherited from [CeloTokenWrapper](_wrappers_celotokenwrapper_.celotokenwrapper.md).[symbol](_wrappers_celotokenwrapper_.celotokenwrapper.md#symbol)*

*Defined in [packages/sdk/contractkit/src/wrappers/CeloTokenWrapper.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/CeloTokenWrapper.ts#L24)*

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

*Inherited from [Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md).[totalSupply](_wrappers_erc20wrapper_.erc20wrapper.md#totalsupply)*

*Defined in [packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts#L24)*

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

• **transfer**: *function* = proxySend(this.connection, this.contract.methods.transfer)

*Inherited from [Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md).[transfer](_wrappers_erc20wrapper_.erc20wrapper.md#transfer)*

*Defined in [packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts#L40)*

Transfers the token from one address to another.

**`param`** The address to transfer the token to.

**`param`** The amount of the token to transfer.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transferFrom

• **transferFrom**: *function* = proxySend(this.connection, this.contract.methods.transferFrom)

*Inherited from [Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md).[transferFrom](_wrappers_erc20wrapper_.erc20wrapper.md#transferfrom)*

*Defined in [packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts#L49)*

Transfers the token from one address to another on behalf of a user.

**`param`** The address to transfer the token from.

**`param`** The address to transfer the token to.

**`param`** The amount of the token to transfer.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  transferWithComment

• **transferWithComment**: *function* = proxySend(this.connection, this.contract.methods.transferWithComment)

*Inherited from [CeloTokenWrapper](_wrappers_celotokenwrapper_.celotokenwrapper.md).[transferWithComment](_wrappers_celotokenwrapper_.celotokenwrapper.md#transferwithcomment)*

*Defined in [packages/sdk/contractkit/src/wrappers/CeloTokenWrapper.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/CeloTokenWrapper.ts#L38)*

Transfers the token from one address to another with a comment.

**`param`** The address to transfer the token to.

**`param`** The amount of the token to transfer.

**`param`** The transfer comment

**`returns`** True if the transaction succeeds.

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

###  balanceOf

▸ **balanceOf**(`account`: Address): *Promise‹BigNumber‹››*

*Overrides [Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md).[balanceOf](_wrappers_erc20wrapper_.erc20wrapper.md#balanceof)*

*Defined in [packages/sdk/contractkit/src/wrappers/GoldTokenWrapper.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/GoldTokenWrapper.ts#L47)*

Gets the balance of the specified address.
WARNING: The actual call to the Gold contract of the balanceOf:
`balanceOf = proxyCall(this.contract.methods.balanceOf, undefined, valueToBigNumber)`
has issues with web3. Keep the one calling getBalance

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *Promise‹BigNumber‹››*

The balance of the specified address.

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹GoldToken›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹GoldToken› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
