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
* [eventTypes](_wrappers_lockedgold_.lockedgoldwrapper.md#eventtypes)
* [events](_wrappers_lockedgold_.lockedgoldwrapper.md#events)
* [getAccountNonvotingLockedGold](_wrappers_lockedgold_.lockedgoldwrapper.md#getaccountnonvotinglockedgold)
* [getAccountTotalLockedGold](_wrappers_lockedgold_.lockedgoldwrapper.md#getaccounttotallockedgold)
* [getTotalLockedGold](_wrappers_lockedgold_.lockedgoldwrapper.md#gettotallockedgold)
* [lock](_wrappers_lockedgold_.lockedgoldwrapper.md#lock)
* [methodIds](_wrappers_lockedgold_.lockedgoldwrapper.md#methodids)
* [unlock](_wrappers_lockedgold_.lockedgoldwrapper.md#unlock)
* [withdraw](_wrappers_lockedgold_.lockedgoldwrapper.md#withdraw)

### Accessors

* [address](_wrappers_lockedgold_.lockedgoldwrapper.md#address)

### Methods

* [computeInitialParametersForSlashing](_wrappers_lockedgold_.lockedgoldwrapper.md#computeinitialparametersforslashing)
* [computeParametersForSlashing](_wrappers_lockedgold_.lockedgoldwrapper.md#computeparametersforslashing)
* [getAccountSummary](_wrappers_lockedgold_.lockedgoldwrapper.md#getaccountsummary)
* [getAccountsSlashed](_wrappers_lockedgold_.lockedgoldwrapper.md#getaccountsslashed)
* [getConfig](_wrappers_lockedgold_.lockedgoldwrapper.md#getconfig)
* [getHumanReadableConfig](_wrappers_lockedgold_.lockedgoldwrapper.md#gethumanreadableconfig)
* [getPastEvents](_wrappers_lockedgold_.lockedgoldwrapper.md#getpastevents)
* [getPendingWithdrawals](_wrappers_lockedgold_.lockedgoldwrapper.md#getpendingwithdrawals)
* [getPendingWithdrawalsTotalValue](_wrappers_lockedgold_.lockedgoldwrapper.md#getpendingwithdrawalstotalvalue)
* [relock](_wrappers_lockedgold_.lockedgoldwrapper.md#relock)

## Constructors

###  constructor

\+ **new LockedGoldWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: LockedGold): *[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)*

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

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:146](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L146)*

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

###  eventTypes

• **eventTypes**: *object* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)*

#### Type declaration:

___

###  events

• **events**: *LockedGold["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

___

###  getAccountNonvotingLockedGold

• **getAccountNonvotingLockedGold**: *function* = proxyCall(
    this.contract.methods.getAccountNonvotingLockedGold,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:179](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L179)*

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

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L157)*

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

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:168](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L168)*

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

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L82)*

Locks gold to be used for voting.
The gold to be locked, must be specified as the `tx.value`

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  methodIds

• **methodIds**: *object* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)*

#### Type declaration:

___

###  unlock

• **unlock**: *function* = proxySend(
    this.kit,
    this.contract.methods.unlock,
    tupleParser(valueToString)
  )

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L88)*

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

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L73)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)*

Contract address

**Returns:** *string*

## Methods

###  computeInitialParametersForSlashing

▸ **computeInitialParametersForSlashing**(`account`: string, `penalty`: BigNumber): *Promise‹object›*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:266](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L266)*

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

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:273](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L273)*

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

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:207](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L207)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹AccountSummary›*

___

###  getAccountsSlashed

▸ **getAccountsSlashed**(`epochNumber`: number): *Promise‹[AccountSlashed](../interfaces/_wrappers_lockedgold_.accountslashed.md)[]›*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:244](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L244)*

Retrieves AccountSlashed for epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve AccountSlashed at.  |

**Returns:** *Promise‹[AccountSlashed](../interfaces/_wrappers_lockedgold_.accountslashed.md)[]›*

___

###  getConfig

▸ **getConfig**(): *Promise‹[LockedGoldConfig](../interfaces/_wrappers_lockedgold_.lockedgoldconfig.md)›*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:188](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L188)*

Returns current configuration parameters.

**Returns:** *Promise‹[LockedGoldConfig](../interfaces/_wrappers_lockedgold_.lockedgoldconfig.md)›*

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(): *Promise‹object›*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:199](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L199)*

**`dev`** Returns human readable configuration of the lockedgold contract

**Returns:** *Promise‹object›*

LockedGoldConfig object

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹LockedGold›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹LockedGold› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getPendingWithdrawals

▸ **getPendingWithdrawals**(`account`: string): *Promise‹[PendingWithdrawal](../interfaces/_wrappers_lockedgold_.pendingwithdrawal.md)[]›*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:228](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L228)*

Returns the pending withdrawals from unlocked gold for an account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | string | The address of the account. |

**Returns:** *Promise‹[PendingWithdrawal](../interfaces/_wrappers_lockedgold_.pendingwithdrawal.md)[]›*

The value and timestamp for each pending withdrawal.

___

###  getPendingWithdrawalsTotalValue

▸ **getPendingWithdrawalsTotalValue**(`account`: [Address](../modules/_base_.md#address)): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L94)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹BigNumber‹››*

___

###  relock

▸ **relock**(`account`: [Address](../modules/_base_.md#address), `value`: BigNumber.Value): *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›››*

*Defined in [packages/contractkit/src/wrappers/LockedGold.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L106)*

Relocks gold that has been unlocked but not withdrawn.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_base_.md#address) | - |
`value` | BigNumber.Value | The value to relock from pending withdrawals.  |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›››*
