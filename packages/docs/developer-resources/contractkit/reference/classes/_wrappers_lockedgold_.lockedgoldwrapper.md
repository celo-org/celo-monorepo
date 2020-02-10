# Class: LockedGoldWrapper

Contract for handling deposits needed for voting.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹LockedGold›

  ↳ **LockedGoldWrapper**

## Index

### Constructors

* [constructor](_wrappers_lockedgold_.lockedgoldwrapper.md#constructor)

### Properties

* [_relock](_wrappers_lockedgold_.lockedgoldwrapper.md#_relock)
* [getAccountNonvotingLockedGold](_wrappers_lockedgold_.lockedgoldwrapper.md#getaccountnonvotinglockedgold)
* [getAccountTotalLockedGold](_wrappers_lockedgold_.lockedgoldwrapper.md#getaccounttotallockedgold)
* [lock](_wrappers_lockedgold_.lockedgoldwrapper.md#lock)
* [unlock](_wrappers_lockedgold_.lockedgoldwrapper.md#unlock)
* [withdraw](_wrappers_lockedgold_.lockedgoldwrapper.md#withdraw)

### Accessors

* [address](_wrappers_lockedgold_.lockedgoldwrapper.md#address)

### Methods

* [computeParametersForSlashing](_wrappers_lockedgold_.lockedgoldwrapper.md#computeparametersforslashing)
* [getAccountSummary](_wrappers_lockedgold_.lockedgoldwrapper.md#getaccountsummary)
* [getAccountsSlashed](_wrappers_lockedgold_.lockedgoldwrapper.md#getaccountsslashed)
* [getConfig](_wrappers_lockedgold_.lockedgoldwrapper.md#getconfig)
* [getPendingWithdrawals](_wrappers_lockedgold_.lockedgoldwrapper.md#getpendingwithdrawals)
* [getPendingWithdrawalsTotalValue](_wrappers_lockedgold_.lockedgoldwrapper.md#getpendingwithdrawalstotalvalue)
* [relock](_wrappers_lockedgold_.lockedgoldwrapper.md#relock)

## Constructors

###  constructor

\+ **new LockedGoldWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: LockedGold): *[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | LockedGold |

**Returns:** *[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)*

## Properties

###  _relock

• **_relock**: *function* = proxySend(
    this.kit,
    this.contract.methods.relock,
    tupleParser(valueToString, valueToString)
  )

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:130](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L130)*

Relocks gold that has been unlocked but not withdrawn.

**`param`** The index of the pending withdrawal to relock from.

**`param`** The value to relock from the specified pending withdrawal.

#### Type declaration:

▸ (`index`: number, `value`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |
`value` | BigNumber.Value |

___

###  getAccountNonvotingLockedGold

• **getAccountNonvotingLockedGold**: *function* = proxyCall(
    this.contract.methods.getAccountNonvotingLockedGold,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L152)*

Returns the total amount of non-voting locked gold for an account.

**`param`** The account.

**`returns`** The total amount of non-voting locked gold for an account.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getAccountTotalLockedGold

• **getAccountTotalLockedGold**: *function* = proxyCall(
    this.contract.methods.getAccountTotalLockedGold,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:141](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L141)*

Returns the total amount of locked gold for an account.

**`param`** The account.

**`returns`** The total amount of locked gold for an account.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  lock

• **lock**: *function* = proxySend(this.kit, this.contract.methods.lock)

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L66)*

Locks gold to be used for voting.
The gold to be locked, must be specified as the `tx.value`

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  unlock

• **unlock**: *function* = proxySend(
    this.kit,
    this.contract.methods.unlock,
    tupleParser(valueToString)
  )

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L72)*

Unlocks gold that becomes withdrawable after the unlocking period.

**`param`** The amount of gold to unlock.

#### Type declaration:

▸ (`value`: BigNumber.Value): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | BigNumber.Value |

___

###  withdraw

• **withdraw**: *function* = proxySend(
    this.kit,
    this.contract.methods.withdraw
  )

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L57)*

Withdraws a gold that has been unlocked after the unlocking period has passed.

**`param`** The index of the pending withdrawal to withdraw.

#### Type declaration:

▸ (`index`: number): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L18)*

Contract address

**Returns:** *string*

## Methods

###  computeParametersForSlashing

▸ **computeParametersForSlashing**(`account`: string, `penalty`: BigNumber): *Promise‹object›*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:226](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L226)*

Computes parameters for slashing `penalty` from `account`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | string | The account to slash. |
`penalty` | BigNumber | The amount to slash as penalty. |

**Returns:** *Promise‹object›*

List of (group, voting gold) to decrement from `account`.

___

###  getAccountSummary

▸ **getAccountSummary**(`account`: string): *Promise‹AccountSummary›*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L167)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹AccountSummary›*

___

###  getAccountsSlashed

▸ **getAccountsSlashed**(`epochNumber`: number): *Promise‹[AccountSlashed](../interfaces/_wrappers_lockedgold_.accountslashed.md)[]›*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:204](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L204)*

Retrieves AccountSlashed for epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve AccountSlashed at.  |

**Returns:** *Promise‹[AccountSlashed](../interfaces/_wrappers_lockedgold_.accountslashed.md)[]›*

___

###  getConfig

▸ **getConfig**(): *Promise‹[LockedGoldConfig](../interfaces/_wrappers_lockedgold_.lockedgoldconfig.md)›*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:161](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L161)*

Returns current configuration parameters.

**Returns:** *Promise‹[LockedGoldConfig](../interfaces/_wrappers_lockedgold_.lockedgoldconfig.md)›*

___

###  getPendingWithdrawals

▸ **getPendingWithdrawals**(`account`: string): *Promise‹PendingWithdrawal[]›*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:188](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L188)*

Returns the pending withdrawals from unlocked gold for an account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | string | The address of the account. |

**Returns:** *Promise‹PendingWithdrawal[]›*

The value and timestamp for each pending withdrawal.

___

###  getPendingWithdrawalsTotalValue

▸ **getPendingWithdrawalsTotalValue**(`account`: [Address](../modules/_base_.md#address)): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹BigNumber‹››*

___

###  relock

▸ **relock**(`account`: [Address](../modules/_base_.md#address), `value`: BigNumber.Value): *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L90)*

Relocks gold that has been unlocked but not withdrawn.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_base_.md#address) | - |
`value` | BigNumber.Value | The value to relock from pending withdrawals.  |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›››*
