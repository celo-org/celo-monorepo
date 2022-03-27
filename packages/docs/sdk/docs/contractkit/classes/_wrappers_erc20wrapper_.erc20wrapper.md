[@celo/contractkit](../README.md) › ["wrappers/Erc20Wrapper"](../modules/_wrappers_erc20wrapper_.md) › [Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md)

# Class: Erc20Wrapper <**T**>

ERC-20 contract only containing the non-optional functions

## Type parameters

▪ **T**: *Ierc20*

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹T›

  ↳ **Erc20Wrapper**

  ↳ [CeloTokenWrapper](_wrappers_celotokenwrapper_.celotokenwrapper.md)

## Index

### Constructors

* [constructor](_wrappers_erc20wrapper_.erc20wrapper.md#constructor)

### Properties

* [allowance](_wrappers_erc20wrapper_.erc20wrapper.md#allowance)
* [approve](_wrappers_erc20wrapper_.erc20wrapper.md#approve)
* [balanceOf](_wrappers_erc20wrapper_.erc20wrapper.md#balanceof)
* [eventTypes](_wrappers_erc20wrapper_.erc20wrapper.md#eventtypes)
* [events](_wrappers_erc20wrapper_.erc20wrapper.md#events)
* [methodIds](_wrappers_erc20wrapper_.erc20wrapper.md#methodids)
* [totalSupply](_wrappers_erc20wrapper_.erc20wrapper.md#totalsupply)
* [transfer](_wrappers_erc20wrapper_.erc20wrapper.md#transfer)
* [transferFrom](_wrappers_erc20wrapper_.erc20wrapper.md#transferfrom)

### Accessors

* [address](_wrappers_erc20wrapper_.erc20wrapper.md#address)

### Methods

* [getPastEvents](_wrappers_erc20wrapper_.erc20wrapper.md#getpastevents)
* [version](_wrappers_erc20wrapper_.erc20wrapper.md#version)

## Constructors

###  constructor

\+ **new Erc20Wrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: T): *[Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | T |

**Returns:** *[Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md)*

## Properties

###  allowance

• **allowance**: *function* = proxyCall(this.contract.methods.allowance, undefined, valueToBigNumber)

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

• **approve**: *function* = proxySend(this.kit, this.contract.methods.approve)

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

###  balanceOf

• **balanceOf**: *function* = proxyCall(
    this.contract.methods.balanceOf,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Erc20Wrapper.ts#L56)*

Gets the balance of the specified address.

**`param`** The address to query the balance of.

**`returns`** The balance of the specified address.

#### Type declaration:

▸ (`owner`: string): *Promise‹BigNumber›*

**Parameters:**

Name | Type |
------ | ------ |
`owner` | string |

___

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  events

• **events**: *T["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L59)*

___

###  methodIds

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L66)*

___

###  totalSupply

• **totalSupply**: *function* = proxyCall(this.contract.methods.totalSupply, undefined, valueToBigNumber)

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

• **transfer**: *function* = proxySend(this.kit, this.contract.methods.transfer)

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

• **transferFrom**: *function* = proxySend(this.kit, this.contract.methods.transferFrom)

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

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)*

Contract address

**Returns:** *string*

## Methods

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹T›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L55)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹T› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
