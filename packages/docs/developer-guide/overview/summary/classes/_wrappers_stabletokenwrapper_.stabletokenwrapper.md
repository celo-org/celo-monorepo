# StableTokenWrapper

Stable token with variable supply \(cUSD\)

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
* [events](_wrappers_stabletokenwrapper_.stabletokenwrapper.md#events)
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

### constructor

+ **new StableTokenWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: StableToken\): [_StableTokenWrapper_](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | StableToken |

**Returns:** [_StableTokenWrapper_](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)

## Properties

### allowance

• **allowance**: _function_ = proxyCall\(this.contract.methods.allowance, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L40)

Gets the amount of owner's StableToken allowed to be spent by spender.

**`param`** The owner of the StableToken.

**`param`** The spender of the StableToken.

**`returns`** The amount of StableToken owner is allowing spender to spend.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### approve

• **approve**: _function_ = proxySend\( this.kit, this.contract.methods.approve \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:161_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L161)

Approve a user to transfer StableToken on behalf of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The amount of StableToken approved to the spender.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ \(`spender`: string, `value`: string \| number\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `spender` | string |
| `value` | string \| number |

### balanceOf

• **balanceOf**: _function_ = proxyCall\( this.contract.methods.balanceOf, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L68)

Gets the balance of the specified address using the presently stored inflation factor.

**`param`** The address to query the balance of.

**`returns`** The balance of the specified address.

#### Type declaration:

▸ \(`owner`: string\): _Promise‹BigNumber›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `owner` | string |

### burn

• **burn**: _function_ = proxySend\(this.kit, this.contract.methods.burn\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:119_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L119)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### decimals

• **decimals**: _function_ = proxyCall\(this.contract.methods.decimals, undefined, valueToInt\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L55)

**`returns`** The number of decimal places to which StableToken is divisible.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### decreaseAllowance

• **decreaseAllowance**: _function_ = proxySend\(this.kit, this.contract.methods.decreaseAllowance\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L117)

Decreases the allowance of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The decrement of the amount of StableToken approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### increaseAllowance

• **increaseAllowance**: _function_ = proxySend\( this.kit, this.contract.methods.increaseAllowance, tupleParser\(stringIdentity, valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L106)

Increases the allowance of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The increment of the amount of StableToken approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### mint

• **mint**: _function_ = proxySend\(this.kit, this.contract.methods.mint\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:118_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L118)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### name

• **name**: _function_ = proxyCall\(this.contract.methods.name\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:45_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L45)

**`returns`** The name of the stable token.

#### Type declaration:

▸ \(\): _Promise‹string›_

### owner

• **owner**: _function_ = proxyCall\(this.contract.methods.owner\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:74_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L74)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setInflationParameters

• **setInflationParameters**: _function_ = proxySend\(this.kit, this.contract.methods.setInflationParameters\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:121_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L121)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### symbol

• **symbol**: _function_ = proxyCall\(this.contract.methods.symbol\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L50)

**`returns`** The symbol of the stable token.

#### Type declaration:

▸ \(\): _Promise‹string›_

### totalSupply

• **totalSupply**: _function_ = proxyCall\(this.contract.methods.totalSupply, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L61)

Returns the total supply of the token, that is, the amount of tokens currently minted.

**`returns`** Total supply.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transfer

• **transfer**: _function_ = proxySend\( this.kit, this.contract.methods.transfer \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:188_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L188)

Transfers `value` from `msg.sender` to `to`

**`param`** The address to transfer to.

**`param`** The amount to be transferred.

#### Type declaration:

▸ \(`to`: string, `value`: string \| number\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `to` | string |
| `value` | string \| number |

### transferFrom

• **transferFrom**: _function_ = proxySend\(this.kit, this.contract.methods.transferFrom\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:200_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L200)

Transfers StableToken from one address to another on behalf of a user.

**`param`** The address to transfer StableToken from.

**`param`** The address to transfer StableToken to.

**`param`** The amount of StableToken to transfer.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ \(`from`: string, `to`: string, `value`: string \| number\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | string |
| `to` | string |
| `value` | string \| number |

### transferWithComment

• **transferWithComment**: _function_ = proxySend\( this.kit, this.contract.methods.transferWithComment \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:173_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L173)

Transfer token for a specified address

**`param`** The address to transfer to.

**`param`** The amount to be transferred.

**`param`** The transfer comment.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ \(`to`: string, `value`: string \| number, `comment`: string\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `to` | string |
| `value` | string \| number |
| `comment` | string |

### unitsToValue

• **unitsToValue**: _function_ = proxyCall\( this.contract.methods.unitsToValue, tupleParser\(valueToString\), valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L94)

Returns the value of a given number of units given the current inflation factor.

**`param`** The units to convert to value.

**`returns`** The value corresponding to `units` given the current inflation factor.

#### Type declaration:

▸ \(`units`: BigNumber.Value\): _Promise‹BigNumber›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `units` | BigNumber.Value |

### valueToUnits

• **valueToUnits**: _function_ = proxyCall\( this.contract.methods.valueToUnits, tupleParser\(valueToString\), valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:83_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L83)

Returns the units for a given value given the current inflation factor.

**`param`** The value to convert to units.

**`returns`** The units corresponding to `value` given the current inflation factor.

**`dev`** We don't compute the updated inflationFactor here because we assume any function calling this will have updated the inflation factor.

#### Type declaration:

▸ \(`value`: BigNumber.Value\): _Promise‹BigNumber›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | BigNumber.Value |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_StableTokenConfig_](../interfaces/_wrappers_stabletokenwrapper_.stabletokenconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:140_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L140)

Returns current configuration parameters.

**Returns:** _Promise‹_[_StableTokenConfig_](../interfaces/_wrappers_stabletokenwrapper_.stabletokenconfig.md)_›_

### getInflationParameters

▸ **getInflationParameters**\(\): _Promise‹_[_InflationParameters_](../interfaces/_wrappers_stabletokenwrapper_.inflationparameters.md)_›_

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:127_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/StableTokenWrapper.ts#L127)

Querying the inflation parameters.

**Returns:** _Promise‹_[_InflationParameters_](../interfaces/_wrappers_stabletokenwrapper_.inflationparameters.md)_›_

Inflation rate, inflation factor, inflation update period and the last time factor was updated.

