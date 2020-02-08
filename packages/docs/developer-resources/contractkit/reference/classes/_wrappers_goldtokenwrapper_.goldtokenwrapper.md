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

###  constructor

\+ **new GoldTokenWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: GoldToken): *[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | GoldToken |

**Returns:** *[GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)*

## Properties

###  allowance

• **allowance**: *function* = proxyCall(this.contract.methods.allowance, undefined, valueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L20)*

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

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L51)*

Approve a user to transfer Celo Gold on behalf of another user.

**`param`** The address which is being approved to spend Celo Gold.

**`param`** The amount of Celo Gold approved to the spender.

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

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L37)*

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

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L65)*

Decreases the allowance of another user.

**`param`** The address which is being approved to spend Celo Gold.

**`param`** The decrement of the amount of Celo Gold approved to the spender.

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

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L58)*

Increases the allowance of another user.

**`param`** The address which is being approved to spend Celo Gold.

**`param`** The increment of the amount of Celo Gold approved to the spender.

**`returns`** true if success.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  name

• **name**: *function* = proxyCall(this.contract.methods.name, undefined, (a: any) => a.toString())

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L26)*

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

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L32)*

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

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L43)*

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

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L82)*

Transfers Celo Gold from one address to another.

**`param`** The address to transfer Celo Gold to.

**`param`** The amount of Celo Gold to transfer.

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

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L91)*

Transfers Celo Gold from one address to another on behalf of a user.

**`param`** The address to transfer Celo Gold from.

**`param`** The address to transfer Celo Gold to.

**`param`** The amount of Celo Gold to transfer.

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

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L74)*

Transfers Celo Gold from one address to another with a comment.

**`param`** The address to transfer Celo Gold to.

**`param`** The amount of Celo Gold to transfer.

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L18)*

Contract address

**Returns:** *string*

## Methods

###  balanceOf

▸ **balanceOf**(`account`: [Address](../modules/_base_.md#address)): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/GoldTokenWrapper.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/GoldTokenWrapper.ts#L98)*

Gets the balance of the specified address.

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹BigNumber‹››*

The balance of the specified address.
