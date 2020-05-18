# GoldTokenWrapper

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
* [events](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#events)
* [increaseAllowance](_wrappers_goldtokenwrapper_.goldtokenwrapper.md#increaseallowance)
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

## Constructors

### constructor

+ **new GoldTokenWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: GoldToken\): [_GoldTokenWrapper_](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | GoldToken |

**Returns:** [_GoldTokenWrapper_](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)

## Properties

### allowance

• **allowance**: _function_ = proxyCall\(this.contract.methods.allowance, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L28)

Querying allowance.

**`param`** Account who has given the allowance.

**`param`** Address of account to whom the allowance was given.

**`returns`** Amount of allowance.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### approve

• **approve**: _function_ = proxySend\(this.kit, this.contract.methods.approve\)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L59)

Approve a user to transfer Celo Gold on behalf of another user.

**`param`** The address which is being approved to spend Celo Gold.

**`param`** The amount of Celo Gold approved to the spender.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### decimals

• **decimals**: _function_ = proxyCall\(this.contract.methods.decimals, undefined, valueToInt\)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:45_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L45)

Returns the number of decimals used in the token.

**`returns`** Number of decimals.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### decreaseAllowance

• **decreaseAllowance**: _function_ = proxySend\(this.kit, this.contract.methods.decreaseAllowance\)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:77_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L77)

Decreases the allowance of another user.

**`param`** The address which is being approved to spend Celo Gold.

**`param`** The decrement of the amount of Celo Gold approved to the spender.

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

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:66_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L66)

Increases the allowance of another user.

**`param`** The address which is being approved to spend Celo Gold.

**`param`** The increment of the amount of Celo Gold approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### name

• **name**: _function_ = proxyCall\(this.contract.methods.name, undefined, \(a: any\) =&gt; a.toString\(\)\)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:34_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L34)

Returns the name of the token.

**`returns`** Name of the token.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### symbol

• **symbol**: _function_ = proxyCall\(this.contract.methods.symbol, undefined, \(a: any\) =&gt; a.toString\(\)\)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L40)

Returns the three letter symbol of the token.

**`returns`** Symbol of the token.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### totalSupply

• **totalSupply**: _function_ = proxyCall\(this.contract.methods.totalSupply, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L51)

Returns the total supply of the token, that is, the amount of tokens currently minted.

**`returns`** Total supply.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transfer

• **transfer**: _function_ = proxySend\(this.kit, this.contract.methods.transfer\)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L94)

Transfers Celo Gold from one address to another.

**`param`** The address to transfer Celo Gold to.

**`param`** The amount of Celo Gold to transfer.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transferFrom

• **transferFrom**: _function_ = proxySend\(this.kit, this.contract.methods.transferFrom\)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:103_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L103)

Transfers Celo Gold from one address to another on behalf of a user.

**`param`** The address to transfer Celo Gold from.

**`param`** The address to transfer Celo Gold to.

**`param`** The amount of Celo Gold to transfer.

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### transferWithComment

• **transferWithComment**: _function_ = proxySend\(this.kit, this.contract.methods.transferWithComment\)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:86_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L86)

Transfers Celo Gold from one address to another with a comment.

**`param`** The address to transfer Celo Gold to.

**`param`** The amount of Celo Gold to transfer.

**`param`** The transfer comment

**`returns`** True if the transaction succeeds.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### balanceOf

▸ **balanceOf**\(`account`: [Address](../external-modules/_base_.md#address)\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:110_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L110)

Gets the balance of the specified address.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](../external-modules/_base_.md#address) |

**Returns:** _Promise‹BigNumber‹››_

The balance of the specified address.

