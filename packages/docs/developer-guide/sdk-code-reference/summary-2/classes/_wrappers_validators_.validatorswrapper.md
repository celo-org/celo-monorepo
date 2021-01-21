# ValidatorsWrapper

Contract for voting for validators and managing validator groups.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Validators›

  ↳ **ValidatorsWrapper**

## Index

### Constructors

* [constructor](_wrappers_validators_.validatorswrapper.md#constructor)

### Properties

* [affiliate](_wrappers_validators_.validatorswrapper.md#affiliate)
* [deaffiliate](_wrappers_validators_.validatorswrapper.md#deaffiliate)
* [eventTypes](_wrappers_validators_.validatorswrapper.md#eventtypes)
* [events](_wrappers_validators_.validatorswrapper.md#events)
* [forceDeaffiliateIfValidator](_wrappers_validators_.validatorswrapper.md#forcedeaffiliateifvalidator)
* [getAccountLockedGoldRequirement](_wrappers_validators_.validatorswrapper.md#getaccountlockedgoldrequirement)
* [getCommissionUpdateDelay](_wrappers_validators_.validatorswrapper.md#getcommissionupdatedelay)
* [getEpochNumber](_wrappers_validators_.validatorswrapper.md#getepochnumber)
* [getEpochSize](_wrappers_validators_.validatorswrapper.md#getepochsize)
* [getRegisteredValidatorGroupsAddresses](_wrappers_validators_.validatorswrapper.md#getregisteredvalidatorgroupsaddresses)
* [getSlashingMultiplierResetPeriod](_wrappers_validators_.validatorswrapper.md#getslashingmultiplierresetperiod)
* [getValidatorGroupSize](_wrappers_validators_.validatorswrapper.md#getvalidatorgroupsize)
* [getValidatorMembershipHistory](_wrappers_validators_.validatorswrapper.md#getvalidatormembershiphistory)
* [getValidatorMembershipHistoryExtraData](_wrappers_validators_.validatorswrapper.md#getvalidatormembershiphistoryextradata)
* [isValidator](_wrappers_validators_.validatorswrapper.md#isvalidator)
* [isValidatorGroup](_wrappers_validators_.validatorswrapper.md#isvalidatorgroup)
* [methodIds](_wrappers_validators_.validatorswrapper.md#methodids)
* [registerValidator](_wrappers_validators_.validatorswrapper.md#registervalidator)
* [removeMember](_wrappers_validators_.validatorswrapper.md#removemember)
* [resetSlashingMultiplier](_wrappers_validators_.validatorswrapper.md#resetslashingmultiplier)
* [setNextCommissionUpdate](_wrappers_validators_.validatorswrapper.md#setnextcommissionupdate)
* [updateBlsPublicKey](_wrappers_validators_.validatorswrapper.md#updateblspublickey)
* [updateCommission](_wrappers_validators_.validatorswrapper.md#updatecommission)

### Accessors

* [address](_wrappers_validators_.validatorswrapper.md#address)

### Methods

* [addMember](_wrappers_validators_.validatorswrapper.md#addmember)
* [currentSignerSet](_wrappers_validators_.validatorswrapper.md#currentsignerset)
* [currentValidatorAccountsSet](_wrappers_validators_.validatorswrapper.md#currentvalidatoraccountsset)
* [deregisterValidator](_wrappers_validators_.validatorswrapper.md#deregistervalidator)
* [deregisterValidatorGroup](_wrappers_validators_.validatorswrapper.md#deregistervalidatorgroup)
* [findValidatorMembershipHistoryIndex](_wrappers_validators_.validatorswrapper.md#findvalidatormembershiphistoryindex)
* [getConfig](_wrappers_validators_.validatorswrapper.md#getconfig)
* [getGroupLockedGoldRequirements](_wrappers_validators_.validatorswrapper.md#getgrouplockedgoldrequirements)
* [getHumanReadableConfig](_wrappers_validators_.validatorswrapper.md#gethumanreadableconfig)
* [getPastEvents](_wrappers_validators_.validatorswrapper.md#getpastevents)
* [getRegisteredValidatorGroups](_wrappers_validators_.validatorswrapper.md#getregisteredvalidatorgroups)
* [getRegisteredValidators](_wrappers_validators_.validatorswrapper.md#getregisteredvalidators)
* [getRegisteredValidatorsAddresses](_wrappers_validators_.validatorswrapper.md#getregisteredvalidatorsaddresses)
* [getValidator](_wrappers_validators_.validatorswrapper.md#getvalidator)
* [getValidatorFromSigner](_wrappers_validators_.validatorswrapper.md#getvalidatorfromsigner)
* [getValidatorGroup](_wrappers_validators_.validatorswrapper.md#getvalidatorgroup)
* [getValidatorLockedGoldRequirements](_wrappers_validators_.validatorswrapper.md#getvalidatorlockedgoldrequirements)
* [getValidatorMembershipHistoryIndex](_wrappers_validators_.validatorswrapper.md#getvalidatormembershiphistoryindex)
* [getValidatorRewards](_wrappers_validators_.validatorswrapper.md#getvalidatorrewards)
* [meetsValidatorBalanceRequirements](_wrappers_validators_.validatorswrapper.md#meetsvalidatorbalancerequirements)
* [meetsValidatorGroupBalanceRequirements](_wrappers_validators_.validatorswrapper.md#meetsvalidatorgroupbalancerequirements)
* [registerValidatorGroup](_wrappers_validators_.validatorswrapper.md#registervalidatorgroup)
* [reorderMember](_wrappers_validators_.validatorswrapper.md#reordermember)
* [signerToAccount](_wrappers_validators_.validatorswrapper.md#signertoaccount)
* [validatorSignerToAccount](_wrappers_validators_.validatorswrapper.md#validatorsignertoaccount)

## Constructors

### constructor

+ **new ValidatorsWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Validators\): [_ValidatorsWrapper_](_wrappers_validators_.validatorswrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | Validators |

**Returns:** [_ValidatorsWrapper_](_wrappers_validators_.validatorswrapper.md)

## Properties

### affiliate

• **affiliate**: _function_ = proxySend\( this.kit, this.contract.methods.affiliate \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:477_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L477)

Affiliates a validator with a group, allowing it to be added as a member. De-affiliates with the previously affiliated group if present.

**`param`** The validator group with which to affiliate.

#### Type declaration:

▸ \(`group`: Address\): _CeloTransactionObject‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `group` | Address |

### deaffiliate

• **deaffiliate**: _function_ = proxySend\(this.kit, this.contract.methods.deaffiliate\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:487_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L487)

De-affiliates a validator, removing it from the group for which it is a member. Fails if the account is not a validator with non-zero affiliation.

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

• **events**: _Validators\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### forceDeaffiliateIfValidator

• **forceDeaffiliateIfValidator**: _function_ = proxySend\( this.kit, this.contract.methods.forceDeaffiliateIfValidator \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:493_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L493)

Removes a validator from the group for which it is a member.

**`param`** The validator to deaffiliate from their affiliated validator group.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getAccountLockedGoldRequirement

• **getAccountLockedGoldRequirement**: _function_ = proxyCall\( this.contract.methods.getAccountLockedGoldRequirement, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L128)

Returns the Locked Gold requirements for specific account.

**`returns`** The Locked Gold requirements for a specific account.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getCommissionUpdateDelay

• **getCommissionUpdateDelay**: _function_ = proxyCall\( this.contract.methods.commissionUpdateDelay, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:146_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L146)

Returns the update delay, in blocks, for the group commission.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getEpochNumber

• **getEpochNumber**: _function_ = proxyCall\(this.contract.methods.getEpochNumber, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:413_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L413)

Registers a validator unaffiliated with any validator group.

Fails if the account is already a validator or validator group.

**`param`** The address that the validator is using for consensus, should match the validator signer.

**`param`** The ECDSA public key that the validator is using for consensus. 64 bytes.

**`param`** The BLS public key that the validator is using for consensus, should pass proof of possession. 48 bytes.

**`param`** The BLS public key proof-of-possession, which consists of a signature on the account address. 96 bytes.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getEpochSize

• **getEpochSize**: _function_ = proxyCall\(this.contract.methods.getEpochSize, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:415_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L415)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getRegisteredValidatorGroupsAddresses

• **getRegisteredValidatorGroupsAddresses**: _function_ = proxyCall\( this.contract.methods.getRegisteredValidatorGroups \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:383_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L383)

Get list of registered validator group addresses

#### Type declaration:

▸ \(\): _Promise‹Address\[\]›_

### getSlashingMultiplierResetPeriod

• **getSlashingMultiplierResetPeriod**: _function_ = proxyCall\( this.contract.methods.slashingMultiplierResetPeriod, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:137_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L137)

Returns the reset period, in seconds, for slashing multiplier.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getValidatorGroupSize

• **getValidatorGroupSize**: _function_ = proxyCall\( this.contract.methods.getGroupNumMembers, undefined, valueToInt \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:370_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L370)

Get the size \(amount of members\) of a ValidatorGroup

#### Type declaration:

▸ \(`group`: Address\): _Promise‹number›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `group` | Address |

### getValidatorMembershipHistory

• **getValidatorMembershipHistory**: _function_ = proxyCall\( this.contract.methods.getMembershipHistory, undefined, \(res\) =&gt; zip\(\(epoch, group\): GroupMembership =&gt; \({ epoch: valueToInt\(epoch\), group }\), res\[0\], res\[1\]\) \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:349_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L349)

Returns the Validator's group membership history

**`param`** The validator whose membership history to return.

**`returns`** The group membership history of a validator.

#### Type declaration:

▸ \(`validator`: Address\): _Promise‹_[_GroupMembership_](../interfaces/_wrappers_validators_.groupmembership.md)_\[\]›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `validator` | Address |

### getValidatorMembershipHistoryExtraData

• **getValidatorMembershipHistoryExtraData**: _function_ = proxyCall\( this.contract.methods.getMembershipHistory, undefined, \(res\) =&gt; \({ lastRemovedFromGroupTimestamp: valueToInt\(res\[2\]\), tail: valueToInt\(res\[3\]\) }\) \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:361_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L361)

Returns extra data from the Validator's group membership history

**`param`** The validator whose membership history to return.

**`returns`** The group membership history of a validator.

#### Type declaration:

▸ \(`validator`: Address\): _Promise‹_[_MembershipHistoryExtraData_](../interfaces/_wrappers_validators_.membershiphistoryextradata.md)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `validator` | Address |

### isValidator

• **isValidator**: _function_ = proxyCall\(this.contract.methods.isValidator\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:241_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L241)

Returns whether a particular account has a registered validator.

**`param`** The account.

**`returns`** Whether a particular address is a registered validator.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isValidatorGroup

• **isValidatorGroup**: _function_ = proxyCall\(this.contract.methods.isValidatorGroup\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:248_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L248)

Returns whether a particular account has a registered validator group.

**`param`** The account.

**`returns`** Whether a particular address is a registered validator group.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

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

### registerValidator

• **registerValidator**: _function_ = proxySend\( this.kit, this.contract.methods.registerValidator, tupleParser\(stringToSolidityBytes, stringToSolidityBytes, stringToSolidityBytes\) \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:417_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L417)

#### Type declaration:

▸ \(`ecdsaPublicKey`: string, `blsPublicKey`: string, `blsPop`: string\): _CeloTransactionObject‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `ecdsaPublicKey` | string |
| `blsPublicKey` | string |
| `blsPop` | string |

### removeMember

• **removeMember**: _function_ = proxySend\(this.kit, this.contract.methods.removeMember\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:531_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L531)

Removes a member from a ValidatorGroup The ValidatorGroup is specified by the `from` of the tx.

**`param`** The Validator to remove from the group

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### resetSlashingMultiplier

• **resetSlashingMultiplier**: _function_ = proxySend\(this.kit, this.contract.methods.resetSlashingMultiplier\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:502_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L502)

Resets a group's slashing multiplier if it has been &gt;= the reset period since the last time the group was slashed.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setNextCommissionUpdate

• **setNextCommissionUpdate**: _function_ = proxySend\( this.kit, this.contract.methods.setNextCommissionUpdate, tupleParser\(valueToFixidityString\) \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:86_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L86)

Queues an update to a validator group's commission.

**`param`** Fixidity representation of the commission this group receives on epoch payments made to its members. Must be in the range \[0, 1.0\].

#### Type declaration:

▸ \(`commission`: BigNumber.Value\): _CeloTransactionObject‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `commission` | BigNumber.Value |

### updateBlsPublicKey

• **updateBlsPublicKey**: _function_ = proxySend\( this.kit, this.contract.methods.updateBlsPublicKey, tupleParser\(stringToSolidityBytes, stringToSolidityBytes\) \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:227_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L227)

Updates a validator's BLS key.

**`param`** The BLS public key that the validator is using for consensus, should pass proof of possession. 48 bytes.

**`param`** The BLS public key proof-of-possession, which consists of a signature on the account address. 96 bytes.

**`returns`** True upon success.

#### Type declaration:

▸ \(`blsPublicKey`: string, `blsPop`: string\): _CeloTransactionObject‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blsPublicKey` | string |
| `blsPop` | string |

### updateCommission

• **updateCommission**: _function_ = proxySend\( this.kit, this.contract.methods.updateCommission \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:95_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L95)

Updates a validator group's commission based on the previously queued update

#### Type declaration:

▸ \(\): _CeloTransactionObject‹void›_

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### addMember

▸ **addMember**\(`group`: Address, `validator`: Address\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:509_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L509)

Adds a member to the end of a validator group's list of members. Fails if `validator` has not set their affiliation to this account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `group` | Address | - |
| `validator` | Address | The validator to add to the group |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### currentSignerSet

▸ **currentSignerSet**\(\): _Promise‹Address\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:599_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L599)

Returns the current set of validator signer addresses

**Returns:** _Promise‹Address\[\]›_

### currentValidatorAccountsSet

▸ **currentValidatorAccountsSet**\(\): _Promise‹object\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:609_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L609)

Returns the current set of validator signer and account addresses

**Returns:** _Promise‹object\[\]›_

### deregisterValidator

▸ **deregisterValidator**\(`validatorAddress`: Address\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:431_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L431)

De-registers a validator, removing it from the group for which it is a member.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorAddress` | Address | Address of the validator to deregister |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### deregisterValidatorGroup

▸ **deregisterValidatorGroup**\(`validatorGroupAddress`: Address\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:459_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L459)

De-registers a validator Group

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorGroupAddress` | Address | Address of the validator group to deregister |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### findValidatorMembershipHistoryIndex

▸ **findValidatorMembershipHistoryIndex**\(`epoch`: number, `history`: [GroupMembership](../interfaces/_wrappers_validators_.groupmembership.md)\[\]\): _number_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:642_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L642)

Returns the index into `history` for `epoch`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `epoch` | number | The needle. |
| `history` | [GroupMembership](../interfaces/_wrappers_validators_.groupmembership.md)\[\] | The haystack. |

**Returns:** _number_

Index for epoch or -1.

### getConfig

▸ **getConfig**\(\): _Promise‹_[_ValidatorsConfig_](../interfaces/_wrappers_validators_.validatorsconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:155_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L155)

Returns current configuration parameters.

**Returns:** _Promise‹_[_ValidatorsConfig_](../interfaces/_wrappers_validators_.validatorsconfig.md)_›_

### getGroupLockedGoldRequirements

▸ **getGroupLockedGoldRequirements**\(\): _Promise‹_[_LockedGoldRequirements_](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:116_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L116)

Returns the Locked Gold requirements for validator groups.

**Returns:** _Promise‹_[_LockedGoldRequirements_](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)_›_

The Locked Gold requirements for validator groups.

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:178_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L178)

**`dev`** Returns human readable configuration of the validators contract

**Returns:** _Promise‹object›_

ValidatorsConfig object

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Validators›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_getPastEvents_](_wrappers_basewrapper_.basewrapper.md#getpastevents)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Validators› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getRegisteredValidatorGroups

▸ **getRegisteredValidatorGroups**\(\): _Promise‹_[_ValidatorGroup_](../interfaces/_wrappers_validators_.validatorgroup.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:394_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L394)

Get list of registered validator groups

**Returns:** _Promise‹_[_ValidatorGroup_](../interfaces/_wrappers_validators_.validatorgroup.md)_\[\]›_

### getRegisteredValidators

▸ **getRegisteredValidators**\(`blockNumber?`: undefined \| number\): _Promise‹_[_Validator_](../interfaces/_wrappers_validators_.validator.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:388_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L388)

Get list of registered validators

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_Validator_](../interfaces/_wrappers_validators_.validator.md)_\[\]›_

### getRegisteredValidatorsAddresses

▸ **getRegisteredValidatorsAddresses**\(`blockNumber?`: undefined \| number\): _Promise‹Address\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:377_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L377)

Get list of registered validator addresses

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹Address\[\]›_

### getValidator

▸ **getValidator**\(`address`: Address, `blockNumber?`: undefined \| number\): _Promise‹_[_Validator_](../interfaces/_wrappers_validators_.validator.md)_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:276_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L276)

Get Validator information

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_Validator_](../interfaces/_wrappers_validators_.validator.md)_›_

### getValidatorFromSigner

▸ **getValidatorFromSigner**\(`address`: Address, `blockNumber?`: undefined \| number\): _Promise‹_[_Validator_](../interfaces/_wrappers_validators_.validator.md)_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:293_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L293)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_Validator_](../interfaces/_wrappers_validators_.validator.md)_›_

### getValidatorGroup

▸ **getValidatorGroup**\(`address`: Address, `getAffiliates`: boolean, `blockNumber?`: undefined \| number\): _Promise‹_[_ValidatorGroup_](../interfaces/_wrappers_validators_.validatorgroup.md)_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:311_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L311)

Get ValidatorGroup information

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `address` | Address | - |
| `getAffiliates` | boolean | true |
| `blockNumber?` | undefined \| number | - |

**Returns:** _Promise‹_[_ValidatorGroup_](../interfaces/_wrappers_validators_.validatorgroup.md)_›_

### getValidatorLockedGoldRequirements

▸ **getValidatorLockedGoldRequirements**\(\): _Promise‹_[_LockedGoldRequirements_](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:104_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L104)

Returns the Locked Gold requirements for validators.

**Returns:** _Promise‹_[_LockedGoldRequirements_](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)_›_

The Locked Gold requirements for validators.

### getValidatorMembershipHistoryIndex

▸ **getValidatorMembershipHistoryIndex**\(`account`: Address, `blockNumber?`: undefined \| number\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:623_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L623)

Returns the group membership for validator account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | Address | Address of validator account to retrieve group membership for. |
| `blockNumber?` | undefined \| number | Block number to retrieve group membership at. |

**Returns:** _Promise‹object›_

Group and membership history index for `validator`.

### getValidatorRewards

▸ **getValidatorRewards**\(`epochNumber`: number\): _Promise‹_[_ValidatorReward_](../interfaces/_wrappers_validators_.validatorreward.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:573_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L573)

Retrieves ValidatorRewards for epochNumber.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `epochNumber` | number | The epoch to retrieve ValidatorRewards at. |

**Returns:** _Promise‹_[_ValidatorReward_](../interfaces/_wrappers_validators_.validatorreward.md)_\[\]›_

### meetsValidatorBalanceRequirements

▸ **meetsValidatorBalanceRequirements**\(`address`: Address\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:255_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L255)

Returns whether an account meets the requirements to register a validator.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |

**Returns:** _Promise‹boolean›_

Whether an account meets the requirements to register a validator.

### meetsValidatorGroupBalanceRequirements

▸ **meetsValidatorGroupBalanceRequirements**\(`address`: Address\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:268_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L268)

Returns whether an account meets the requirements to register a group.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |

**Returns:** _Promise‹boolean›_

Whether an account meets the requirements to register a group.

### registerValidatorGroup

▸ **registerValidatorGroup**\(`commission`: BigNumber\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:448_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L448)

Registers a validator group with no member validators. Fails if the account is already a validator or validator group. Fails if the account does not have sufficient weight.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `commission` | BigNumber | the commission this group receives on epoch payments made to its members. |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### reorderMember

▸ **reorderMember**\(`groupAddr`: Address, `validator`: Address, `newIndex`: number\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:540_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L540)

Reorders a member within a validator group. Fails if `validator` is not a member of the account's validator group.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `groupAddr` | Address | The validator group |
| `validator` | Address | The validator to reorder. |
| `newIndex` | number | New position for the validator |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### signerToAccount

▸ **signerToAccount**\(`signerAddress`: Address\): _Promise‹string›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:214_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L214)

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or previously authorized signer.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signerAddress` | Address |

**Returns:** _Promise‹string›_

The associated account.

### validatorSignerToAccount

▸ **validatorSignerToAccount**\(`signerAddress`: Address\): _Promise‹string›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:203_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L203)

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or currently authorized validator.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signerAddress` | Address |

**Returns:** _Promise‹string›_

The associated account.

