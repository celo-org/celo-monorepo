# LockedGoldWrapper

Contract for handling deposits needed for voting.

## Hierarchy

* [BaseWrapper]()‹LockedGold›

  ↳ **LockedGoldWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [\_relock]()
* [eventTypes]()
* [events]()
* [getAccountNonvotingLockedGold]()
* [getAccountTotalLockedGold]()
* [getTotalLockedGold]()
* [lock]()
* [methodIds]()
* [unlock]()
* [withdraw]()

### Accessors

* [address]()

### Methods

* [computeInitialParametersForSlashing]()
* [computeParametersForSlashing]()
* [getAccountSummary]()
* [getAccountsSlashed]()
* [getConfig]()
* [getHumanReadableConfig]()
* [getPastEvents]()
* [getPendingWithdrawals]()
* [getPendingWithdrawalsTotalValue]()
* [relock]()

## Constructors

### constructor

+ **new LockedGoldWrapper**\(`kit`: [ContractKit](), `contract`: LockedGold\): [_LockedGoldWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | LockedGold |

**Returns:** [_LockedGoldWrapper_]()

## Properties

### \_relock

• **\_relock**: _function_ = proxySend\( this.kit, this.contract.methods.relock, tupleParser\(valueToString, valueToString\) \)

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:146_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L146)

Relocks gold that has been unlocked but not withdrawn.

**`param`** The index of the pending withdrawal to relock from.

**`param`** The value to relock from the specified pending withdrawal.

#### Type declaration:

▸ \(`index`: number, `value`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `index` | number |
| `value` | BigNumber.Value |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

### events

• **events**: _LockedGold\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### getAccountNonvotingLockedGold

• **getAccountNonvotingLockedGold**: _function_ = proxyCall\( this.contract.methods.getAccountNonvotingLockedGold, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:179_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L179)

Returns the total amount of non-voting locked gold for an account.

**`param`** The account.

**`returns`** The total amount of non-voting locked gold for an account.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getAccountTotalLockedGold

• **getAccountTotalLockedGold**: _function_ = proxyCall\( this.contract.methods.getAccountTotalLockedGold, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L157)

Returns the total amount of locked gold for an account.

**`param`** The account.

**`returns`** The total amount of locked gold for an account.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getTotalLockedGold

• **getTotalLockedGold**: _function_ = proxyCall\( this.contract.methods.getTotalLockedGold, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:168_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L168)

Returns the total amount of locked gold in the system. Note that this does not include gold that has been unlocked but not yet withdrawn.

**`returns`** The total amount of locked gold in the system.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### lock

• **lock**: _function_ = proxySend\(this.kit, this.contract.methods.lock\)

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L82)

Locks gold to be used for voting. The gold to be locked, must be specified as the `tx.value`

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### methodIds

• **methodIds**: _Record‹keyof T\["methods"\], string›_ = Object.keys\(this.contract.methods\).reduce, string&gt;&gt;\( \(acc, method: Methods\) =&gt; { const methodABI = this.contract.options.jsonInterface.find\(\(item\) =&gt; item.name === method\)

```text
  acc[method] =
    methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)

### unlock

• **unlock**: _function_ = proxySend\( this.kit, this.contract.methods.unlock, tupleParser\(valueToString\) \)

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L88)

Unlocks gold that becomes withdrawable after the unlocking period.

**`param`** The amount of gold to unlock.

#### Type declaration:

▸ \(`value`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | BigNumber.Value |

### withdraw

• **withdraw**: _function_ = proxySend\( this.kit, this.contract.methods.withdraw \)

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:73_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L73)

Withdraws a gold that has been unlocked after the unlocking period has passed.

**`param`** The index of the pending withdrawal to withdraw.

#### Type declaration:

▸ \(`index`: number\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `index` | number |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### computeInitialParametersForSlashing

▸ **computeInitialParametersForSlashing**\(`account`: string, `penalty`: BigNumber\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:266_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L266)

Computes parameters for slashing `penalty` from `account`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | string | The account to slash. |
| `penalty` | BigNumber | The amount to slash as penalty. |

**Returns:** _Promise‹object›_

List of \(group, voting gold\) to decrement from `account`.

### computeParametersForSlashing

▸ **computeParametersForSlashing**\(`account`: string, `penalty`: BigNumber, `groups`: AddressListItem\[\]\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:273_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L273)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |
| `penalty` | BigNumber |
| `groups` | AddressListItem\[\] |

**Returns:** _Promise‹object›_

### getAccountSummary

▸ **getAccountSummary**\(`account`: string\): _Promise‹AccountSummary›_

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:207_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L207)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

**Returns:** _Promise‹AccountSummary›_

### getAccountsSlashed

▸ **getAccountsSlashed**\(`epochNumber`: number\): _Promise‹_[_AccountSlashed_]()_\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:244_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L244)

Retrieves AccountSlashed for epochNumber.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `epochNumber` | number | The epoch to retrieve AccountSlashed at. |

**Returns:** _Promise‹_[_AccountSlashed_]()_\[\]›_

### getConfig

▸ **getConfig**\(\): _Promise‹_[_LockedGoldConfig_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:188_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L188)

Returns current configuration parameters.

**Returns:** _Promise‹_[_LockedGoldConfig_]()_›_

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:199_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L199)

**`dev`** Returns human readable configuration of the lockedgold contract

**Returns:** _Promise‹object›_

LockedGoldConfig object

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹LockedGold›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹LockedGold› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getPendingWithdrawals

▸ **getPendingWithdrawals**\(`account`: string\): _Promise‹_[_PendingWithdrawal_]()_\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:228_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L228)

Returns the pending withdrawals from unlocked gold for an account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | string | The address of the account. |

**Returns:** _Promise‹_[_PendingWithdrawal_]()_\[\]›_

The value and timestamp for each pending withdrawal.

### getPendingWithdrawalsTotalValue

▸ **getPendingWithdrawalsTotalValue**\(`account`: [Address](_base_.md#address)\): _Promise‹BigNumber‹››_

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L94)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |

**Returns:** _Promise‹BigNumber‹››_

### relock

▸ **relock**\(`account`: [Address](_base_.md#address), `value`: BigNumber.Value\): _Promise‹Array‹_[_CeloTransactionObject_]()_‹void›››_

_Defined in_ [_packages/contractkit/src/wrappers/LockedGold.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/LockedGold.ts#L106)

Relocks gold that has been unlocked but not withdrawn.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | [Address](_base_.md#address) | - |
| `value` | BigNumber.Value | The value to relock from pending withdrawals. |

**Returns:** _Promise‹Array‹_[_CeloTransactionObject_]()_‹void›››_

