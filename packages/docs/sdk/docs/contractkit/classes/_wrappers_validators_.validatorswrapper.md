[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/Validators"](../modules/_wrappers_validators_.md) › [ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)

# Class: ValidatorsWrapper

Contract for voting for validators and managing validator groups.

## Hierarchy

  ↳ [BaseWrapperForGoverning](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md)‹Validators›

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
* [getDowntimeGracePeriod](_wrappers_validators_.validatorswrapper.md#getdowntimegraceperiod)
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
* [getEpochNumberOfBlock](_wrappers_validators_.validatorswrapper.md#getepochnumberofblock)
* [getEpochSizeNumber](_wrappers_validators_.validatorswrapper.md#getepochsizenumber)
* [getGroupLockedGoldRequirements](_wrappers_validators_.validatorswrapper.md#getgrouplockedgoldrequirements)
* [getHumanReadableConfig](_wrappers_validators_.validatorswrapper.md#gethumanreadableconfig)
* [getLastBlockNumberForEpoch](_wrappers_validators_.validatorswrapper.md#getlastblocknumberforepoch)
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
* [version](_wrappers_validators_.validatorswrapper.md#version)

## Constructors

###  constructor

\+ **new ValidatorsWrapper**(`connection`: Connection, `contract`: Validators, `contracts`: ContractWrappersForVotingAndRules): *[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)*

*Inherited from [ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md).[constructor](_wrappers_validators_.validatorswrapper.md#constructor)*

*Overrides [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | Validators |
`contracts` | ContractWrappersForVotingAndRules |

**Returns:** *[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)*

## Properties

###  affiliate

• **affiliate**: *function* = proxySend(
    this.connection,
    this.contract.methods.affiliate
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:485](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L485)*

Affiliates a validator with a group, allowing it to be added as a member.
De-affiliates with the previously affiliated group if present.

**`param`** The validator group with which to affiliate.

#### Type declaration:

▸ (`group`: Address): *CeloTransactionObject‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`group` | Address |

___

###  deaffiliate

• **deaffiliate**: *function* = proxySend(this.connection, this.contract.methods.deaffiliate)

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:495](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L495)*

De-affiliates a validator, removing it from the group for which it is a member.
Fails if the account is not a validator with non-zero affiliation.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

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

• **events**: *Validators["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  forceDeaffiliateIfValidator

• **forceDeaffiliateIfValidator**: *function* = proxySend(
    this.connection,
    this.contract.methods.forceDeaffiliateIfValidator
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:501](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L501)*

Removes a validator from the group for which it is a member.

**`param`** The validator to deaffiliate from their affiliated validator group.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L129)*

Returns the Locked Gold requirements for specific account.

**`returns`** The Locked Gold requirements for a specific account.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getCommissionUpdateDelay

• **getCommissionUpdateDelay**: *function* = proxyCall(
    this.contract.methods.commissionUpdateDelay,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L147)*

Returns the update delay, in blocks, for the group commission.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getDowntimeGracePeriod

• **getDowntimeGracePeriod**: *function* = proxyCall(
    this.contract.methods.downtimeGracePeriod,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L156)*

Returns the validator downtime grace period

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getEpochNumber

• **getEpochNumber**: *function* = proxyCall(this.contract.methods.getEpochNumber, undefined, valueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:434](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L434)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getEpochSize

• **getEpochSize**: *function* = proxyCall(this.contract.methods.getEpochSize, undefined, valueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:436](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L436)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:395](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L395)*

Get list of registered validator group addresses

#### Type declaration:

▸ (): *Promise‹Address[]›*

___

###  getSlashingMultiplierResetPeriod

• **getSlashingMultiplierResetPeriod**: *function* = proxyCall(
    this.contract.methods.slashingMultiplierResetPeriod,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:138](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L138)*

Returns the reset period, in seconds, for slashing multiplier.

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

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:382](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L382)*

Get the size (amount of members) of a ValidatorGroup

#### Type declaration:

▸ (`group`: Address): *Promise‹number›*

**Parameters:**

Name | Type |
------ | ------ |
`group` | Address |

___

###  getValidatorMembershipHistory

• **getValidatorMembershipHistory**: *function* = proxyCall(
    this.contract.methods.getMembershipHistory,
    undefined,
    (res) =>
      zip((epoch, group): GroupMembership => ({ epoch: valueToInt(epoch), group }), res[0], res[1])
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:361](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L361)*

Returns the Validator's group membership history

**`param`** The validator whose membership history to return.

**`returns`** The group membership history of a validator.

#### Type declaration:

▸ (`validator`: Address): *Promise‹[GroupMembership](../interfaces/_wrappers_validators_.groupmembership.md)[]›*

**Parameters:**

Name | Type |
------ | ------ |
`validator` | Address |

___

###  getValidatorMembershipHistoryExtraData

• **getValidatorMembershipHistoryExtraData**: *function* = proxyCall(
    this.contract.methods.getMembershipHistory,
    undefined,
    (res) => ({ lastRemovedFromGroupTimestamp: valueToInt(res[2]), tail: valueToInt(res[3]) })
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:373](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L373)*

Returns extra data from the Validator's group membership history

**`param`** The validator whose membership history to return.

**`returns`** The group membership history of a validator.

#### Type declaration:

▸ (`validator`: Address): *Promise‹[MembershipHistoryExtraData](../interfaces/_wrappers_validators_.membershiphistoryextradata.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`validator` | Address |

___

###  isValidator

• **isValidator**: *function* = proxyCall(this.contract.methods.isValidator)

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:253](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L253)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:260](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L260)*

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

###  registerValidator

• **registerValidator**: *function* = proxySend(
    this.connection,
    this.contract.methods.registerValidator,
    tupleParser(stringToSolidityBytes, stringToSolidityBytes, stringToSolidityBytes)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:424](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L424)*

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

▸ (`ecdsaPublicKey`: string, `blsPublicKey`: string, `blsPop`: string): *CeloTransactionObject‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`ecdsaPublicKey` | string |
`blsPublicKey` | string |
`blsPop` | string |

___

###  removeMember

• **removeMember**: *function* = proxySend(this.connection, this.contract.methods.removeMember)

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:542](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L542)*

Removes a member from a ValidatorGroup
The ValidatorGroup is specified by the `from` of the tx.

**`param`** The Validator to remove from the group

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  resetSlashingMultiplier

• **resetSlashingMultiplier**: *function* = proxySend(
    this.connection,
    this.contract.methods.resetSlashingMultiplier
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:510](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L510)*

Resets a group's slashing multiplier if it has been >= the reset period since
the last time the group was slashed.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  setNextCommissionUpdate

• **setNextCommissionUpdate**: *function* = proxySend(
    this.connection,
    this.contract.methods.setNextCommissionUpdate,
    tupleParser(valueToFixidityString)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L87)*

Queues an update to a validator group's commission.

**`param`** Fixidity representation of the commission this group receives on epoch
  payments made to its members. Must be in the range [0, 1.0].

#### Type declaration:

▸ (`commission`: BigNumber.Value): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`commission` | BigNumber.Value |

___

###  updateBlsPublicKey

• **updateBlsPublicKey**: *function* = proxySend(
    this.connection,
    this.contract.methods.updateBlsPublicKey,
    tupleParser(stringToSolidityBytes, stringToSolidityBytes)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L239)*

Updates a validator's BLS key.

**`param`** The BLS public key that the validator is using for consensus, should pass proof
  of possession. 48 bytes.

**`param`** The BLS public key proof-of-possession, which consists of a signature on the
  account address. 96 bytes.

**`returns`** True upon success.

#### Type declaration:

▸ (`blsPublicKey`: string, `blsPop`: string): *CeloTransactionObject‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`blsPublicKey` | string |
`blsPop` | string |

___

###  updateCommission

• **updateCommission**: *function* = proxySend(
    this.connection,
    this.contract.methods.updateCommission
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L96)*

Updates a validator group's commission based on the previously queued update

#### Type declaration:

▸ (): *CeloTransactionObject‹void›*

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  addMember

▸ **addMember**(`group`: Address, `validator`: Address): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:520](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L520)*

Adds a member to the end of a validator group's list of members.
Fails if `validator` has not set their affiliation to this account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | Address | - |
`validator` | Address | The validator to add to the group  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  currentSignerSet

▸ **currentSignerSet**(): *Promise‹Address[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:628](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L628)*

Returns the current set of validator signer addresses

**Returns:** *Promise‹Address[]›*

___

###  currentValidatorAccountsSet

▸ **currentValidatorAccountsSet**(): *Promise‹object[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:638](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L638)*

Returns the current set of validator signer and account addresses

**Returns:** *Promise‹object[]›*

___

###  deregisterValidator

▸ **deregisterValidator**(`validatorAddress`: Address): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:442](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L442)*

De-registers a validator, removing it from the group for which it is a member.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorAddress` | Address | Address of the validator to deregister  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  deregisterValidatorGroup

▸ **deregisterValidatorGroup**(`validatorGroupAddress`: Address): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:470](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L470)*

De-registers a validator Group

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorGroupAddress` | Address | Address of the validator group to deregister  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  findValidatorMembershipHistoryIndex

▸ **findValidatorMembershipHistoryIndex**(`epoch`: number, `history`: [GroupMembership](../interfaces/_wrappers_validators_.groupmembership.md)[]): *number*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:671](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L671)*

Returns the index into `history` for `epoch`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epoch` | number | The needle. |
`history` | [GroupMembership](../interfaces/_wrappers_validators_.groupmembership.md)[] | The haystack. |

**Returns:** *number*

Index for epoch or -1.

___

###  getConfig

▸ **getConfig**(): *Promise‹[ValidatorsConfig](../interfaces/_wrappers_validators_.validatorsconfig.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:165](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L165)*

Returns current configuration parameters.

**Returns:** *Promise‹[ValidatorsConfig](../interfaces/_wrappers_validators_.validatorsconfig.md)›*

___

###  getEpochNumberOfBlock

▸ **getEpochNumberOfBlock**(`blockNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:592](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L592)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹number›*

___

###  getEpochSizeNumber

▸ **getEpochSizeNumber**(): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:580](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L580)*

