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

## Constructors

### constructor

+ **new StableTokenWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: StableToken\): [_StableTokenWrapper_](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | StableToken |

**Returns:** [_StableTokenWrapper_](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)

## Properties

### allowance

• **allowance**: _function_ = proxyCall\(this.contract.methods.allowance, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L42)

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

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:181_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L181)

Approve a user to transfer StableToken on behalf of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The amount of StableToken approved to the spender.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ \(`spender`: string, `value`: string \| number\): _CeloTransactionObject‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `spender` | string |
| `value` | string \| number |

### balanceOf

• **balanceOf**: _function_ = proxyCall\( this.contract.methods.balanceOf, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L70)

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

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:121_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L121)

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### decimals

• **decimals**: _function_ = proxyCall\(this.contract.methods.decimals, undefined, valueToInt\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:57_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L57)

**`returns`** The number of decimal places to which StableToken is divisible.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### decreaseAllowance

• **decreaseAllowance**: _function_ = proxySend\(this.kit, this.contract.methods.decreaseAllowance\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:119_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L119)

Decreases the allowance of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The decrement of the amount of StableToken approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_eventTypes_](_wrappers_basewrapper_.basewrapper.md#eventtypes)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _StableToken\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### increaseAllowance

• **increaseAllowance**: _function_ = proxySend\( this.kit, this.contract.methods.increaseAllowance, tupleParser\(stringIdentity, valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:108_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L108)

Increases the allowance of another user.

**`param`** The address which is being approved to spend StableToken.

**`param`** The increment of the amount of StableToken approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

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

### mint

• **mint**: _function_ = proxySend\(this.kit, this.contract.methods.mint\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L120)

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### name

• **name**: _function_ = proxyCall\(this.contract.methods.name\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L47)

**`returns`** The name of the stable token.

#### Type declaration:

▸ \(\): _Promise‹string›_

### owner

• **owner**: _function_ = proxyCall\(this.contract.methods.owner\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:76_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L76)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setInflationParameters

• **setInflationParameters**: _function_ = proxySend\(this.kit, this.contract.methods.setInflationParameters\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:123_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L123)

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### symbol

• **symbol**: _function_ = proxyCall\(this.contract.methods.symbol\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L52)

**`returns`** The symbol of the stable token.

#### Type declaration:

▸ \(\): _Promise‹string›_

### totalSupply

• **totalSupply**: _function_ = proxyCall\(this.contract.methods.totalSupply, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L63)

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

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:208_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L208)

Transfers `value` from `msg.sender` to `to`

**`param`** The address to transfer to.

**`param`** The amount to be transferred.

#### Type declaration:

▸ \(`to`: string, `value`: string \| number\): _CeloTransactionObject‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `to` | string |
| `value` | string \| number |

### transferFrom

• **transferFrom**: _function_ = proxySend\(this.kit, this.contract.methods.transferFrom\)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:220_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L220)

Transfers StableToken from one address to another on behalf of a user.

**`param`** The address to transfer StableToken from.

**`param`** The address to transfer StableToken to.

**`param`** The amount of StableToken to transfer.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ \(`from`: string, `to`: string, `value`: string \| number\): _CeloTransactionObject‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | string |
| `to` | string |
| `value` | string \| number |

### transferWithComment

• **transferWithComment**: _function_ = proxySend\( this.kit, this.contract.methods.transferWithComment \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:193_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L193)

Transfer token for a specified address

**`param`** The address to transfer to.

**`param`** The amount to be transferred.

**`param`** The transfer comment.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ \(`to`: string, `value`: string \| number, `comment`: string\): _CeloTransactionObject‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `to` | string |
| `value` | string \| number |
| `comment` | string |

### unitsToValue

• **unitsToValue**: _function_ = proxyCall\( this.contract.methods.unitsToValue, tupleParser\(valueToString\), valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:96_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L96)

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

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:85_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L85)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getConfig

▸ **getConfig**\(\): _Promise‹_[_StableTokenConfig_](../interfaces/_wrappers_stabletokenwrapper_.stabletokenconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:142_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L142)

Returns current configuration parameters.

**Returns:** _Promise‹_[_StableTokenConfig_](../interfaces/_wrappers_stabletokenwrapper_.stabletokenconfig.md)_›_

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:161_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L161)

**`dev`** Returns human readable configuration of the stabletoken contract

**Returns:** _Promise‹object›_

StableTokenConfig object

### getInflationParameters

▸ **getInflationParameters**\(\): _Promise‹_[_InflationParameters_](../interfaces/_wrappers_stabletokenwrapper_.inflationparameters.md)_›_

_Defined in_ [_contractkit/src/wrappers/StableTokenWrapper.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/StableTokenWrapper.ts#L129)

Querying the inflation parameters.

**Returns:** _Promise‹_[_InflationParameters_](../interfaces/_wrappers_stabletokenwrapper_.inflationparameters.md)_›_

Inflation rate, inflation factor, inflation update period and the last time factor was updated.

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹StableToken›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹StableToken› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

