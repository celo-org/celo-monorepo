# Class: ValidatorsWrapper

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
* [forceDeaffiliateIfValidator](_wrappers_validators_.validatorswrapper.md#forcedeaffiliateifvalidator)
* [getAccountLockedGoldRequirement](_wrappers_validators_.validatorswrapper.md#getaccountlockedgoldrequirement)
* [getEpochNumber](_wrappers_validators_.validatorswrapper.md#getepochnumber)
* [getEpochSize](_wrappers_validators_.validatorswrapper.md#getepochsize)
* [getRegisteredValidatorGroupsAddresses](_wrappers_validators_.validatorswrapper.md#getregisteredvalidatorgroupsaddresses)
* [getValidatorGroupSize](_wrappers_validators_.validatorswrapper.md#getvalidatorgroupsize)
* [getValidatorMembershipHistory](_wrappers_validators_.validatorswrapper.md#getvalidatormembershiphistory)
* [isValidator](_wrappers_validators_.validatorswrapper.md#isvalidator)
* [isValidatorGroup](_wrappers_validators_.validatorswrapper.md#isvalidatorgroup)
* [registerValidator](_wrappers_validators_.validatorswrapper.md#registervalidator)
* [removeMember](_wrappers_validators_.validatorswrapper.md#removemember)
* [updateBlsPublicKey](_wrappers_validators_.validatorswrapper.md#updateblspublickey)

### Accessors

* [address](_wrappers_validators_.validatorswrapper.md#address)

### Methods

* [addMember](_wrappers_validators_.validatorswrapper.md#addmember)
* [currentSignerSet](_wrappers_validators_.validatorswrapper.md#currentsignerset)
* [currentValidatorAccountsSet](_wrappers_validators_.validatorswrapper.md#currentvalidatoraccountsset)
* [deregisterValidator](_wrappers_validators_.validatorswrapper.md#deregistervalidator)
* [deregisterValidatorGroup](_wrappers_validators_.validatorswrapper.md#deregistervalidatorgroup)
* [getConfig](_wrappers_validators_.validatorswrapper.md#getconfig)
* [getGroupLockedGoldRequirements](_wrappers_validators_.validatorswrapper.md#getgrouplockedgoldrequirements)
* [getRegisteredValidatorGroups](_wrappers_validators_.validatorswrapper.md#getregisteredvalidatorgroups)
* [getRegisteredValidators](_wrappers_validators_.validatorswrapper.md#getregisteredvalidators)
* [getRegisteredValidatorsAddresses](_wrappers_validators_.validatorswrapper.md#getregisteredvalidatorsaddresses)
* [getValidator](_wrappers_validators_.validatorswrapper.md#getvalidator)
* [getValidatorFromSigner](_wrappers_validators_.validatorswrapper.md#getvalidatorfromsigner)
* [getValidatorGroup](_wrappers_validators_.validatorswrapper.md#getvalidatorgroup)
* [getValidatorLockedGoldRequirements](_wrappers_validators_.validatorswrapper.md#getvalidatorlockedgoldrequirements)
* [getValidatorRewards](_wrappers_validators_.validatorswrapper.md#getvalidatorrewards)
* [meetsValidatorBalanceRequirements](_wrappers_validators_.validatorswrapper.md#meetsvalidatorbalancerequirements)
* [meetsValidatorGroupBalanceRequirements](_wrappers_validators_.validatorswrapper.md#meetsvalidatorgroupbalancerequirements)
* [registerValidatorGroup](_wrappers_validators_.validatorswrapper.md#registervalidatorgroup)
* [reorderMember](_wrappers_validators_.validatorswrapper.md#reordermember)
* [signerToAccount](_wrappers_validators_.validatorswrapper.md#signertoaccount)
* [updateCommission](_wrappers_validators_.validatorswrapper.md#updatecommission)
* [validatorSignerToAccount](_wrappers_validators_.validatorswrapper.md#validatorsignertoaccount)

## Constructors

###  constructor

\+ **new ValidatorsWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Validators): *[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:14](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/BaseWrapper.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Validators |

**Returns:** *[ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)*

## Properties

###  affiliate

• **affiliate**: *function* = proxySend(
    this.kit,
    this.contract.methods.affiliate
  )

*Defined in [packages/contractkit/src/wrappers/Validators.ts:373](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L373)*

Affiliates a validator with a group, allowing it to be added as a member.
De-affiliates with the previously affiliated group if present.

**`param`** The validator group with which to affiliate.

#### Type declaration:

▸ (`group`: [Address](../modules/_base_.md#address)): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`group` | [Address](../modules/_base_.md#address) |

___

###  deaffiliate

• **deaffiliate**: *function* = proxySend(this.kit, this.contract.methods.deaffiliate)

*Defined in [packages/contractkit/src/wrappers/Validators.ts:383](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L383)*

De-affiliates a validator, removing it from the group for which it is a member.
Fails if the account is not a validator with non-zero affiliation.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  forceDeaffiliateIfValidator

• **forceDeaffiliateIfValidator**: *function* = proxySend(
    this.kit,
    this.contract.methods.forceDeaffiliateIfValidator
  )

*Defined in [packages/contractkit/src/wrappers/Validators.ts:385](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L385)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

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

*Defined in [packages/contractkit/src/wrappers/Validators.ts:103](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L103)*

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

*Defined in [packages/contractkit/src/wrappers/Validators.ts:312](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L312)*

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

*Defined in [packages/contractkit/src/wrappers/Validators.ts:314](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L314)*

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

*Defined in [packages/contractkit/src/wrappers/Validators.ts:282](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L282)*

Get list of registered validator group addresses

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_base_.md#address)[]›*

___

###  getValidatorGroupSize

• **getValidatorGroupSize**: *function* = proxyCall(
    this.contract.methods.getGroupNumMembers,
    undefined,
    valueToInt
  )

*Defined in [packages/contractkit/src/wrappers/Validators.ts:269](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L269)*

Get the size (amount of members) of a ValidatorGroup

#### Type declaration:

▸ (`group`: [Address](../modules/_base_.md#address)): *Promise‹number›*

**Parameters:**

Name | Type |
------ | ------ |
`group` | [Address](../modules/_base_.md#address) |

___

###  getValidatorMembershipHistory

• **getValidatorMembershipHistory**: *function* = proxyCall(
    this.contract.methods.getMembershipHistory,
    undefined,
    (res) =>
      zip((epoch, group): GroupMembership => ({ epoch: valueToInt(epoch), group }), res[0], res[1])
  )

*Defined in [packages/contractkit/src/wrappers/Validators.ts:261](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L261)*

Returns the Validator's group membership history

**`param`** The validator whose membership history to return.

**`returns`** The group membership history of a validator.

#### Type declaration:

▸ (`validator`: [Address](../modules/_base_.md#address)): *Promise‹[GroupMembership](../interfaces/_wrappers_validators_.groupmembership.md)[]›*

**Parameters:**

Name | Type |
------ | ------ |
`validator` | [Address](../modules/_base_.md#address) |

___

###  isValidator

• **isValidator**: *function* = proxyCall(this.contract.methods.isValidator)

*Defined in [packages/contractkit/src/wrappers/Validators.ts:169](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L169)*

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

*Defined in [packages/contractkit/src/wrappers/Validators.ts:176](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L176)*

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

*Defined in [packages/contractkit/src/wrappers/Validators.ts:316](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L316)*

#### Type declaration:

▸ (`ecdsaPublicKey`: string, `blsPublicKey`: string, `blsPop`: string): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`ecdsaPublicKey` | string |
`blsPublicKey` | string |
`blsPop` | string |

___

###  removeMember

• **removeMember**: *function* = proxySend(this.kit, this.contract.methods.removeMember)

*Defined in [packages/contractkit/src/wrappers/Validators.ts:417](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L417)*

Removes a member from a ValidatorGroup
The ValidatorGroup is specified by the `from` of the tx.

**`param`** The Validator to remove from the group

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  updateBlsPublicKey

• **updateBlsPublicKey**: *function* = proxySend(
    this.kit,
    this.contract.methods.updateBlsPublicKey,
    tupleParser(stringToBytes, stringToBytes)
  )

*Defined in [packages/contractkit/src/wrappers/Validators.ts:155](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L155)*

Updates a validator's BLS key.

**`param`** The BLS public key that the validator is using for consensus, should pass proof
  of possession. 48 bytes.

**`param`** The BLS public key proof-of-possession, which consists of a signature on the
  account address. 96 bytes.

**`returns`** True upon success.

#### Type declaration:

▸ (`blsPublicKey`: string, `blsPop`: string): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`blsPublicKey` | string |
`blsPop` | string |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:18](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/BaseWrapper.ts#L18)*

Contract address

**Returns:** *string*

## Methods

###  addMember

▸ **addMember**(`group`: [Address](../modules/_base_.md#address), `validator`: [Address](../modules/_base_.md#address)): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:395](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L395)*

Adds a member to the end of a validator group's list of members.
Fails if `validator` has not set their affiliation to this account.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | [Address](../modules/_base_.md#address) | - |
`validator` | [Address](../modules/_base_.md#address) | The validator to add to the group  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  currentSignerSet

▸ **currentSignerSet**(): *Promise‹[Address](../modules/_base_.md#address)[]›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:485](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L485)*

Returns the current set of validator signer addresses

**Returns:** *Promise‹[Address](../modules/_base_.md#address)[]›*

___

###  currentValidatorAccountsSet

▸ **currentValidatorAccountsSet**(): *Promise‹object[]›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:495](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L495)*

Returns the current set of validator signer and account addresses

**Returns:** *Promise‹object[]›*

___

###  deregisterValidator

▸ **deregisterValidator**(`validatorAddress`: [Address](../modules/_base_.md#address)): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:330](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L330)*

De-registers a validator, removing it from the group for which it is a member.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorAddress` | [Address](../modules/_base_.md#address) | Address of the validator to deregister  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  deregisterValidatorGroup

▸ **deregisterValidatorGroup**(`validatorGroupAddress`: [Address](../modules/_base_.md#address)): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:358](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L358)*

De-registers a validator Group

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorGroupAddress` | [Address](../modules/_base_.md#address) | Address of the validator group to deregister  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  getConfig

▸ **getConfig**(): *Promise‹[ValidatorsConfig](../interfaces/_wrappers_validators_.validatorsconfig.md)›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:112](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L112)*

Returns current configuration parameters.

**Returns:** *Promise‹[ValidatorsConfig](../interfaces/_wrappers_validators_.validatorsconfig.md)›*

___

###  getGroupLockedGoldRequirements

▸ **getGroupLockedGoldRequirements**(): *Promise‹[LockedGoldRequirements](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:91](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L91)*

Returns the Locked Gold requirements for validator groups.

**Returns:** *Promise‹[LockedGoldRequirements](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)›*

The Locked Gold requirements for validator groups.

___

###  getRegisteredValidatorGroups

▸ **getRegisteredValidatorGroups**(): *Promise‹[ValidatorGroup](../interfaces/_wrappers_validators_.validatorgroup.md)[]›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:293](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L293)*

Get list of registered validator groups

**Returns:** *Promise‹[ValidatorGroup](../interfaces/_wrappers_validators_.validatorgroup.md)[]›*

___

###  getRegisteredValidators

▸ **getRegisteredValidators**(`blockNumber?`: undefined | number): *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)[]›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:287](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L287)*

Get list of registered validators

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)[]›*

___

###  getRegisteredValidatorsAddresses

▸ **getRegisteredValidatorsAddresses**(`blockNumber?`: undefined | number): *Promise‹[Address](../modules/_base_.md#address)[]›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:276](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L276)*

Get list of registered validator addresses

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)[]›*

___

###  getValidator

▸ **getValidator**(`address`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:204](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L204)*

Get Validator information

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)›*

___

###  getValidatorFromSigner

▸ **getValidatorFromSigner**(`address`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:221](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L221)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)›*

___

###  getValidatorGroup

▸ **getValidatorGroup**(`address`: [Address](../modules/_base_.md#address), `getAffiliates`: boolean, `blockNumber?`: undefined | number): *Promise‹[ValidatorGroup](../interfaces/_wrappers_validators_.validatorgroup.md)›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:227](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L227)*

Get ValidatorGroup information

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | - |
`getAffiliates` | boolean | true |
`blockNumber?` | undefined &#124; number | - |

**Returns:** *Promise‹[ValidatorGroup](../interfaces/_wrappers_validators_.validatorgroup.md)›*

___

###  getValidatorLockedGoldRequirements

▸ **getValidatorLockedGoldRequirements**(): *Promise‹[LockedGoldRequirements](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:79](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L79)*

Returns the Locked Gold requirements for validators.

**Returns:** *Promise‹[LockedGoldRequirements](../interfaces/_wrappers_validators_.lockedgoldrequirements.md)›*

The Locked Gold requirements for validators.

___

###  getValidatorRewards

▸ **getValidatorRewards**(`epochNumber`: number): *Promise‹[ValidatorReward](../interfaces/_wrappers_validators_.validatorreward.md)[]›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:459](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L459)*

Retrieves ValidatorRewards for epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve ValidatorRewards at.  |

**Returns:** *Promise‹[ValidatorReward](../interfaces/_wrappers_validators_.validatorreward.md)[]›*

___

###  meetsValidatorBalanceRequirements

▸ **meetsValidatorBalanceRequirements**(`address`: [Address](../modules/_base_.md#address)): *Promise‹boolean›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:183](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L183)*

Returns whether an account meets the requirements to register a validator.

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹boolean›*

Whether an account meets the requirements to register a validator.

___

###  meetsValidatorGroupBalanceRequirements

▸ **meetsValidatorGroupBalanceRequirements**(`address`: [Address](../modules/_base_.md#address)): *Promise‹boolean›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:196](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L196)*

Returns whether an account meets the requirements to register a group.

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹boolean›*

Whether an account meets the requirements to register a group.

___

###  registerValidatorGroup

▸ **registerValidatorGroup**(`commission`: BigNumber): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:347](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L347)*

Registers a validator group with no member validators.
Fails if the account is already a validator or validator group.
Fails if the account does not have sufficient weight.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`commission` | BigNumber | the commission this group receives on epoch payments made to its members.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  reorderMember

▸ **reorderMember**(`groupAddr`: [Address](../modules/_base_.md#address), `validator`: [Address](../modules/_base_.md#address), `newIndex`: number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:426](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L426)*

Reorders a member within a validator group.
Fails if `validator` is not a member of the account's validator group.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`groupAddr` | [Address](../modules/_base_.md#address) | The validator group |
`validator` | [Address](../modules/_base_.md#address) | The validator to reorder. |
`newIndex` | number | New position for the validator  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  signerToAccount

▸ **signerToAccount**(`signerAddress`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹string›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:142](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L142)*

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or previously authorized signer.

**Parameters:**

Name | Type |
------ | ------ |
`signerAddress` | [Address](../modules/_base_.md#address) |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹string›*

The associated account.

___

###  updateCommission

▸ **updateCommission**(`commission`: BigNumber): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:69](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`commission` | BigNumber |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  validatorSignerToAccount

▸ **validatorSignerToAccount**(`signerAddress`: [Address](../modules/_base_.md#address)): *Promise‹string›*

*Defined in [packages/contractkit/src/wrappers/Validators.ts:131](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/wrappers/Validators.ts#L131)*

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or currently authorized validator.

**Parameters:**

Name | Type |
------ | ------ |
`signerAddress` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹string›*

The associated account.
