# ValidatorsWrapper

Contract for voting for validators and managing validator groups.

## Hierarchy

* [BaseWrapper]()‹Validators›

  ↳ **ValidatorsWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [affiliate]()
* [deaffiliate]()
* [events]()
* [forceDeaffiliateIfValidator]()
* [getAccountLockedGoldRequirement]()
* [getCommissionUpdateDelay]()
* [getEpochNumber]()
* [getEpochSize]()
* [getRegisteredValidatorGroupsAddresses]()
* [getSlashingMultiplierResetPeriod]()
* [getValidatorGroupSize]()
* [getValidatorMembershipHistory]()
* [getValidatorMembershipHistoryExtraData]()
* [isValidator]()
* [isValidatorGroup]()
* [registerValidator]()
* [removeMember]()
* [resetSlashingMultiplier]()
* [setNextCommissionUpdate]()
* [updateBlsPublicKey]()
* [updateCommission]()

### Accessors

* [address]()

### Methods

* [addMember]()
* [currentSignerSet]()
* [currentValidatorAccountsSet]()
* [deregisterValidator]()
* [deregisterValidatorGroup]()
* [findValidatorMembershipHistoryIndex]()
* [getConfig]()
* [getGroupLockedGoldRequirements]()
* [getRegisteredValidatorGroups]()
* [getRegisteredValidators]()
* [getRegisteredValidatorsAddresses]()
* [getValidator]()
* [getValidatorFromSigner]()
* [getValidatorGroup]()
* [getValidatorLockedGoldRequirements]()
* [getValidatorMembershipHistoryIndex]()
* [getValidatorRewards]()
* [meetsValidatorBalanceRequirements]()
* [meetsValidatorGroupBalanceRequirements]()
* [registerValidatorGroup]()
* [reorderMember]()
* [signerToAccount]()
* [validatorSignerToAccount]()

## Constructors

### constructor

