# GoldTokenWrapper

ERC-20 contract for Celo native currency.

## Hierarchy

* [BaseWrapper]()‹GoldToken›

  ↳ **GoldTokenWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [allowance]()
* [approve]()
* [decimals]()
* [decreaseAllowance]()
* [events]()
* [increaseAllowance]()
* [name]()
* [symbol]()
* [totalSupply]()
* [transfer]()
* [transferFrom]()
* [transferWithComment]()

### Accessors

* [address]()

### Methods

* [balanceOf]()

## Constructors

### constructor

+ **new GoldTokenWrapper**\(`kit`: [ContractKit](), `contract`: GoldToken\): [_GoldTokenWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | GoldToken |

**Returns:** [_GoldTokenWrapper_]()

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

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

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

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### increaseAllowance

• **increaseAllowance**: _function_ = proxySend\( this.kit, this.contract.methods.increaseAllowance, tupleParser\(stringIdentity, valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:66_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L66)

Increases the allowance of another user.

**`param`** The address which is being approved to spend Celo Gold.

**`param`** The increment of the amount of Celo Gold approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

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

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

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

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

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

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### balanceOf

▸ **balanceOf**\(`account`: [Address](_base_.md#address)\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/GoldTokenWrapper.ts:110_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L110)

Gets the balance of the specified address.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |

**Returns:** _Promise‹BigNumber‹››_

The balance of the specified address.