**Returns:** *Promise‹number›*

___

###  getGroupLockedGoldRequirements

▸ **getGroupLockedGoldRequirements**(): *Promise‹[LockedGoldRequirements](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L117)*

Returns the Locked Gold requirements for validator groups.

**Returns:** *Promise‹[LockedGoldRequirements](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)›*

The Locked Gold requirements for validator groups.

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:190](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L190)*

**`dev`** Returns human readable configuration of the validators contract

**Returns:** *Promise‹object›*

ValidatorsConfig object

___

###  getLastBlockNumberForEpoch

▸ **getLastBlockNumberForEpoch**(`epochNumber`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:586](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L586)*

**Parameters:**

Name | Type |
------ | ------ |
`epochNumber` | number |

**Returns:** *Promise‹number›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Validators›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Validators› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getRegisteredValidatorGroups

▸ **getRegisteredValidatorGroups**(): *Promise‹[ValidatorGroup](../interfaces/_wrappers_validators_.validatorgroup.md)[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:406](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L406)*

Get list of registered validator groups

**Returns:** *Promise‹[ValidatorGroup](../interfaces/_wrappers_validators_.validatorgroup.md)[]›*

___

###  getRegisteredValidators

▸ **getRegisteredValidators**(`blockNumber?`: undefined | number): *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:400](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L400)*

