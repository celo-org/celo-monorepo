[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/LockedGold"](../modules/_wrappers_lockedgold_.md) › [LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)

# Class: LockedGoldWrapper

Contract for handling deposits needed for voting.

## Hierarchy

  ↳ [BaseWrapperForGoverning](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md)‹LockedGold›

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
* [version](_wrappers_lockedgold_.lockedgoldwrapper.md#version)

## Constructors

###  constructor

\+ **new LockedGoldWrapper**(`connection`: Connection, `contract`: LockedGold, `contracts`: ContractWrappersForVotingAndRules): *[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)*

*Inherited from [ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md).[constructor](_wrappers_validators_.validatorswrapper.md#constructor)*

*Overrides [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | LockedGold |
`contracts` | ContractWrappersForVotingAndRules |

**Returns:** *[LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)*

## Properties

###  _relock

• **_relock**: *function* = proxySend(
    this.connection,
    this.contract.methods.relock,
    tupleParser(valueToString, valueToString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:145](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L145)*

Relocks gold that has been unlocked but not withdrawn.

**`param`** The index of the pending withdrawal to relock from.

**`param`** The value to relock from the specified pending withdrawal.

#### Type declaration:

▸ (`index`: number, `value`: BigNumber.Value): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |
`value` | BigNumber.Value |

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

• **events**: *LockedGold["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  getAccountNonvotingLockedGold

• **getAccountNonvotingLockedGold**: *function* = proxyCall(
    this.contract.methods.getAccountNonvotingLockedGold,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:178](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L178)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L156)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L167)*

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

• **lock**: *function* = proxySend(this.connection, this.contract.methods.lock)

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L81)*

Locks gold to be used for voting.
The gold to be locked, must be specified as the `tx.value`

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

###  unlock

• **unlock**: *function* = proxySend(
    this.connection,
    this.contract.methods.unlock,
    tupleParser(valueToString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L87)*

Unlocks gold that becomes withdrawable after the unlocking period.

**`param`** The amount of gold to unlock.

#### Type declaration:

▸ (`value`: BigNumber.Value): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`value` | BigNumber.Value |

___

###  withdraw

• **withdraw**: *function* = proxySend(
    this.connection,
    this.contract.methods.withdraw
  )

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L72)*

Withdraws a gold that has been unlocked after the unlocking period has passed.

**`param`** The index of the pending withdrawal to withdraw.

#### Type declaration:

▸ (`index`: number): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  computeInitialParametersForSlashing

▸ **computeInitialParametersForSlashing**(`account`: string, `penalty`: BigNumber): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:266](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L266)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:273](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L273)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:206](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L206)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

**Returns:** *Promise‹AccountSummary›*

___

###  getAccountsSlashed

▸ **getAccountsSlashed**(`epochNumber`: number): *Promise‹[AccountSlashed](../interfaces/_wrappers_lockedgold_.accountslashed.md)[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L243)*

Retrieves AccountSlashed for epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve AccountSlashed at.  |

**Returns:** *Promise‹[AccountSlashed](../interfaces/_wrappers_lockedgold_.accountslashed.md)[]›*

___

###  getConfig

▸ **getConfig**(): *Promise‹[LockedGoldConfig](../interfaces/_wrappers_lockedgold_.lockedgoldconfig.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:187](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L187)*

Returns current configuration parameters.

**Returns:** *Promise‹[LockedGoldConfig](../interfaces/_wrappers_lockedgold_.lockedgoldconfig.md)›*

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:198](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L198)*

**`dev`** Returns human readable configuration of the lockedgold contract

**Returns:** *Promise‹object›*

LockedGoldConfig object

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹LockedGold›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:227](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L227)*

Returns the pending withdrawals from unlocked gold for an account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | string | The address of the account. |

**Returns:** *Promise‹[PendingWithdrawal](../interfaces/_wrappers_lockedgold_.pendingwithdrawal.md)[]›*

The value and timestamp for each pending withdrawal.

___

###  getPendingWithdrawalsTotalValue

▸ **getPendingWithdrawalsTotalValue**(`account`: Address): *Promise‹BigNumber‹››*

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L93)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *Promise‹BigNumber‹››*

___

###  relock

▸ **relock**(`account`: Address, `value`: BigNumber.Value): *Promise‹Array‹CeloTransactionObject‹void›››*

*Defined in [packages/sdk/contractkit/src/wrappers/LockedGold.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/LockedGold.ts#L105)*

Relocks gold that has been unlocked but not withdrawn.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | Address | - |
`value` | BigNumber.Value | The value to relock from pending withdrawals.  |

**Returns:** *Promise‹Array‹CeloTransactionObject‹void›››*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
