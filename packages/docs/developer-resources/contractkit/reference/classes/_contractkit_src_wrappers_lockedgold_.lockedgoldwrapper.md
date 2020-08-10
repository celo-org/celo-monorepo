# Class: LockedGoldWrapper

Contract for handling deposits needed for voting.

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹LockedGold›

  ↳ **LockedGoldWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#constructor)

### Properties

* [_relock](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#_relock)
* [events](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#events)
* [getAccountNonvotingLockedGold](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#getaccountnonvotinglockedgold)
* [getAccountTotalLockedGold](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#getaccounttotallockedgold)
* [getTotalLockedGold](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#gettotallockedgold)
* [lock](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#lock)
* [unlock](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#unlock)
* [withdraw](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#withdraw)

### Accessors

* [address](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#address)

### Methods

* [computeInitialParametersForSlashing](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#computeinitialparametersforslashing)
* [computeParametersForSlashing](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#computeparametersforslashing)
* [getAccountSummary](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#getaccountsummary)
* [getAccountsSlashed](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#getaccountsslashed)
* [getConfig](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#getconfig)
* [getPastEvents](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#getpastevents)
* [getPendingWithdrawals](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#getpendingwithdrawals)
* [getPendingWithdrawalsTotalValue](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#getpendingwithdrawalstotalvalue)
* [relock](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md#relock)

## Constructors

###  constructor

\+ **new LockedGoldWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: LockedGold): *[LockedGoldWrapper](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | LockedGold |

**Returns:** *[LockedGoldWrapper](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md)*

## Properties

###  _relock

• **_relock**: *function* = proxySend(
    this.kit,
    this.contract.methods.relock,
    tupleParser(valueToString, valueToString)
  )

*Defined in [contractkit/src/wrappers/LockedGold.ts:140](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L140)*

Relocks gold that has been unlocked but not withdrawn.

**`param`** The index of the pending withdrawal to relock from.

**`param`** The value to relock from the specified pending withdrawal.

#### Type declaration:

▸ (`index`: number, `value`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |
`value` | BigNumber.Value |

___

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getAccountNonvotingLockedGold

• **getAccountNonvotingLockedGold**: *function* = proxyCall(
    this.contract.methods.getAccountNonvotingLockedGold,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/LockedGold.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L173)*

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

*Defined in [contractkit/src/wrappers/LockedGold.ts:151](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L151)*

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

###  getTotalLockedGold

• **getTotalLockedGold**: *function* = proxyCall(
    this.contract.methods.getTotalLockedGold,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/LockedGold.ts:162](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L162)*

Returns the total amount of locked gold in the system. Note that this does not include
  gold that has been unlocked but not yet withdrawn.

**`returns`** The total amount of locked gold in the system.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  lock

• **lock**: *function* = proxySend(this.kit, this.contract.methods.lock)

*Defined in [contractkit/src/wrappers/LockedGold.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L76)*

Locks gold to be used for voting.
The gold to be locked, must be specified as the `tx.value`

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

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

*Defined in [contractkit/src/wrappers/LockedGold.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L82)*

Unlocks gold that becomes withdrawable after the unlocking period.

**`param`** The amount of gold to unlock.

#### Type declaration:

▸ (`value`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

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

*Defined in [contractkit/src/wrappers/LockedGold.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L67)*

Withdraws a gold that has been unlocked after the unlocking period has passed.

**`param`** The index of the pending withdrawal to withdraw.

#### Type declaration:

▸ (`index`: number): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  computeInitialParametersForSlashing

▸ **computeInitialParametersForSlashing**(`account`: string, `penalty`: BigNumber): *Promise‹object›*

*Defined in [contractkit/src/wrappers/LockedGold.ts:248](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L248)*

Computes parameters for slashing `penalty` from `account`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | string | The account to slash. |
`penalty` | BigNumber | The amount to slash as penalty. |

**Returns:** *Promise‹object›*

List of (group, voting gold) to decrement from `account`.

___

###  computeParametersForSlashing

▸ **computeParametersForSlashing**(`account`: string, `penalty`: BigNumber, `groups`: AddressListItem[]): *Promise‹object›*

*Defined in [contractkit/src/wrappers/LockedGold.ts:255](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L255)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |
`penalty` | BigNumber |
`groups` | AddressListItem[] |

**Returns:** *Promise‹object›*

___

###  getAccountSummary

▸ **getAccountSummary**(`account`: string): *Promise‹AccountSummary›*

*Defined in [contractkit/src/wrappers/LockedGold.ts:189](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L189)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹AccountSummary›*

___

###  getAccountsSlashed

▸ **getAccountsSlashed**(`epochNumber`: number): *Promise‹[AccountSlashed](../interfaces/_contractkit_src_wrappers_lockedgold_.accountslashed.md)[]›*

*Defined in [contractkit/src/wrappers/LockedGold.ts:226](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L226)*

Retrieves AccountSlashed for epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve AccountSlashed at.  |

**Returns:** *Promise‹[AccountSlashed](../interfaces/_contractkit_src_wrappers_lockedgold_.accountslashed.md)[]›*

___

###  getConfig

▸ **getConfig**(): *Promise‹[LockedGoldConfig](../interfaces/_contractkit_src_wrappers_lockedgold_.lockedgoldconfig.md)›*

*Defined in [contractkit/src/wrappers/LockedGold.ts:182](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L182)*

Returns current configuration parameters.

**Returns:** *Promise‹[LockedGoldConfig](../interfaces/_contractkit_src_wrappers_lockedgold_.lockedgoldconfig.md)›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: string, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_contractkit_src_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L29)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getPendingWithdrawals

▸ **getPendingWithdrawals**(`account`: string): *Promise‹[PendingWithdrawal](../interfaces/_contractkit_src_wrappers_lockedgold_.pendingwithdrawal.md)[]›*

*Defined in [contractkit/src/wrappers/LockedGold.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L210)*

Returns the pending withdrawals from unlocked gold for an account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | string | The address of the account. |

**Returns:** *Promise‹[PendingWithdrawal](../interfaces/_contractkit_src_wrappers_lockedgold_.pendingwithdrawal.md)[]›*

The value and timestamp for each pending withdrawal.

___

###  getPendingWithdrawalsTotalValue

▸ **getPendingWithdrawalsTotalValue**(`account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/LockedGold.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹BigNumber‹››*

___

###  relock

▸ **relock**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `value`: BigNumber.Value): *Promise‹Array‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

*Defined in [contractkit/src/wrappers/LockedGold.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L100)*

Relocks gold that has been unlocked but not withdrawn.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | - |
`value` | BigNumber.Value | The value to relock from pending withdrawals.  |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›››*
