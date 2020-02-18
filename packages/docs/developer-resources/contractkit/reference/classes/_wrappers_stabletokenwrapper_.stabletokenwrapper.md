# Class: StableTokenWrapper

Stable token with variable supply (cUSD)

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹StableToken›

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
* [increaseAllowance](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#increaseallowance)
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
* [getInflationParameters](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#getinflationparameters)

## Constructors

###  constructor

\+ **new StableTokenWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: StableToken): *[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | StableToken |

**Returns:** *[StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)*

## Properties

###  allowance

• **allowance**: *function* = proxyCall(this.contract.methods.allowance, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L39)*

Gets the amount of owner's StableToken allowed to be spent by spender.

**`param`** The owner of the StableToken.

**`param`** The spender of the StableToken.

**`returns`** The amount of StableToken owner is allowing spender to spend.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  approve

• **approve**: *function* = proxySend(
    this.kit,
    this.contract.methods.approve
  )

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L156)*

Approve a user to transfer StableToken on behalf of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The amount of StableToken approved to the spender.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ (`spender`: string, `value`: string | number): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`spender` | string |
`value` | string &#124; number |

___

###  balanceOf

• **balanceOf**: *function* = proxyCall(
    this.contract.methods.balanceOf,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L67)*

Gets the balance of the specified address using the presently stored inflation factor.

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

• **burn**: *function* = proxySend(this.kit, this.contract.methods.burn)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L114)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  decimals

• **decimals**: *function* = proxyCall(this.contract.methods.decimals, undefined, valueToInt)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L54)*

**`returns`** The number of decimal places to which StableToken is divisible.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  decreaseAllowance

• **decreaseAllowance**: *function* = proxySend(this.kit, this.contract.methods.decreaseAllowance)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L112)*

Decreases the allowance of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The decrement of the amount of StableToken approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  increaseAllowance

• **increaseAllowance**: *function* = proxySend(this.kit, this.contract.methods.increaseAllowance)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L105)*

Increases the allowance of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The increment of the amount of StableToken approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  mint

• **mint**: *function* = proxySend(this.kit, this.contract.methods.mint)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L113)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  name

• **name**: *function* = proxyCall(this.contract.methods.name)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L44)*

**`returns`** The name of the stable token.

#### Type declaration:

▸ (): *Promise‹string›*

___

###  owner

• **owner**: *function* = proxyCall(this.contract.methods.owner)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L73)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setInflationParameters

• **setInflationParameters**: *function* = proxySend(this.kit, this.contract.methods.setInflationParameters)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L116)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  symbol

• **symbol**: *function* = proxyCall(this.contract.methods.symbol)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L49)*

**`returns`** The symbol of the stable token.

#### Type declaration:

▸ (): *Promise‹string›*

___

###  totalSupply

• **totalSupply**: *function* = proxyCall(this.contract.methods.totalSupply, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L60)*

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

• **transfer**: *function* = proxySend(
    this.kit,
    this.contract.methods.transfer
  )

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:183](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L183)*

Transfers `value` from `msg.sender` to `to`

**`param`** The address to transfer to.

**`param`** The amount to be transferred.

#### Type declaration:

▸ (`to`: string, `value`: string | number): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`to` | string |
`value` | string &#124; number |

___

###  transferFrom

• **transferFrom**: *function* = proxySend(this.kit, this.contract.methods.transferFrom)

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:195](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L195)*

Transfers StableToken from one address to another on behalf of a user.

**`param`** The address to transfer StableToken from.

**`param`** The address to transfer StableToken to.

**`param`** The amount of StableToken to transfer.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ (`from`: string, `to`: string, `value`: string | number): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`from` | string |
`to` | string |
`value` | string &#124; number |

___

###  transferWithComment

• **transferWithComment**: *function* = proxySend(
    this.kit,
    this.contract.methods.transferWithComment
  )

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:168](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L168)*

Transfer token for a specified address

**`param`** The address to transfer to.

**`param`** The amount to be transferred.

**`param`** The transfer comment.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ (`to`: string, `value`: string | number, `comment`: string): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`to` | string |
`value` | string &#124; number |
`comment` | string |

___

###  unitsToValue

• **unitsToValue**: *function* = proxyCall(
    this.contract.methods.unitsToValue,
    tupleParser(valueToString),
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L93)*

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

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L82)*

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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L18)*

Contract address

**Returns:** *string*

## Methods

###  getConfig

▸ **getConfig**(): *Promise‹[StableTokenConfig](../interfaces/_wrappers_stabletokenwrapper_.stabletokenconfig.md)›*

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L135)*

Returns current configuration parameters.

**Returns:** *Promise‹[StableTokenConfig](../interfaces/_wrappers_stabletokenwrapper_.stabletokenconfig.md)›*

___

###  getInflationParameters

▸ **getInflationParameters**(): *Promise‹[InflationParameters](../interfaces/_wrappers_stabletokenwrapper_.inflationparameters.md)›*

*Defined in [contractkit/src/wrappers/StableTokenWrapper.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L122)*

Querying the inflation parameters.

**Returns:** *Promise‹[InflationParameters](../interfaces/_wrappers_stabletokenwrapper_.inflationparameters.md)›*

Inflation rate, inflation factor, inflation update period and the last time factor was updated.
