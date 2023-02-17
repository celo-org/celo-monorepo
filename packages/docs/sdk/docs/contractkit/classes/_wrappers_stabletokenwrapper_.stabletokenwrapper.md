[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/StableTokenWrapper"](../modules/_wrappers_stabletokenwrapper_.md) › [StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)

# Class: StableTokenWrapper

Stable token with variable supply

## Hierarchy

  ↳ [CeloTokenWrapper](_wrappers_celotokenwrapper_.celotokenwrapper.md)‹StableToken›

  ↳ **StableTokenWrapper**

## Index

### Constructors

* [constructor](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#constructor)

### Properties

* [allowance](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#allowance)
* [approve](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#approve)
* [balanceOf](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#balanceof)
* [burn](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#burn)
* [decimals](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#decimals)
* [decreaseAllowance](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#decreaseallowance)
* [eventTypes](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#eventtypes)
* [events](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#events)
* [increaseAllowance](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#increaseallowance)
* [methodIds](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#methodids)
* [mint](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#mint)
* [name](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#name)
* [owner](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#owner)
* [setInflationParameters](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#setinflationparameters)
* [symbol](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#symbol)
* [totalSupply](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#totalsupply)
* [transfer](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#transfer)
* [transferFrom](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#transferfrom)
* [transferWithComment](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#transferwithcomment)
* [unitsToValue](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#unitstovalue)
* [valueToUnits](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#valuetounits)

### Accessors

* [address](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#address)

### Methods

* [getConfig](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#getconfig)
* [getHumanReadableConfig](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#gethumanreadableconfig)
* [getInflationParameters](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#getinflationparameters)
* [getPastEvents](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#getpastevents)
* [version](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#version)

## Constructors

###  constructor

\+ **new StableTokenWrapper**(`connection`: Connection, `contract`: StableToken): *[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | StableToken |

**Returns:** *[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)*

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

###  balanceOf

• **balanceOf**: *function* = proxyCall(
    this.contract.methods.balanceOf,
    undefined,
    valueToBigNumber
  )

*Inherited from [Erc20Wrapper](_wrappers_erc20wrapper_.erc20wrapper.md).[balanceOf](_wrappers_erc20wrapper_.erc20wrapper.md#balanceof)*

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

###  burn

• **burn**: *function* = proxySend(this.connection, this.contract.methods.burn)

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L83)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L81)*

Decreases the allowance of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The decrement of the amount of StableToken approved to the spender.

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

• **events**: *StableToken["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  increaseAllowance

• **increaseAllowance**: *function* = proxySend(
    this.connection,
    this.contract.methods.increaseAllowance,
    tupleParser(stringIdentity, valueToString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L70)*

Increases the allowance of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The increment of the amount of StableToken approved to the spender.

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

###  mint

• **mint**: *function* = proxySend(this.connection, this.contract.methods.mint)

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L82)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

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

###  owner

• **owner**: *function* = proxyCall(this.contract.methods.owner)

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L38)*

Returns the address of the owner of the contract.

**`returns`** the address of the owner of the contract.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setInflationParameters

• **setInflationParameters**: *function* = proxySend(this.connection, this.contract.methods.setInflationParameters)

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L85)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

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

___

###  unitsToValue

• **unitsToValue**: *function* = proxyCall(
    this.contract.methods.unitsToValue,
    tupleParser(valueToString),
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L58)*

Returns the value of a given number of units given the current inflation factor.

**`param`** The units to convert to value.

**`returns`** The value corresponding to `units` given the current inflation factor.

#### Type declaration:

▸ (`units`: BigNumber.Value): *Promise‹BigNumber›*

**Parameters:**

Name | Type |
------ | ------ |
`units` | BigNumber.Value |

___

###  valueToUnits

• **valueToUnits**: *function* = proxyCall(
    this.contract.methods.valueToUnits,
    tupleParser(valueToString),
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L47)*

Returns the units for a given value given the current inflation factor.

**`param`** The value to convert to units.

**`returns`** The units corresponding to `value` given the current inflation factor.

**`dev`** We don't compute the updated inflationFactor here because
we assume any function calling this will have updated the inflation factor.

#### Type declaration:

▸ (`value`: BigNumber.Value): *Promise‹BigNumber›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | BigNumber.Value |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[StableTokenConfig](../interfaces/_wrappers_stabletokenwrapper_.stabletokenconfig.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L104)*

Returns current configuration parameters.

**Returns:** *Promise‹[StableTokenConfig](../interfaces/_wrappers_stabletokenwrapper_.stabletokenconfig.md)›*

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L123)*

**`dev`** Returns human readable configuration of the stabletoken contract

**Returns:** *Promise‹object›*

StableTokenConfig object

___

###  getInflationParameters

▸ **getInflationParameters**(): *Promise‹[InflationParameters](../interfaces/_wrappers_stabletokenwrapper_.inflationparameters.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L91)*

Querying the inflation parameters.

**Returns:** *Promise‹[InflationParameters](../interfaces/_wrappers_stabletokenwrapper_.inflationparameters.md)›*

Inflation rate, inflation factor, inflation update period and the last time factor was updated.

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹StableToken›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹StableToken› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
