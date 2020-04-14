# Class: ValidatorsWrapper

Contract for voting for validators and managing validator groups.

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹Validators›

  ↳ **ValidatorsWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_validators_.validatorswrapper.md#constructor)

### Properties

* [affiliate](_contractkit_src_wrappers_validators_.validatorswrapper.md#affiliate)
* [deaffiliate](_contractkit_src_wrappers_validators_.validatorswrapper.md#deaffiliate)
* [events](_contractkit_src_wrappers_validators_.validatorswrapper.md#events)
* [forceDeaffiliateIfValidator](_contractkit_src_wrappers_validators_.validatorswrapper.md#forcedeaffiliateifvalidator)
* [getAccountLockedGoldRequirement](_contractkit_src_wrappers_validators_.validatorswrapper.md#getaccountlockedgoldrequirement)
* [getEpochNumber](_contractkit_src_wrappers_validators_.validatorswrapper.md#getepochnumber)
* [getEpochSize](_contractkit_src_wrappers_validators_.validatorswrapper.md#getepochsize)
* [getRegisteredValidatorGroupsAddresses](_contractkit_src_wrappers_validators_.validatorswrapper.md#getregisteredvalidatorgroupsaddresses)
* [getSlashingMultiplierResetPeriod](_contractkit_src_wrappers_validators_.validatorswrapper.md#getslashingmultiplierresetperiod)
* [getValidatorGroupSize](_contractkit_src_wrappers_validators_.validatorswrapper.md#getvalidatorgroupsize)
* [getValidatorMembershipHistory](_contractkit_src_wrappers_validators_.validatorswrapper.md#getvalidatormembershiphistory)
* [getValidatorMembershipHistoryExtraData](_contractkit_src_wrappers_validators_.validatorswrapper.md#getvalidatormembershiphistoryextradata)
* [isValidator](_contractkit_src_wrappers_validators_.validatorswrapper.md#isvalidator)
* [isValidatorGroup](_contractkit_src_wrappers_validators_.validatorswrapper.md#isvalidatorgroup)
* [registerValidator](_contractkit_src_wrappers_validators_.validatorswrapper.md#registervalidator)
* [removeMember](_contractkit_src_wrappers_validators_.validatorswrapper.md#removemember)
* [resetSlashingMultiplier](_contractkit_src_wrappers_validators_.validatorswrapper.md#resetslashingmultiplier)
* [setNextCommissionUpdate](_contractkit_src_wrappers_validators_.validatorswrapper.md#setnextcommissionupdate)
* [updateBlsPublicKey](_contractkit_src_wrappers_validators_.validatorswrapper.md#updateblspublickey)
* [updateCommission](_contractkit_src_wrappers_validators_.validatorswrapper.md#updatecommission)

### Accessors

* [address](_contractkit_src_wrappers_validators_.validatorswrapper.md#address)

### Methods

* [addMember](_contractkit_src_wrappers_validators_.validatorswrapper.md#addmember)
* [currentSignerSet](_contractkit_src_wrappers_validators_.validatorswrapper.md#currentsignerset)
* [currentValidatorAccountsSet](_contractkit_src_wrappers_validators_.validatorswrapper.md#currentvalidatoraccountsset)
* [deregisterValidator](_contractkit_src_wrappers_validators_.validatorswrapper.md#deregistervalidator)
* [deregisterValidatorGroup](_contractkit_src_wrappers_validators_.validatorswrapper.md#deregistervalidatorgroup)
* [findValidatorMembershipHistoryIndex](_contractkit_src_wrappers_validators_.validatorswrapper.md#findvalidatormembershiphistoryindex)
* [getConfig](_contractkit_src_wrappers_validators_.validatorswrapper.md#getconfig)
* [getGroupLockedGoldRequirements](_contractkit_src_wrappers_validators_.validatorswrapper.md#getgrouplockedgoldrequirements)
* [getRegisteredValidatorGroups](_contractkit_src_wrappers_validators_.validatorswrapper.md#getregisteredvalidatorgroups)
* [getRegisteredValidators](_contractkit_src_wrappers_validators_.validatorswrapper.md#getregisteredvalidators)
* [getRegisteredValidatorsAddresses](_contractkit_src_wrappers_validators_.validatorswrapper.md#getregisteredvalidatorsaddresses)
* [getValidator](_contractkit_src_wrappers_validators_.validatorswrapper.md#getvalidator)
* [getValidatorFromSigner](_contractkit_src_wrappers_validators_.validatorswrapper.md#getvalidatorfromsigner)
* [getValidatorGroup](_contractkit_src_wrappers_validators_.validatorswrapper.md#getvalidatorgroup)
* [getValidatorLockedGoldRequirements](_contractkit_src_wrappers_validators_.validatorswrapper.md#getvalidatorlockedgoldrequirements)
* [getValidatorMembershipHistoryIndex](_contractkit_src_wrappers_validators_.validatorswrapper.md#getvalidatormembershiphistoryindex)
* [getValidatorRewards](_contractkit_src_wrappers_validators_.validatorswrapper.md#getvalidatorrewards)
* [meetsValidatorBalanceRequirements](_contractkit_src_wrappers_validators_.validatorswrapper.md#meetsvalidatorbalancerequirements)
* [meetsValidatorGroupBalanceRequirements](_contractkit_src_wrappers_validators_.validatorswrapper.md#meetsvalidatorgroupbalancerequirements)
* [registerValidatorGroup](_contractkit_src_wrappers_validators_.validatorswrapper.md#registervalidatorgroup)
* [reorderMember](_contractkit_src_wrappers_validators_.validatorswrapper.md#reordermember)
* [signerToAccount](_contractkit_src_wrappers_validators_.validatorswrapper.md#signertoaccount)
* [validatorSignerToAccount](_contractkit_src_wrappers_validators_.validatorswrapper.md#validatorsignertoaccount)

## Constructors

###  constructor

\+ **new ValidatorsWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: Validators): *[ValidatorsWrapper](_contractkit_src_wrappers_validators_.validatorswrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | Validators |

**Returns:** *[ValidatorsWrapper](_contractkit_src_wrappers_validators_.validatorswrapper.md)*

## Properties

###  affiliate

• **affiliate**: *function* = proxySend(
    this.kit,
    this.contract.methods.affiliate
  )

*Defined in [contractkit/src/wrappers/Validators.ts:441](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L441)*

Affiliates a validator with a group, allowing it to be added as a member.
De-affiliates with the previously affiliated group if present.

**`param`** The validator group with which to affiliate.

#### Type declaration:

▸ (`group`: [Address](../modules/_contractkit_src_base_.md#address)): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`group` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  deaffiliate

• **deaffiliate**: *function* = proxySend(this.kit, this.contract.methods.deaffiliate)

*Defined in [contractkit/src/wrappers/Validators.ts:451](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L451)*

De-affiliates a validator, removing it from the group for which it is a member.
Fails if the account is not a validator with non-zero affiliation.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  forceDeaffiliateIfValidator

• **forceDeaffiliateIfValidator**: *function* = proxySend(
    this.kit,
    this.contract.methods.forceDeaffiliateIfValidator
  )

*Defined in [contractkit/src/wrappers/Validators.ts:457](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L457)*

Removes a validator from the group for which it is a member.

**`param`** The validator to deaffiliate from their affiliated validator group.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getAccountLockedGoldRequirement

• **getAccountLockedGoldRequirement**: *function* = proxyCall(
    this.contract.methods.getAccountLockedGoldRequirement,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Validators.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L129)*

Returns the Locked Gold requirements for specific account.

**`returns`** The Locked Gold requirements for a specific account.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getEpochNumber

• **getEpochNumber**: *function* = proxyCall(this.contract.methods.getEpochNumber, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Validators.ts:380](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L380)*

Registers a validator unaffiliated with any validator group.

Fails if the account is already a validator or validator group.

**`param`** The address that the validator is using for consensus, should match
  the validator signer.

**`param`** The ECDSA public key that the validator is using for consensus. 64 bytes.

**`param`** The BLS public key that the validator is using for consensus, should pass proof
  of possession. 48 bytes.

**`param`** The BLS public key proof-of-possession, which consists of a signature on the
  account address. 96 bytes.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getEpochSize

• **getEpochSize**: *function* = proxyCall(this.contract.methods.getEpochSize, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Validators.ts:382](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L382)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getRegisteredValidatorGroupsAddresses

• **getRegisteredValidatorGroupsAddresses**: *function* = proxyCall(
    this.contract.methods.getRegisteredValidatorGroups
  )

*Defined in [contractkit/src/wrappers/Validators.ts:350](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L350)*

Get list of registered validator group addresses

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

___

###  getSlashingMultiplierResetPeriod

• **getSlashingMultiplierResetPeriod**: *function* = proxyCall(
    this.contract.methods.slashingMultiplierResetPeriod,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Validators.ts:138](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L138)*

Returns the reset period for slashing multiplier.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getValidatorGroupSize

• **getValidatorGroupSize**: *function* = proxyCall(
    this.contract.methods.getGroupNumMembers,
    undefined,
    valueToInt
  )

*Defined in [contractkit/src/wrappers/Validators.ts:337](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L337)*

Get the size (amount of members) of a ValidatorGroup

#### Type declaration:

▸ (`group`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹number›*

**Parameters:**

Name | Type |
------ | ------ |
`group` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  getValidatorMembershipHistory

• **getValidatorMembershipHistory**: *function* = proxyCall(
    this.contract.methods.getMembershipHistory,
    undefined,
    (res) =>
      zip((epoch, group): GroupMembership => ({ epoch: valueToInt(epoch), group }), res[0], res[1])
  )

*Defined in [contractkit/src/wrappers/Validators.ts:316](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L316)*

Returns the Validator's group membership history

**`param`** The validator whose membership history to return.

**`returns`** The group membership history of a validator.

#### Type declaration:

▸ (`validator`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[GroupMembership](../interfaces/_contractkit_src_wrappers_validators_.groupmembership.md)[]›*

**Parameters:**

Name | Type |
------ | ------ |
`validator` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  getValidatorMembershipHistoryExtraData

• **getValidatorMembershipHistoryExtraData**: *function* = proxyCall(
    this.contract.methods.getMembershipHistory,
    undefined,
    (res) => ({ lastRemovedFromGroupTimestamp: valueToInt(res[2]), tail: valueToInt(res[3]) })
  )

*Defined in [contractkit/src/wrappers/Validators.ts:328](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L328)*

Returns extra data from the Validator's group membership history

**`param`** The validator whose membership history to return.

**`returns`** The group membership history of a validator.

#### Type declaration:

▸ (`validator`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[MembershipHistoryExtraData](../interfaces/_contractkit_src_wrappers_validators_.membershiphistoryextradata.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`validator` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  isValidator

• **isValidator**: *function* = proxyCall(this.contract.methods.isValidator)

*Defined in [contractkit/src/wrappers/Validators.ts:208](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L208)*

Returns whether a particular account has a registered validator.

**`param`** The account.

**`returns`** Whether a particular address is a registered validator.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isValidatorGroup

• **isValidatorGroup**: *function* = proxyCall(this.contract.methods.isValidatorGroup)

*Defined in [contractkit/src/wrappers/Validators.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L215)*

Returns whether a particular account has a registered validator group.

**`param`** The account.

**`returns`** Whether a particular address is a registered validator group.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  registerValidator

• **registerValidator**: *function* = proxySend(
    this.kit,
    this.contract.methods.registerValidator,
    tupleParser(stringToBytes, stringToBytes, stringToBytes)
  )

*Defined in [contractkit/src/wrappers/Validators.ts:384](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L384)*

#### Type declaration:

▸ (`ecdsaPublicKey`: string, `blsPublicKey`: string, `blsPop`: string): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`ecdsaPublicKey` | string |
`blsPublicKey` | string |
`blsPop` | string |

___

###  removeMember

• **removeMember**: *function* = proxySend(this.kit, this.contract.methods.removeMember)

*Defined in [contractkit/src/wrappers/Validators.ts:495](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L495)*

Removes a member from a ValidatorGroup
The ValidatorGroup is specified by the `from` of the tx.

**`param`** The Validator to remove from the group

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  resetSlashingMultiplier

• **resetSlashingMultiplier**: *function* = proxySend(this.kit, this.contract.methods.resetSlashingMultiplier)

*Defined in [contractkit/src/wrappers/Validators.ts:466](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L466)*

Resets a group's slashing multiplier if it has been >= the reset period since
the last time the group was slashed.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setNextCommissionUpdate

• **setNextCommissionUpdate**: *function* = proxySend(
    this.kit,
    this.contract.methods.setNextCommissionUpdate,
    tupleParser(valueToFixidityString)
  )

*Defined in [contractkit/src/wrappers/Validators.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L86)*

Queues an update to a validator group's commission.

**`param`** Fixidity representation of the commission this group receives on epoch
  payments made to its members. Must be in the range [0, 1.0].

#### Type declaration:

▸ (`commission`: BigNumber.Value): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`commission` | BigNumber.Value |

___

###  updateBlsPublicKey

• **updateBlsPublicKey**: *function* = proxySend(
    this.kit,
    this.contract.methods.updateBlsPublicKey,
    tupleParser(stringToBytes, stringToBytes)
  )

*Defined in [contractkit/src/wrappers/Validators.ts:194](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L194)*

Updates a validator's BLS key.

**`param`** The BLS public key that the validator is using for consensus, should pass proof
  of possession. 48 bytes.

**`param`** The BLS public key proof-of-possession, which consists of a signature on the
  account address. 96 bytes.

**`returns`** True upon success.

#### Type declaration:

▸ (`blsPublicKey`: string, `blsPop`: string): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`blsPublicKey` | string |
`blsPop` | string |

___

###  updateCommission

• **updateCommission**: *function* = proxySend(
    this.kit,
    this.contract.methods.updateCommission
  )

*Defined in [contractkit/src/wrappers/Validators.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L96)*

Updates a validator group's commission based on the previously queued update

#### Type declaration:

▸ (): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  addMember

▸ **addMember**(`group`: [Address](../modules/_contractkit_src_base_.md#address), `validator`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Validators.ts:473](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L473)*

Adds a member to the end of a validator group's list of members.
Fails if `validator` has not set their affiliation to this account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | [Address](../modules/_contractkit_src_base_.md#address) | - |
`validator` | [Address](../modules/_contractkit_src_base_.md#address) | The validator to add to the group  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  currentSignerSet

▸ **currentSignerSet**(): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/Validators.ts:563](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L563)*

Returns the current set of validator signer addresses

**Returns:** *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

___

###  currentValidatorAccountsSet

▸ **currentValidatorAccountsSet**(): *Promise‹object[]›*

*Defined in [contractkit/src/wrappers/Validators.ts:573](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L573)*

Returns the current set of validator signer and account addresses

**Returns:** *Promise‹object[]›*

___

###  deregisterValidator

▸ **deregisterValidator**(`validatorAddress`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Validators.ts:398](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L398)*

De-registers a validator, removing it from the group for which it is a member.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorAddress` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the validator to deregister  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  deregisterValidatorGroup

▸ **deregisterValidatorGroup**(`validatorGroupAddress`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Validators.ts:426](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L426)*

De-registers a validator Group

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorGroupAddress` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the validator group to deregister  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  findValidatorMembershipHistoryIndex

▸ **findValidatorMembershipHistoryIndex**(`epoch`: number, `history`: [GroupMembership](../interfaces/_contractkit_src_wrappers_validators_.groupmembership.md)[]): *number*

*Defined in [contractkit/src/wrappers/Validators.ts:605](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L605)*

Returns the index into `history` for `epoch`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epoch` | number | The needle. |
`history` | [GroupMembership](../interfaces/_contractkit_src_wrappers_validators_.groupmembership.md)[] | The haystack. |

**Returns:** *number*

Index for epoch or -1.

___

###  getConfig

▸ **getConfig**(): *Promise‹[ValidatorsConfig](../interfaces/_contractkit_src_wrappers_validators_.validatorsconfig.md)›*

*Defined in [contractkit/src/wrappers/Validators.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L147)*

Returns current configuration parameters.

**Returns:** *Promise‹[ValidatorsConfig](../interfaces/_contractkit_src_wrappers_validators_.validatorsconfig.md)›*

___

###  getGroupLockedGoldRequirements

▸ **getGroupLockedGoldRequirements**(): *Promise‹[LockedGoldRequirements](../interfaces/_contractkit_src_wrappers_validators_.lockedgoldrequirements.md)›*

*Defined in [contractkit/src/wrappers/Validators.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L117)*

Returns the Locked Gold requirements for validator groups.

**Returns:** *Promise‹[LockedGoldRequirements](../interfaces/_contractkit_src_wrappers_validators_.lockedgoldrequirements.md)›*

The Locked Gold requirements for validator groups.

___

###  getRegisteredValidatorGroups

▸ **getRegisteredValidatorGroups**(): *Promise‹[ValidatorGroup](../interfaces/_contractkit_src_wrappers_validators_.validatorgroup.md)[]›*

*Defined in [contractkit/src/wrappers/Validators.ts:361](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L361)*

Get list of registered validator groups

**Returns:** *Promise‹[ValidatorGroup](../interfaces/_contractkit_src_wrappers_validators_.validatorgroup.md)[]›*

___

###  getRegisteredValidators

▸ **getRegisteredValidators**(`blockNumber?`: undefined | number): *Promise‹[Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md)[]›*

*Defined in [contractkit/src/wrappers/Validators.ts:355](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L355)*

Get list of registered validators

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md)[]›*

___

###  getRegisteredValidatorsAddresses

▸ **getRegisteredValidatorsAddresses**(`blockNumber?`: undefined | number): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/Validators.ts:344](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L344)*

Get list of registered validator addresses

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

___

###  getValidator

▸ **getValidator**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `blockNumber?`: undefined | number): *Promise‹[Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md)›*

*Defined in [contractkit/src/wrappers/Validators.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L243)*

Get Validator information

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md)›*

___

###  getValidatorFromSigner

▸ **getValidatorFromSigner**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `blockNumber?`: undefined | number): *Promise‹[Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md)›*

*Defined in [contractkit/src/wrappers/Validators.ts:260](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L260)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md)›*

___

###  getValidatorGroup

▸ **getValidatorGroup**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `getAffiliates`: boolean, `blockNumber?`: undefined | number): *Promise‹[ValidatorGroup](../interfaces/_contractkit_src_wrappers_validators_.validatorgroup.md)›*

*Defined in [contractkit/src/wrappers/Validators.ts:278](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L278)*

Get ValidatorGroup information

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) | - |
`getAffiliates` | boolean | true |
`blockNumber?` | undefined &#124; number | - |

**Returns:** *Promise‹[ValidatorGroup](../interfaces/_contractkit_src_wrappers_validators_.validatorgroup.md)›*

___

###  getValidatorLockedGoldRequirements

▸ **getValidatorLockedGoldRequirements**(): *Promise‹[LockedGoldRequirements](../interfaces/_contractkit_src_wrappers_validators_.lockedgoldrequirements.md)›*

*Defined in [contractkit/src/wrappers/Validators.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L105)*

Returns the Locked Gold requirements for validators.

**Returns:** *Promise‹[LockedGoldRequirements](../interfaces/_contractkit_src_wrappers_validators_.lockedgoldrequirements.md)›*

The Locked Gold requirements for validators.

___

###  getValidatorMembershipHistoryIndex

▸ **getValidatorMembershipHistoryIndex**(`validator`: [Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md), `blockNumber?`: undefined | number): *Promise‹object›*

*Defined in [contractkit/src/wrappers/Validators.ts:585](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L585)*

Returns the group membership for `validator`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validator` | [Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md) | Address of validator to retrieve group membership for. |
`blockNumber?` | undefined &#124; number | Block number to retrieve group membership at. |

**Returns:** *Promise‹object›*

Group and membership history index for `validator`.

___

###  getValidatorRewards

▸ **getValidatorRewards**(`epochNumber`: number): *Promise‹[ValidatorReward](../interfaces/_contractkit_src_wrappers_validators_.validatorreward.md)[]›*

*Defined in [contractkit/src/wrappers/Validators.ts:537](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L537)*

Retrieves ValidatorRewards for epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve ValidatorRewards at.  |

**Returns:** *Promise‹[ValidatorReward](../interfaces/_contractkit_src_wrappers_validators_.validatorreward.md)[]›*

___

###  meetsValidatorBalanceRequirements

▸ **meetsValidatorBalanceRequirements**(`address`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Validators.ts:222](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L222)*

Returns whether an account meets the requirements to register a validator.

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹boolean›*

Whether an account meets the requirements to register a validator.

___

###  meetsValidatorGroupBalanceRequirements

▸ **meetsValidatorGroupBalanceRequirements**(`address`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Validators.ts:235](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L235)*

Returns whether an account meets the requirements to register a group.

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹boolean›*

Whether an account meets the requirements to register a group.

___

###  registerValidatorGroup

▸ **registerValidatorGroup**(`commission`: BigNumber): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Validators.ts:415](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L415)*

Registers a validator group with no member validators.
Fails if the account is already a validator or validator group.
Fails if the account does not have sufficient weight.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`commission` | BigNumber | the commission this group receives on epoch payments made to its members.  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  reorderMember

▸ **reorderMember**(`groupAddr`: [Address](../modules/_contractkit_src_base_.md#address), `validator`: [Address](../modules/_contractkit_src_base_.md#address), `newIndex`: number): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Validators.ts:504](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L504)*

Reorders a member within a validator group.
Fails if `validator` is not a member of the account's validator group.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`groupAddr` | [Address](../modules/_contractkit_src_base_.md#address) | The validator group |
`validator` | [Address](../modules/_contractkit_src_base_.md#address) | The validator to reorder. |
`newIndex` | number | New position for the validator  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  signerToAccount

▸ **signerToAccount**(`signerAddress`: [Address](../modules/_contractkit_src_base_.md#address), `blockNumber?`: undefined | number): *Promise‹string›*

*Defined in [contractkit/src/wrappers/Validators.ts:181](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L181)*

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or previously authorized signer.

**Parameters:**

Name | Type |
------ | ------ |
`signerAddress` | [Address](../modules/_contractkit_src_base_.md#address) |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹string›*

The associated account.

___

###  validatorSignerToAccount

▸ **validatorSignerToAccount**(`signerAddress`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹string›*

*Defined in [contractkit/src/wrappers/Validators.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L170)*

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or currently authorized validator.

**Parameters:**

Name | Type |
------ | ------ |
`signerAddress` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹string›*

The associated account.