+ **new ValidatorsWrapper**\(`kit`: [ContractKit](), `contract`: Validators\): [_ValidatorsWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Validators |

**Returns:** [_ValidatorsWrapper_]()

## Properties

### affiliate

• **affiliate**: _function_ = proxySend\( this.kit, this.contract.methods.affiliate \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:452_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L452)

Affiliates a validator with a group, allowing it to be added as a member. De-affiliates with the previously affiliated group if present.

**`param`** The validator group with which to affiliate.

#### Type declaration:

▸ \(`group`: [Address](_base_.md#address)\): [_CeloTransactionObject_]()_‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `group` | [Address](_base_.md#address) |

### deaffiliate

• **deaffiliate**: _function_ = proxySend\(this.kit, this.contract.methods.deaffiliate\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:462_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L462)

De-affiliates a validator, removing it from the group for which it is a member. Fails if the account is not a validator with non-zero affiliation.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### forceDeaffiliateIfValidator

• **forceDeaffiliateIfValidator**: _function_ = proxySend\( this.kit, this.contract.methods.forceDeaffiliateIfValidator \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:468_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L468)

Removes a validator from the group for which it is a member.

**`param`** The validator to deaffiliate from their affiliated validator group.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getAccountLockedGoldRequirement

• **getAccountLockedGoldRequirement**: _function_ = proxyCall\( this.contract.methods.getAccountLockedGoldRequirement, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L129)

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

_Defined in_ [_contractkit/src/wrappers/Validators.ts:147_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L147)

Returns the update delay, in blocks, for the group commission.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getEpochNumber

• **getEpochNumber**: _function_ = proxyCall\(this.contract.methods.getEpochNumber, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:391_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L391)

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

_Defined in_ [_contractkit/src/wrappers/Validators.ts:393_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L393)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getRegisteredValidatorGroupsAddresses

• **getRegisteredValidatorGroupsAddresses**: _function_ = proxyCall\( this.contract.methods.getRegisteredValidatorGroups \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:361_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L361)

Get list of registered validator group addresses

#### Type declaration:

▸ \(\): _Promise‹_[_Address_](_base_.md#address)_\[\]›_

### getSlashingMultiplierResetPeriod

• **getSlashingMultiplierResetPeriod**: _function_ = proxyCall\( this.contract.methods.slashingMultiplierResetPeriod, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:138_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L138)

Returns the reset period, in seconds, for slashing multiplier.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getValidatorGroupSize

• **getValidatorGroupSize**: _function_ = proxyCall\( this.contract.methods.getGroupNumMembers, undefined, valueToInt \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:348_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L348)

Get the size \(amount of members\) of a ValidatorGroup

#### Type declaration:

▸ \(`group`: [Address](_base_.md#address)\): _Promise‹number›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `group` | [Address](_base_.md#address) |

### getValidatorMembershipHistory

• **getValidatorMembershipHistory**: _function_ = proxyCall\( this.contract.methods.getMembershipHistory, undefined, \(res\) =&gt; zip\(\(epoch, group\): GroupMembership =&gt; \({ epoch: valueToInt\(epoch\), group }\), res\[0\], res\[1\]\) \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:327_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L327)

Returns the Validator's group membership history

**`param`** The validator whose membership history to return.

**`returns`** The group membership history of a validator.

#### Type declaration:

▸ \(`validator`: [Address](_base_.md#address)\): _Promise‹_[_GroupMembership_]()_\[\]›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `validator` | [Address](_base_.md#address) |

### getValidatorMembershipHistoryExtraData

• **getValidatorMembershipHistoryExtraData**: _function_ = proxyCall\( this.contract.methods.getMembershipHistory, undefined, \(res\) =&gt; \({ lastRemovedFromGroupTimestamp: valueToInt\(res\[2\]\), tail: valueToInt\(res\[3\]\) }\) \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:339_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L339)

Returns extra data from the Validator's group membership history

**`param`** The validator whose membership history to return.

**`returns`** The group membership history of a validator.

#### Type declaration:

▸ \(`validator`: [Address](_base_.md#address)\): _Promise‹_[_MembershipHistoryExtraData_]()_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `validator` | [Address](_base_.md#address) |

### isValidator

• **isValidator**: _function_ = proxyCall\(this.contract.methods.isValidator\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:219_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L219)

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

_Defined in_ [_contractkit/src/wrappers/Validators.ts:226_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L226)

Returns whether a particular account has a registered validator group.

**`param`** The account.

**`returns`** Whether a particular address is a registered validator group.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### registerValidator

• **registerValidator**: _function_ = proxySend\( this.kit, this.contract.methods.registerValidator, tupleParser\(stringToBytes, stringToBytes, stringToBytes\) \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:395_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L395)

#### Type declaration:

▸ \(`ecdsaPublicKey`: string, `blsPublicKey`: string, `blsPop`: string\): [_CeloTransactionObject_]()_‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `ecdsaPublicKey` | string |
| `blsPublicKey` | string |
| `blsPop` | string |

### removeMember

• **removeMember**: _function_ = proxySend\(this.kit, this.contract.methods.removeMember\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:506_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L506)

Removes a member from a ValidatorGroup The ValidatorGroup is specified by the `from` of the tx.

**`param`** The Validator to remove from the group

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### resetSlashingMultiplier

• **resetSlashingMultiplier**: _function_ = proxySend\(this.kit, this.contract.methods.resetSlashingMultiplier\)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:477_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L477)

Resets a group's slashing multiplier if it has been &gt;= the reset period since the last time the group was slashed.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### setNextCommissionUpdate

• **setNextCommissionUpdate**: _function_ = proxySend\( this.kit, this.contract.methods.setNextCommissionUpdate, tupleParser\(valueToFixidityString\) \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L87)

Queues an update to a validator group's commission.

**`param`** Fixidity representation of the commission this group receives on epoch payments made to its members. Must be in the range \[0, 1.0\].

#### Type declaration:

▸ \(`commission`: BigNumber.Value\): [_CeloTransactionObject_]()_‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `commission` | BigNumber.Value |

### updateBlsPublicKey

• **updateBlsPublicKey**: _function_ = proxySend\( this.kit, this.contract.methods.updateBlsPublicKey, tupleParser\(stringToBytes, stringToBytes\) \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:205_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L205)

Updates a validator's BLS key.

**`param`** The BLS public key that the validator is using for consensus, should pass proof of possession. 48 bytes.

**`param`** The BLS public key proof-of-possession, which consists of a signature on the account address. 96 bytes.

**`returns`** True upon success.

#### Type declaration:

▸ \(`blsPublicKey`: string, `blsPop`: string\): [_CeloTransactionObject_]()_‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blsPublicKey` | string |
| `blsPop` | string |

### updateCommission

• **updateCommission**: _function_ = proxySend\( this.kit, this.contract.methods.updateCommission \)

_Defined in_ [_contractkit/src/wrappers/Validators.ts:96_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L96)

Updates a validator group's commission based on the previously queued update

#### Type declaration:

▸ \(\): [_CeloTransactionObject_]()_‹void›_

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### addMember

▸ **addMember**\(`group`: [Address](_base_.md#address), `validator`: [Address](_base_.md#address)\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:484_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L484)

Adds a member to the end of a validator group's list of members. Fails if `validator` has not set their affiliation to this account.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `group` | [Address](_base_.md#address) | - |
| `validator` | [Address](_base_.md#address) | The validator to add to the group |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### currentSignerSet

▸ **currentSignerSet**\(\): _Promise‹_[_Address_](_base_.md#address)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:574_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L574)

Returns the current set of validator signer addresses

**Returns:** _Promise‹_[_Address_](_base_.md#address)_\[\]›_

### currentValidatorAccountsSet

▸ **currentValidatorAccountsSet**\(\): _Promise‹object\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:584_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L584)

Returns the current set of validator signer and account addresses

**Returns:** _Promise‹object\[\]›_

### deregisterValidator

▸ **deregisterValidator**\(`validatorAddress`: [Address](_base_.md#address)\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:409_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L409)

De-registers a validator, removing it from the group for which it is a member.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorAddress` | [Address](_base_.md#address) | Address of the validator to deregister |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### deregisterValidatorGroup

▸ **deregisterValidatorGroup**\(`validatorGroupAddress`: [Address](_base_.md#address)\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:437_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L437)

De-registers a validator Group

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorGroupAddress` | [Address](_base_.md#address) | Address of the validator group to deregister |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### findValidatorMembershipHistoryIndex

▸ **findValidatorMembershipHistoryIndex**\(`epoch`: number, `history`: [GroupMembership]()\[\]\): _number_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:618_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L618)

Returns the index into `history` for `epoch`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `epoch` | number | The needle. |
| `history` | [GroupMembership]()\[\] | The haystack. |

**Returns:** _number_

Index for epoch or -1.

### getConfig

▸ **getConfig**\(\): _Promise‹_[_ValidatorsConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:156_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L156)

Returns current configuration parameters.

**Returns:** _Promise‹_[_ValidatorsConfig_]()_›_

### getGroupLockedGoldRequirements

▸ **getGroupLockedGoldRequirements**\(\): _Promise‹_[_LockedGoldRequirements_]()_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L117)

Returns the Locked Gold requirements for validator groups.

**Returns:** _Promise‹_[_LockedGoldRequirements_]()_›_

The Locked Gold requirements for validator groups.

### getRegisteredValidatorGroups

▸ **getRegisteredValidatorGroups**\(\): _Promise‹_[_ValidatorGroup_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:372_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L372)

Get list of registered validator groups

**Returns:** _Promise‹_[_ValidatorGroup_]()_\[\]›_

### getRegisteredValidators

▸ **getRegisteredValidators**\(`blockNumber?`: undefined \| number\): _Promise‹_[_Validator_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:366_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L366)

Get list of registered validators

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_Validator_]()_\[\]›_

### getRegisteredValidatorsAddresses

▸ **getRegisteredValidatorsAddresses**\(`blockNumber?`: undefined \| number\): _Promise‹_[_Address_](_base_.md#address)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:355_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L355)

Get list of registered validator addresses

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_Address_](_base_.md#address)_\[\]›_

### getValidator

▸ **getValidator**\(`address`: [Address](_base_.md#address), `blockNumber?`: undefined \| number\): _Promise‹_[_Validator_]()_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:254_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L254)

Get Validator information

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_base_.md#address) |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_Validator_]()_›_

### getValidatorFromSigner

▸ **getValidatorFromSigner**\(`address`: [Address](_base_.md#address), `blockNumber?`: undefined \| number\): _Promise‹_[_Validator_]()_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:271_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L271)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_base_.md#address) |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_Validator_]()_›_

### getValidatorGroup

▸ **getValidatorGroup**\(`address`: [Address](_base_.md#address), `getAffiliates`: boolean, `blockNumber?`: undefined \| number\): _Promise‹_[_ValidatorGroup_]()_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:289_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L289)

Get ValidatorGroup information

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | - |
| `getAffiliates` | boolean | true |
| `blockNumber?` | undefined \| number | - |

**Returns:** _Promise‹_[_ValidatorGroup_]()_›_

### getValidatorLockedGoldRequirements

▸ **getValidatorLockedGoldRequirements**\(\): _Promise‹_[_LockedGoldRequirements_]()_›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:105_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L105)

Returns the Locked Gold requirements for validators.

**Returns:** _Promise‹_[_LockedGoldRequirements_]()_›_

The Locked Gold requirements for validators.

### getValidatorMembershipHistoryIndex

▸ **getValidatorMembershipHistoryIndex**\(`validator`: [Validator](), `blockNumber?`: undefined \| number\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:598_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L598)

Returns the group membership for `validator`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validator` | [Validator]() | Address of validator to retrieve group membership for. |
| `blockNumber?` | undefined \| number | Block number to retrieve group membership at. |

**Returns:** _Promise‹object›_

Group and membership history index for `validator`.

### getValidatorRewards

▸ **getValidatorRewards**\(`epochNumber`: number\): _Promise‹_[_ValidatorReward_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:548_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L548)

Retrieves ValidatorRewards for epochNumber.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `epochNumber` | number | The epoch to retrieve ValidatorRewards at. |

**Returns:** _Promise‹_[_ValidatorReward_]()_\[\]›_

### meetsValidatorBalanceRequirements

▸ **meetsValidatorBalanceRequirements**\(`address`: [Address](_base_.md#address)\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:233_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L233)

Returns whether an account meets the requirements to register a validator.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_base_.md#address) |

**Returns:** _Promise‹boolean›_

Whether an account meets the requirements to register a validator.

### meetsValidatorGroupBalanceRequirements

▸ **meetsValidatorGroupBalanceRequirements**\(`address`: [Address](_base_.md#address)\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:246_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L246)

Returns whether an account meets the requirements to register a group.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_base_.md#address) |

**Returns:** _Promise‹boolean›_

Whether an account meets the requirements to register a group.

### registerValidatorGroup

▸ **registerValidatorGroup**\(`commission`: BigNumber\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:426_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L426)

Registers a validator group with no member validators. Fails if the account is already a validator or validator group. Fails if the account does not have sufficient weight.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `commission` | BigNumber | the commission this group receives on epoch payments made to its members. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### reorderMember

▸ **reorderMember**\(`groupAddr`: [Address](_base_.md#address), `validator`: [Address](_base_.md#address), `newIndex`: number\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:515_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L515)

Reorders a member within a validator group. Fails if `validator` is not a member of the account's validator group.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `groupAddr` | [Address](_base_.md#address) | The validator group |
| `validator` | [Address](_base_.md#address) | The validator to reorder. |
| `newIndex` | number | New position for the validator |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### signerToAccount

▸ **signerToAccount**\(`signerAddress`: [Address](_base_.md#address)\): _Promise‹string›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:192_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L192)

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or previously authorized signer.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signerAddress` | [Address](_base_.md#address) |

**Returns:** _Promise‹string›_

The associated account.

### validatorSignerToAccount

▸ **validatorSignerToAccount**\(`signerAddress`: [Address](_base_.md#address)\): _Promise‹string›_

_Defined in_ [_contractkit/src/wrappers/Validators.ts:181_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Validators.ts#L181)

Returns the account associated with `signer`.

**`dev`** Fails if the `signer` is not an account or currently authorized validator.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signerAddress` | [Address](_base_.md#address) |

**Returns:** _Promise‹string›_

The associated account.

