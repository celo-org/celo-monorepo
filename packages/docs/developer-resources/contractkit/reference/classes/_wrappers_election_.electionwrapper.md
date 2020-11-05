# Class: ElectionWrapper

Contract for voting for validators and managing validator groups.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Election›

  ↳ **ElectionWrapper**

## Index

### Constructors

* [constructor](_wrappers_election_.electionwrapper.md#constructor)

### Properties

* [electabilityThreshold](_wrappers_election_.electionwrapper.md#electabilitythreshold)
* [eventTypes](_wrappers_election_.electionwrapper.md#eventtypes)
* [events](_wrappers_election_.electionwrapper.md#events)
* [getCurrentValidatorSigners](_wrappers_election_.electionwrapper.md#getcurrentvalidatorsigners)
* [getGroupsVotedForByAccount](_wrappers_election_.electionwrapper.md#getgroupsvotedforbyaccount)
* [getTotalVotes](_wrappers_election_.electionwrapper.md#gettotalvotes)
* [getTotalVotesForGroupByAccount](_wrappers_election_.electionwrapper.md#gettotalvotesforgroupbyaccount)
* [methodIds](_wrappers_election_.electionwrapper.md#methodids)
* [numberValidatorsInCurrentSet](_wrappers_election_.electionwrapper.md#numbervalidatorsincurrentset)
* [numberValidatorsInSet](_wrappers_election_.electionwrapper.md#numbervalidatorsinset)
* [validatorSignerAddressFromCurrentSet](_wrappers_election_.electionwrapper.md#validatorsigneraddressfromcurrentset)
* [validatorSignerAddressFromSet](_wrappers_election_.electionwrapper.md#validatorsigneraddressfromset)

### Accessors

* [address](_wrappers_election_.electionwrapper.md#address)

### Methods

* [activate](_wrappers_election_.electionwrapper.md#activate)
* [electValidatorSigners](_wrappers_election_.electionwrapper.md#electvalidatorsigners)
* [electableValidators](_wrappers_election_.electionwrapper.md#electablevalidators)
* [findLesserAndGreaterAfterVote](_wrappers_election_.electionwrapper.md#findlesserandgreateraftervote)
* [getActiveVotesForGroup](_wrappers_election_.electionwrapper.md#getactivevotesforgroup)
* [getConfig](_wrappers_election_.electionwrapper.md#getconfig)
* [getElectedValidators](_wrappers_election_.electionwrapper.md#getelectedvalidators)
* [getEligibleValidatorGroupsVotes](_wrappers_election_.electionwrapper.md#geteligiblevalidatorgroupsvotes)
* [getGroupVoterRewards](_wrappers_election_.electionwrapper.md#getgroupvoterrewards)
* [getPastEvents](_wrappers_election_.electionwrapper.md#getpastevents)
* [getTotalVotesForGroup](_wrappers_election_.electionwrapper.md#gettotalvotesforgroup)
* [getValidatorGroupVotes](_wrappers_election_.electionwrapper.md#getvalidatorgroupvotes)
* [getValidatorGroupsVotes](_wrappers_election_.electionwrapper.md#getvalidatorgroupsvotes)
* [getValidatorSigners](_wrappers_election_.electionwrapper.md#getvalidatorsigners)
* [getVoter](_wrappers_election_.electionwrapper.md#getvoter)
* [getVoterRewards](_wrappers_election_.electionwrapper.md#getvoterrewards)
* [getVoterShare](_wrappers_election_.electionwrapper.md#getvotershare)
* [getVotesForGroupByAccount](_wrappers_election_.electionwrapper.md#getvotesforgroupbyaccount)
* [hasActivatablePendingVotes](_wrappers_election_.electionwrapper.md#hasactivatablependingvotes)
* [hasPendingVotes](_wrappers_election_.electionwrapper.md#haspendingvotes)
* [revoke](_wrappers_election_.electionwrapper.md#revoke)
* [revokeActive](_wrappers_election_.electionwrapper.md#revokeactive)
* [revokePending](_wrappers_election_.electionwrapper.md#revokepending)
* [vote](_wrappers_election_.electionwrapper.md#vote)

## Constructors

###  constructor

\+ **new ElectionWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Election): *[ElectionWrapper](_wrappers_election_.electionwrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Election |

**Returns:** *[ElectionWrapper](_wrappers_election_.electionwrapper.md)*

## Properties

###  electabilityThreshold

• **electabilityThreshold**: *function* = proxyCall(
    this.contract.methods.getElectabilityThreshold,
    undefined,
    fixidityValueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/Election.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L85)*

Returns the current election threshold.

**`returns`** Election threshold.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  eventTypes

• **eventTypes**: *object* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L41)*

#### Type declaration:

___

###  events

• **events**: *Election["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L39)*

___

###  getCurrentValidatorSigners

• **getCurrentValidatorSigners**: *function* = proxyCall(
    this.contract.methods.getCurrentValidatorSigners
  )

*Defined in [packages/contractkit/src/wrappers/Election.ts:143](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L143)*

Returns the current validator signers using the precompiles.

**`returns`** List of current validator signers.

#### Type declaration:

▸ (): *Promise‹[Address](../modules/_base_.md#address)[]›*

___

###  getGroupsVotedForByAccount

• **getGroupsVotedForByAccount**: *function* = proxyCall(
    this.contract.methods.getGroupsVotedForByAccount
  )

*Defined in [packages/contractkit/src/wrappers/Election.ts:216](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L216)*

Returns the groups that `account` has voted for.

**`param`** The address of the account casting votes.

**`returns`** The groups that `account` has voted for.

#### Type declaration:

▸ (`account`: [Address](../modules/_base_.md#address)): *Promise‹[Address](../modules/_base_.md#address)[]›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

___

###  getTotalVotes

• **getTotalVotes**: *function* = proxyCall(this.contract.methods.getTotalVotes, undefined, valueToBigNumber)

*Defined in [packages/contractkit/src/wrappers/Election.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L137)*

Returns the total votes received across all groups.

**`returns`** The total votes received across all groups.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getTotalVotesForGroupByAccount

• **getTotalVotesForGroupByAccount**: *function* = proxyCall(
    this.contract.methods.getTotalVotesForGroupByAccount,
    undefined,
    valueToBigNumber
  )

*Defined in [packages/contractkit/src/wrappers/Election.ts:194](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L194)*

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

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L46)*

#### Type declaration:

___

###  numberValidatorsInCurrentSet

• **numberValidatorsInCurrentSet**: *function* = proxyCall(
    this.contract.methods.numberValidatorsInCurrentSet,
    undefined,
    valueToInt
  )

*Defined in [packages/contractkit/src/wrappers/Election.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L127)*

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

*Defined in [packages/contractkit/src/wrappers/Election.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L117)*

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

*Defined in [packages/contractkit/src/wrappers/Election.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L107)*

Gets a validator address from the current validator set.

**`param`** Index of requested validator in the validator set.

**`returns`** Address of validator at the requested index.

#### Type declaration:

▸ (`index`: number): *Promise‹[Address](../modules/_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

___

###  validatorSignerAddressFromSet

• **validatorSignerAddressFromSet**: *function* = proxyCall(this.contract.methods.validatorSignerAddressFromSet)

*Defined in [packages/contractkit/src/wrappers/Election.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L97)*

Gets a validator address from the validator set at the given block number.

**`param`** Index of requested validator in the validator set.

**`param`** Block number to retrieve the validator set from.

**`returns`** Address of validator at the requested index.

#### Type declaration:

▸ (`signerIndex`: number, `blockNumber`: number): *Promise‹[Address](../modules/_base_.md#address)›*

**Parameters:**

Name | Type |
------ | ------ |
`signerIndex` | number |
`blockNumber` | number |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L29)*

Contract address

**Returns:** *string*

## Methods

###  activate

▸ **activate**(`account`: [Address](../modules/_base_.md#address)): *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›››*

*Defined in [packages/contractkit/src/wrappers/Election.ts:327](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L327)*

Activates any activatable pending votes.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_base_.md#address) | The account with pending votes to activate.  |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›››*

___

###  electValidatorSigners

▸ **electValidatorSigners**(`min?`: undefined | number, `max?`: undefined | number): *Promise‹[Address](../modules/_base_.md#address)[]›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:164](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L164)*

Returns a list of elected validators with seats allocated to groups via the D'Hondt method.

**`dev`** See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.

**Parameters:**

Name | Type |
------ | ------ |
`min?` | undefined &#124; number |
`max?` | undefined &#124; number |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)[]›*

The list of elected validators.

___

###  electableValidators

▸ **electableValidators**(): *Promise‹[ElectableValidators](../interfaces/_wrappers_election_.electablevalidators.md)›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L76)*

Returns the minimum and maximum number of validators that can be elected.

**Returns:** *Promise‹[ElectableValidators](../interfaces/_wrappers_election_.electablevalidators.md)›*

The minimum and maximum number of validators that can be elected.

___

###  findLesserAndGreaterAfterVote

▸ **findLesserAndGreaterAfterVote**(`votedGroup`: [Address](../modules/_base_.md#address), `voteWeight`: BigNumber): *Promise‹object›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:423](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L423)*

**Parameters:**

Name | Type |
------ | ------ |
`votedGroup` | [Address](../modules/_base_.md#address) |
`voteWeight` | BigNumber |

**Returns:** *Promise‹object›*

___

###  getActiveVotesForGroup

▸ **getActiveVotesForGroup**(`group`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹BigNumber›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:205](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L205)*

Returns the active votes for `group`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | [Address](../modules/_base_.md#address) | The address of the validator group. |
`blockNumber?` | undefined &#124; number | - |

**Returns:** *Promise‹BigNumber›*

The active votes for `group`.

___

###  getConfig

▸ **getConfig**(): *Promise‹[ElectionConfig](../interfaces/_wrappers_election_.electionconfig.md)›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:282](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L282)*

Returns current configuration parameters.

**Returns:** *Promise‹[ElectionConfig](../interfaces/_wrappers_election_.electionconfig.md)›*

___

###  getElectedValidators

▸ **getElectedValidators**(`epochNumber`: number): *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)[]›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:452](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L452)*

Retrieves the set of validatorsparticipating in BFT at epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve the elected validator set at.  |

**Returns:** *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)[]›*

___

###  getEligibleValidatorGroupsVotes

▸ **getEligibleValidatorGroupsVotes**(): *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)[]›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:408](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L408)*

Returns the current eligible validator groups and their total votes.

**Returns:** *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)[]›*

___

###  getGroupVoterRewards

▸ **getGroupVoterRewards**(`epochNumber`: number): *Promise‹[GroupVoterReward](../interfaces/_wrappers_election_.groupvoterreward.md)[]›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:463](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L463)*

Retrieves GroupVoterRewards at epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve GroupVoterRewards at.  |

**Returns:** *Promise‹[GroupVoterReward](../interfaces/_wrappers_election_.groupvoterreward.md)[]›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Election›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L35)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Election› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getTotalVotesForGroup

▸ **getTotalVotesForGroup**(`group`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹BigNumber›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:182](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L182)*

Returns the total votes for `group`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | [Address](../modules/_base_.md#address) | The address of the validator group. |
`blockNumber?` | undefined &#124; number | - |

**Returns:** *Promise‹BigNumber›*

The total votes for `group`.

___

###  getValidatorGroupVotes

▸ **getValidatorGroupVotes**(`address`: [Address](../modules/_base_.md#address)): *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:298](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L298)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)›*

___

###  getValidatorGroupsVotes

▸ **getValidatorGroupsVotes**(): *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)[]›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:315](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L315)*

Returns the current registered validator groups and their total votes and eligibility.

**Returns:** *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)[]›*

___

###  getValidatorSigners

▸ **getValidatorSigners**(`blockNumber`: number): *Promise‹[Address](../modules/_base_.md#address)[]›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L152)*

Returns the validator signers for block `blockNumber`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`blockNumber` | number | Block number to retrieve signers for. |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)[]›*

Address of each signer in the validator set.

___

###  getVoter

▸ **getVoter**(`account`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹[Voter](../interfaces/_wrappers_election_.voter.md)›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:242](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L242)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Voter](../interfaces/_wrappers_election_.voter.md)›*

___

###  getVoterRewards

▸ **getVoterRewards**(`address`: [Address](../modules/_base_.md#address), `epochNumber`: number, `voterShare?`: Record‹[Address](../modules/_base_.md#address), BigNumber›): *Promise‹[VoterReward](../interfaces/_wrappers_election_.voterreward.md)[]›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:488](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L488)*

Retrieves VoterRewards for address at epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | The address to retrieve VoterRewards for. |
`epochNumber` | number | The epoch to retrieve VoterRewards at. |
`voterShare?` | Record‹[Address](../modules/_base_.md#address), BigNumber› | Optionally address' share of group rewards.  |

**Returns:** *Promise‹[VoterReward](../interfaces/_wrappers_election_.voterreward.md)[]›*

___

###  getVoterShare

▸ **getVoterShare**(`address`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹Record‹[Address](../modules/_base_.md#address), BigNumber››*

*Defined in [packages/contractkit/src/wrappers/Election.ts:518](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L518)*

Retrieves a voter's share of active votes.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | The voter to retrieve share for. |
`blockNumber?` | undefined &#124; number | The block to retrieve the voter's share at.  |

**Returns:** *Promise‹Record‹[Address](../modules/_base_.md#address), BigNumber››*

___

###  getVotesForGroupByAccount

▸ **getVotesForGroupByAccount**(`account`: [Address](../modules/_base_.md#address), `group`: [Address](../modules/_base_.md#address), `blockNumber?`: undefined | number): *Promise‹[GroupVote](../interfaces/_wrappers_election_.groupvote.md)›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:220](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L220)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`group` | [Address](../modules/_base_.md#address) |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[GroupVote](../interfaces/_wrappers_election_.groupvote.md)›*

___

###  hasActivatablePendingVotes

▸ **hasActivatablePendingVotes**(`account`: [Address](../modules/_base_.md#address)): *Promise‹boolean›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:271](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L271)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹boolean›*

___

###  hasPendingVotes

▸ **hasPendingVotes**(`account`: [Address](../modules/_base_.md#address)): *Promise‹boolean›*

*Defined in [packages/contractkit/src/wrappers/Election.ts:259](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L259)*

Returns whether or not the account has any pending votes.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | [Address](../modules/_base_.md#address) | The address of the account casting votes. |

**Returns:** *Promise‹boolean›*

The groups that `account` has voted for.

___

###  revoke

▸ **revoke**(`account`: [Address](../modules/_base_.md#address), `group`: [Address](../modules/_base_.md#address), `value`: BigNumber): *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›››*

*Defined in [packages/contractkit/src/wrappers/Election.ts:366](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L366)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`group` | [Address](../modules/_base_.md#address) |
`value` | BigNumber |

**Returns:** *Promise‹Array‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean›››*

___

###  revokeActive

▸ **revokeActive**(`account`: [Address](../modules/_base_.md#address), `group`: [Address](../modules/_base_.md#address), `value`: BigNumber): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [packages/contractkit/src/wrappers/Election.ts:351](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L351)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`group` | [Address](../modules/_base_.md#address) |
`value` | BigNumber |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  revokePending

▸ **revokePending**(`account`: [Address](../modules/_base_.md#address), `group`: [Address](../modules/_base_.md#address), `value`: BigNumber): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [packages/contractkit/src/wrappers/Election.ts:336](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L336)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_base_.md#address) |
`group` | [Address](../modules/_base_.md#address) |
`value` | BigNumber |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  vote

▸ **vote**(`validatorGroup`: [Address](../modules/_base_.md#address), `value`: BigNumber): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [packages/contractkit/src/wrappers/Election.ts:392](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L392)*

Increments the number of total and pending votes for `group`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorGroup` | [Address](../modules/_base_.md#address) | The validator group to vote for. |
`value` | BigNumber | The amount of gold to use to vote.  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*
