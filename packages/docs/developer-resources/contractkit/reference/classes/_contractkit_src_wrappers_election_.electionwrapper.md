# Class: ElectionWrapper

Contract for voting for validators and managing validator groups.

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹Election›

  ↳ **ElectionWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_election_.electionwrapper.md#constructor)

### Properties

* [_activate](_contractkit_src_wrappers_election_.electionwrapper.md#_activate)
* [electabilityThreshold](_contractkit_src_wrappers_election_.electionwrapper.md#electabilitythreshold)
* [events](_contractkit_src_wrappers_election_.electionwrapper.md#events)
* [getGroupsVotedForByAccount](_contractkit_src_wrappers_election_.electionwrapper.md#getgroupsvotedforbyaccount)
* [getTotalVotesForGroupByAccount](_contractkit_src_wrappers_election_.electionwrapper.md#gettotalvotesforgroupbyaccount)
* [numberValidatorsInCurrentSet](_contractkit_src_wrappers_election_.electionwrapper.md#numbervalidatorsincurrentset)
* [numberValidatorsInSet](_contractkit_src_wrappers_election_.electionwrapper.md#numbervalidatorsinset)
* [validatorSignerAddressFromCurrentSet](_contractkit_src_wrappers_election_.electionwrapper.md#validatorsigneraddressfromcurrentset)
* [validatorSignerAddressFromSet](_contractkit_src_wrappers_election_.electionwrapper.md#validatorsigneraddressfromset)

### Accessors

* [address](_contractkit_src_wrappers_election_.electionwrapper.md#address)

### Methods

* [activate](_contractkit_src_wrappers_election_.electionwrapper.md#activate)
* [electValidatorSigners](_contractkit_src_wrappers_election_.electionwrapper.md#electvalidatorsigners)
* [electableValidators](_contractkit_src_wrappers_election_.electionwrapper.md#electablevalidators)
* [findLesserAndGreaterAfterVote](_contractkit_src_wrappers_election_.electionwrapper.md#findlesserandgreateraftervote)
* [getActiveVotesForGroup](_contractkit_src_wrappers_election_.electionwrapper.md#getactivevotesforgroup)
* [getConfig](_contractkit_src_wrappers_election_.electionwrapper.md#getconfig)
* [getCurrentValidatorSigners](_contractkit_src_wrappers_election_.electionwrapper.md#getcurrentvalidatorsigners)
* [getElectedValidators](_contractkit_src_wrappers_election_.electionwrapper.md#getelectedvalidators)
* [getEligibleValidatorGroupsVotes](_contractkit_src_wrappers_election_.electionwrapper.md#geteligiblevalidatorgroupsvotes)
* [getGroupVoterRewards](_contractkit_src_wrappers_election_.electionwrapper.md#getgroupvoterrewards)
* [getTotalVotesForGroup](_contractkit_src_wrappers_election_.electionwrapper.md#gettotalvotesforgroup)
* [getValidatorGroupVotes](_contractkit_src_wrappers_election_.electionwrapper.md#getvalidatorgroupvotes)
* [getValidatorGroupsVotes](_contractkit_src_wrappers_election_.electionwrapper.md#getvalidatorgroupsvotes)
* [getValidatorSigners](_contractkit_src_wrappers_election_.electionwrapper.md#getvalidatorsigners)
* [getVoter](_contractkit_src_wrappers_election_.electionwrapper.md#getvoter)
* [getVoterRewards](_contractkit_src_wrappers_election_.electionwrapper.md#getvoterrewards)
* [getVotesForGroupByAccount](_contractkit_src_wrappers_election_.electionwrapper.md#getvotesforgroupbyaccount)
* [hasActivatablePendingVotes](_contractkit_src_wrappers_election_.electionwrapper.md#hasactivatablependingvotes)
* [hasPendingVotes](_contractkit_src_wrappers_election_.electionwrapper.md#haspendingvotes)
* [revoke](_contractkit_src_wrappers_election_.electionwrapper.md#revoke)
* [revokeActive](_contractkit_src_wrappers_election_.electionwrapper.md#revokeactive)
* [revokePending](_contractkit_src_wrappers_election_.electionwrapper.md#revokepending)
* [vote](_contractkit_src_wrappers_election_.electionwrapper.md#vote)

## Constructors

###  constructor

\+ **new ElectionWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: Election): *[ElectionWrapper](_contractkit_src_wrappers_election_.electionwrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | Election |

**Returns:** *[ElectionWrapper](_contractkit_src_wrappers_election_.electionwrapper.md)*

## Properties

###  _activate

• **_activate**: *function* = proxySend(this.kit, this.contract.methods.activate)

*Defined in [contractkit/src/wrappers/Election.ts:310](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L310)*

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  electabilityThreshold

• **electabilityThreshold**: *function* = proxyCall(
    this.contract.methods.getElectabilityThreshold,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Election.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L82)*

Returns the current election threshold.

**`returns`** Election threshold.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

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

###  getGroupsVotedForByAccount

• **getGroupsVotedForByAccount**: *function* = proxyCall(
    this.contract.methods.getGroupsVotedForByAccount
  )

*Defined in [contractkit/src/wrappers/Election.ts:208](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L208)*

Returns the groups that `account` has voted for.

**`param`** The address of the account casting votes.

**`returns`** The groups that `account` has voted for.

#### Type declaration:

▸ (`account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  getTotalVotesForGroupByAccount

• **getTotalVotesForGroupByAccount**: *function* = proxyCall(
    this.contract.methods.getTotalVotesForGroupByAccount,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Election.ts:186](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L186)*

Returns the total votes for `group` made by `account`.

**`param`** The address of the validator group.

**`param`** The address of the voting account.

**`returns`** The total votes for `group` made by `account`.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  numberValidatorsInCurrentSet

• **numberValidatorsInCurrentSet**: *function* = proxyCall(
    this.contract.methods.numberValidatorsInCurrentSet,
    undefined,
    valueToInt
  )

*Defined in [contractkit/src/wrappers/Election.ts:124](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L124)*

Gets the size of the current elected validator set.

**`returns`** Size of the current elected validator set.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  numberValidatorsInSet

• **numberValidatorsInSet**: *function* = proxyCall(
    this.contract.methods.numberValidatorsInSet,
    undefined,
    valueToInt
  )

*Defined in [contractkit/src/wrappers/Election.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L114)*

Gets the size of the validator set that must sign the given block number.

**`param`** Block number to retrieve the validator set from.

**`returns`** Size of the validator set.

#### Type declaration:

▸ (`blockNumber`: number): *Promise‹number›*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

___

###  validatorSignerAddressFromCurrentSet

• **validatorSignerAddressFromCurrentSet**: *function* = proxyCall(
    this.contract.methods.validatorSignerAddressFromCurrentSet,
    tupleParser<number, number>(identity)
  )

*Defined in [contractkit/src/wrappers/Election.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L104)*

Gets a validator address from the current validator set.

**`param`** Index of requested validator in the validator set.

**`returns`** Address of validator at the requested index.

#### Type declaration:

▸ (`index`: number): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

___

###  validatorSignerAddressFromSet

• **validatorSignerAddressFromSet**: *function* = proxyCall(this.contract.methods.validatorSignerAddressFromSet)

*Defined in [contractkit/src/wrappers/Election.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L94)*

Gets a validator address from the validator set at the given block number.

**`param`** Index of requested validator in the validator set.

**`param`** Block number to retrieve the validator set from.

**`returns`** Address of validator at the requested index.

#### Type declaration:

▸ (`signerIndex`: number, `blockNumber`: number): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`signerIndex` | number |
`blockNumber` | number |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  activate

▸ **activate**(`account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹Array‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean›››*

*Defined in [contractkit/src/wrappers/Election.ts:316](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L316)*

Activates any activatable pending votes.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | The account with pending votes to activate.  |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean›››*

___

###  electValidatorSigners

▸ **electValidatorSigners**(`min?`: undefined | number, `max?`: undefined | number): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L156)*

Returns a list of elected validators with seats allocated to groups via the D'Hondt method.

**`dev`** See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.

**Parameters:**

Name | Type |
------ | ------ |
`min?` | undefined &#124; number |
`max?` | undefined &#124; number |

**Returns:** *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

The list of elected validators.

___

###  electableValidators

▸ **electableValidators**(): *Promise‹[ElectableValidators](../interfaces/_contractkit_src_wrappers_election_.electablevalidators.md)›*

*Defined in [contractkit/src/wrappers/Election.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L73)*

Returns the minimum and maximum number of validators that can be elected.

**Returns:** *Promise‹[ElectableValidators](../interfaces/_contractkit_src_wrappers_election_.electablevalidators.md)›*

The minimum and maximum number of validators that can be elected.

___

###  findLesserAndGreaterAfterVote

▸ **findLesserAndGreaterAfterVote**(`votedGroup`: [Address](../modules/_contractkit_src_base_.md#address), `voteWeight`: BigNumber): *Promise‹object›*

*Defined in [contractkit/src/wrappers/Election.ts:412](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L412)*

**Parameters:**

Name | Type |
------ | ------ |
`votedGroup` | [Address](../modules/_contractkit_src_base_.md#address) |
`voteWeight` | BigNumber |

**Returns:** *Promise‹object›*

___

###  getActiveVotesForGroup

▸ **getActiveVotesForGroup**(`group`: [Address](../modules/_contractkit_src_base_.md#address), `blockNumber?`: undefined | number): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/Election.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L197)*

Returns the active votes for `group`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the validator group. |
`blockNumber?` | undefined &#124; number | - |

**Returns:** *Promise‹BigNumber›*

The active votes for `group`.

___

###  getConfig

▸ **getConfig**(): *Promise‹[ElectionConfig](../interfaces/_contractkit_src_wrappers_election_.electionconfig.md)›*

*Defined in [contractkit/src/wrappers/Election.ts:274](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L274)*

Returns current configuration parameters.

**Returns:** *Promise‹[ElectionConfig](../interfaces/_contractkit_src_wrappers_election_.electionconfig.md)›*

___

###  getCurrentValidatorSigners

▸ **getCurrentValidatorSigners**(`blockNumber?`: undefined | number): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L134)*

Returns the current validator signers using the precompiles.

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

List of current validator signers.

___

###  getElectedValidators

▸ **getElectedValidators**(`epochNumber`: number): *Promise‹[Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:441](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L441)*

Retrieves the set of validatorsparticipating in BFT at epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve the elected validator set at.  |

**Returns:** *Promise‹[Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md)[]›*

___

###  getEligibleValidatorGroupsVotes

▸ **getEligibleValidatorGroupsVotes**(): *Promise‹[ValidatorGroupVote](../interfaces/_contractkit_src_wrappers_election_.validatorgroupvote.md)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:397](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L397)*

Returns the current eligible validator groups and their total votes.

**Returns:** *Promise‹[ValidatorGroupVote](../interfaces/_contractkit_src_wrappers_election_.validatorgroupvote.md)[]›*

___

###  getGroupVoterRewards

▸ **getGroupVoterRewards**(`epochNumber`: number): *Promise‹[GroupVoterReward](../interfaces/_contractkit_src_wrappers_election_.groupvoterreward.md)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:454](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L454)*

Retrieves GroupVoterRewards at epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve GroupVoterRewards at.  |

**Returns:** *Promise‹[GroupVoterReward](../interfaces/_contractkit_src_wrappers_election_.groupvoterreward.md)[]›*

___

###  getTotalVotesForGroup

▸ **getTotalVotesForGroup**(`group`: [Address](../modules/_contractkit_src_base_.md#address), `blockNumber?`: undefined | number): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/Election.ts:174](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L174)*

Returns the total votes for `group`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the validator group. |
`blockNumber?` | undefined &#124; number | - |

**Returns:** *Promise‹BigNumber›*

The total votes for `group`.

___

###  getValidatorGroupVotes

▸ **getValidatorGroupVotes**(`address`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[ValidatorGroupVote](../interfaces/_contractkit_src_wrappers_election_.validatorgroupvote.md)›*

*Defined in [contractkit/src/wrappers/Election.ts:287](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L287)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹[ValidatorGroupVote](../interfaces/_contractkit_src_wrappers_election_.validatorgroupvote.md)›*

___

###  getValidatorGroupsVotes

▸ **getValidatorGroupsVotes**(): *Promise‹[ValidatorGroupVote](../interfaces/_contractkit_src_wrappers_election_.validatorgroupvote.md)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:304](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L304)*

Returns the current registered validator groups and their total votes and eligibility.

**Returns:** *Promise‹[ValidatorGroupVote](../interfaces/_contractkit_src_wrappers_election_.validatorgroupvote.md)[]›*

___

###  getValidatorSigners

▸ **getValidatorSigners**(`blockNumber`: number): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:144](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L144)*

Returns the validator signers for block `blockNumber`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`blockNumber` | number | Block number to retrieve signers for. |

**Returns:** *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

Address of each signer in the validator set.

___

###  getVoter

▸ **getVoter**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `blockNumber?`: undefined | number): *Promise‹[Voter](../interfaces/_contractkit_src_wrappers_election_.voter.md)›*

*Defined in [contractkit/src/wrappers/Election.ts:234](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L234)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Voter](../interfaces/_contractkit_src_wrappers_election_.voter.md)›*

___

###  getVoterRewards

▸ **getVoterRewards**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `epochNumber`: number): *Promise‹[VoterReward](../interfaces/_contractkit_src_wrappers_election_.voterreward.md)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:478](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L478)*

Retrieves VoterRewards for address at epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) | The address to retrieve VoterRewards for. |
`epochNumber` | number | The epoch to retrieve VoterRewards at.  |

**Returns:** *Promise‹[VoterReward](../interfaces/_contractkit_src_wrappers_election_.voterreward.md)[]›*

___

###  getVotesForGroupByAccount

▸ **getVotesForGroupByAccount**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `group`: [Address](../modules/_contractkit_src_base_.md#address), `blockNumber?`: undefined | number): *Promise‹[GroupVote](../interfaces/_contractkit_src_wrappers_election_.groupvote.md)›*

*Defined in [contractkit/src/wrappers/Election.ts:212](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L212)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`group` | [Address](../modules/_contractkit_src_base_.md#address) |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[GroupVote](../interfaces/_contractkit_src_wrappers_election_.groupvote.md)›*

___

###  hasActivatablePendingVotes

▸ **hasActivatablePendingVotes**(`account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Election.ts:263](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L263)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹boolean›*

___

###  hasPendingVotes

▸ **hasPendingVotes**(`account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Election.ts:251](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L251)*

Returns whether or not the account has any pending votes.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the account casting votes. |

**Returns:** *Promise‹boolean›*

The groups that `account` has voted for.

___

###  revoke

▸ **revoke**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `group`: [Address](../modules/_contractkit_src_base_.md#address), `value`: BigNumber): *Promise‹Array‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean›››*

*Defined in [contractkit/src/wrappers/Election.ts:355](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L355)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`group` | [Address](../modules/_contractkit_src_base_.md#address) |
`value` | BigNumber |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean›››*

___

###  revokeActive

▸ **revokeActive**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `group`: [Address](../modules/_contractkit_src_base_.md#address), `value`: BigNumber): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Election.ts:340](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L340)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`group` | [Address](../modules/_contractkit_src_base_.md#address) |
`value` | BigNumber |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  revokePending

▸ **revokePending**(`account`: [Address](../modules/_contractkit_src_base_.md#address), `group`: [Address](../modules/_contractkit_src_base_.md#address), `value`: BigNumber): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Election.ts:325](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L325)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`group` | [Address](../modules/_contractkit_src_base_.md#address) |
`value` | BigNumber |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  vote

▸ **vote**(`validatorGroup`: [Address](../modules/_contractkit_src_base_.md#address), `value`: BigNumber): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Election.ts:381](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L381)*

Increments the number of total and pending votes for `group`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorGroup` | [Address](../modules/_contractkit_src_base_.md#address) | The validator group to vote for. |
`value` | BigNumber | The amount of gold to use to vote.  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*