Get list of registered validators

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)[]›*

___

###  getRegisteredValidatorsAddresses

▸ **getRegisteredValidatorsAddresses**(`blockNumber?`: undefined | number): *Promise‹Address[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:389](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L389)*

Get list of registered validator addresses

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹Address[]›*

___

###  getValidator

▸ **getValidator**(`address`: Address, `blockNumber?`: undefined | number): *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:288](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L288)*

Get Validator information

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)›*

___

###  getValidatorFromSigner

▸ **getValidatorFromSigner**(`address`: Address, `blockNumber?`: undefined | number): *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:305](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L305)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)›*

___

###  getValidatorGroup

▸ **getValidatorGroup**(`address`: Address, `getAffiliates`: boolean, `blockNumber?`: undefined | number): *Promise‹[ValidatorGroup](../interfaces/_wrappers_validators_.validatorgroup.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:323](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L323)*

Get ValidatorGroup information

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`address` | Address | - |
`getAffiliates` | boolean | true |
`blockNumber?` | undefined &#124; number | - |

**Returns:** *Promise‹[ValidatorGroup](../interfaces/_wrappers_validators_.validatorgroup.md)›*

___

###  getValidatorLockedGoldRequirements

▸ **getValidatorLockedGoldRequirements**(): *Promise‹[LockedGoldRequirements](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L105)*

Returns the Locked Gold requirements for validators.

**Returns:** *Promise‹[LockedGoldRequirements](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)›*

The Locked Gold requirements for validators.

___

###  getValidatorMembershipHistoryIndex

▸ **getValidatorMembershipHistoryIndex**(`account`: Address, `blockNumber?`: undefined | number): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:652](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L652)*

Returns the group membership for validator account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | Address | Address of validator account to retrieve group membership for. |
`blockNumber?` | undefined &#124; number | Block number to retrieve group membership at. |

**Returns:** *Promise‹object›*

Group and membership history index for `validator`.

___

###  getValidatorRewards

▸ **getValidatorRewards**(`epochNumber`: number): *Promise‹[ValidatorReward](../interfaces/_wrappers_validators_.validatorreward.md)[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:602](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L602)*

Retrieves ValidatorRewards for epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve ValidatorRewards at.  |

**Returns:** *Promise‹[ValidatorReward](../interfaces/_wrappers_validators_.validatorreward.md)[]›*

___

###  meetsValidatorBalanceRequirements

▸ **meetsValidatorBalanceRequirements**(`address`: Address): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L267)*

Returns whether an account meets the requirements to register a validator.

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *Promise‹boolean›*

Whether an account meets the requirements to register a validator.

___

###  meetsValidatorGroupBalanceRequirements

▸ **meetsValidatorGroupBalanceRequirements**(`address`: Address): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:280](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L280)*

Returns whether an account meets the requirements to register a group.

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *Promise‹boolean›*

Whether an account meets the requirements to register a group.

___

###  registerValidatorGroup

▸ **registerValidatorGroup**(`commission`: BigNumber): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:459](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L459)*

Registers a validator group with no member validators.
Fails if the account is already a validator or validator group.
Fails if the account does not have sufficient weight.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`commission` | BigNumber | the commission this group receives on epoch payments made to its members.  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  reorderMember

▸ **reorderMember**(`groupAddr`: Address, `validator`: Address, `newIndex`: number): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:551](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L551)*

Reorders a member within a validator group.
Fails if `validator` is not a member of the account's validator group.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`groupAddr` | Address | The validator group |
`validator` | Address | The validator to reorder. |
`newIndex` | number | New position for the validator  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  signerToAccount

▸ **signerToAccount**(`signerAddress`: Address): *Promise‹string›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:226](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L226)*

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or previously authorized signer.

**Parameters:**

Name | Type |
------ | ------ |
`signerAddress` | Address |

**Returns:** *Promise‹string›*

The associated account.

___

###  validatorSignerToAccount

▸ **validatorSignerToAccount**(`signerAddress`: Address): *Promise‹string›*

*Defined in [packages/sdk/contractkit/src/wrappers/Validators.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Validators.ts#L215)*

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or currently authorized validator.

**Parameters:**

Name | Type |
------ | ------ |
`signerAddress` | Address |

**Returns:** *Promise‹string›*

The associated account.

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
