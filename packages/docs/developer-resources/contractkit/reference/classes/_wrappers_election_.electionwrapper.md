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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)*

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

*Defined in [contractkit/src/wrappers/Election.ts:81](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L81)*

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

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

___

###  events

• **events**: *Election["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:39](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)*

___

###  getCurrentValidatorSigners

• **getCurrentValidatorSigners**: *function* = proxyCall(
    this.contract.methods.getCurrentValidatorSigners
  )

*Defined in [contractkit/src/wrappers/Election.ts:139](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L139)*

Returns the current validator signers using the precompiles.

**`returns`** List of current validator signers.

#### Type declaration:

▸ (): *Promise‹Address[]›*

___

###  getGroupsVotedForByAccount

• **getGroupsVotedForByAccount**: *function* = proxyCall(
    this.contract.methods.getGroupsVotedForByAccount
  )

*Defined in [contractkit/src/wrappers/Election.ts:212](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L212)*

Returns the groups that `account` has voted for.

**`param`** The address of the account casting votes.

**`returns`** The groups that `account` has voted for.

#### Type declaration:

▸ (`account`: Address): *Promise‹Address[]›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

___

###  getTotalVotes

• **getTotalVotes**: *function* = proxyCall(this.contract.methods.getTotalVotes, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Election.ts:133](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L133)*

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

*Defined in [contractkit/src/wrappers/Election.ts:190](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L190)*

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

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:46](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)*

___

###  numberValidatorsInCurrentSet

• **numberValidatorsInCurrentSet**: *function* = proxyCall(
    this.contract.methods.numberValidatorsInCurrentSet,
    undefined,
    valueToInt
  )

*Defined in [contractkit/src/wrappers/Election.ts:123](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L123)*

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

*Defined in [contractkit/src/wrappers/Election.ts:113](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L113)*

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

*Defined in [contractkit/src/wrappers/Election.ts:103](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L103)*

Gets a validator address from the current validator set.

**`param`** Index of requested validator in the validator set.

**`returns`** Address of validator at the requested index.

#### Type declaration:

▸ (`index`: number): *Promise‹Address›*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

___

###  validatorSignerAddressFromSet

• **validatorSignerAddressFromSet**: *function* = proxyCall(this.contract.methods.validatorSignerAddressFromSet)

*Defined in [contractkit/src/wrappers/Election.ts:93](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L93)*

Gets a validator address from the validator set at the given block number.

**`param`** Index of requested validator in the validator set.

**`param`** Block number to retrieve the validator set from.

**`returns`** Address of validator at the requested index.

#### Type declaration:

▸ (`signerIndex`: number, `blockNumber`: number): *Promise‹Address›*

**Parameters:**

Name | Type |
------ | ------ |
`signerIndex` | number |
`blockNumber` | number |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)*

Contract address

**Returns:** *string*

## Methods

###  activate

▸ **activate**(`account`: Address): *Promise‹Array‹CeloTransactionObject‹boolean›››*

*Defined in [contractkit/src/wrappers/Election.ts:323](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L323)*

Activates any activatable pending votes.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | Address | The account with pending votes to activate.  |

**Returns:** *Promise‹Array‹CeloTransactionObject‹boolean›››*

___

###  electValidatorSigners

▸ **electValidatorSigners**(`min?`: undefined | number, `max?`: undefined | number): *Promise‹Address[]›*

*Defined in [contractkit/src/wrappers/Election.ts:160](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L160)*

Returns a list of elected validators with seats allocated to groups via the D'Hondt method.

**`dev`** See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.

**Parameters:**

Name | Type |
------ | ------ |
`min?` | undefined &#124; number |
`max?` | undefined &#124; number |

**Returns:** *Promise‹Address[]›*

The list of elected validators.

___

###  electableValidators

▸ **electableValidators**(): *Promise‹[ElectableValidators](../interfaces/_wrappers_election_.electablevalidators.md)›*

*Defined in [contractkit/src/wrappers/Election.ts:72](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L72)*

Returns the minimum and maximum number of validators that can be elected.

**Returns:** *Promise‹[ElectableValidators](../interfaces/_wrappers_election_.electablevalidators.md)›*

The minimum and maximum number of validators that can be elected.

___

###  findLesserAndGreaterAfterVote

▸ **findLesserAndGreaterAfterVote**(`votedGroup`: Address, `voteWeight`: BigNumber): *Promise‹object›*

*Defined in [contractkit/src/wrappers/Election.ts:415](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L415)*

**Parameters:**

Name | Type |
------ | ------ |
`votedGroup` | Address |
`voteWeight` | BigNumber |

**Returns:** *Promise‹object›*

___

###  getActiveVotesForGroup

▸ **getActiveVotesForGroup**(`group`: Address, `blockNumber?`: undefined | number): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/Election.ts:201](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L201)*

Returns the active votes for `group`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | Address | The address of the validator group. |
`blockNumber?` | undefined &#124; number | - |

**Returns:** *Promise‹BigNumber›*

The active votes for `group`.

___

###  getConfig

▸ **getConfig**(): *Promise‹[ElectionConfig](../interfaces/_wrappers_election_.electionconfig.md)›*

*Defined in [contractkit/src/wrappers/Election.ts:278](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L278)*

Returns current configuration parameters.

**Returns:** *Promise‹[ElectionConfig](../interfaces/_wrappers_election_.electionconfig.md)›*

___

###  getElectedValidators

▸ **getElectedValidators**(`epochNumber`: number): *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:444](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L444)*

Retrieves the set of validatorsparticipating in BFT at epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`epochNumber` | number | The epoch to retrieve the elected validator set at.  |

**Returns:** *Promise‹[Validator](../interfaces/_wrappers_validators_.validator.md)[]›*

___

###  getEligibleValidatorGroupsVotes

▸ **getEligibleValidatorGroupsVotes**(): *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:400](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L400)*

Returns the current eligible validator groups and their total votes.

**Returns:** *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)[]›*

___

###  getGroupVoterRewards

▸ **getGroupVoterRewards**(`epochNumber`: number): *Promise‹[GroupVoterReward](../interfaces/_wrappers_election_.groupvoterreward.md)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:455](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L455)*

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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:35](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Election› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getTotalVotesForGroup

▸ **getTotalVotesForGroup**(`group`: Address, `blockNumber?`: undefined | number): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/Election.ts:178](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L178)*

Returns the total votes for `group`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`group` | Address | The address of the validator group. |
`blockNumber?` | undefined &#124; number | - |

**Returns:** *Promise‹BigNumber›*

The total votes for `group`.

___

###  getValidatorGroupVotes

▸ **getValidatorGroupVotes**(`address`: Address): *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)›*

*Defined in [contractkit/src/wrappers/Election.ts:294](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L294)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)›*

___

###  getValidatorGroupsVotes

▸ **getValidatorGroupsVotes**(): *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:311](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L311)*

Returns the current registered validator groups and their total votes and eligibility.

**Returns:** *Promise‹[ValidatorGroupVote](../interfaces/_wrappers_election_.validatorgroupvote.md)[]›*

___

###  getValidatorSigners

▸ **getValidatorSigners**(`blockNumber`: number): *Promise‹Address[]›*

*Defined in [contractkit/src/wrappers/Election.ts:148](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L148)*

Returns the validator signers for block `blockNumber`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`blockNumber` | number | Block number to retrieve signers for. |

**Returns:** *Promise‹Address[]›*

Address of each signer in the validator set.

___

###  getVoter

▸ **getVoter**(`account`: Address, `blockNumber?`: undefined | number): *Promise‹[Voter](../interfaces/_wrappers_election_.voter.md)›*

*Defined in [contractkit/src/wrappers/Election.ts:238](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L238)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[Voter](../interfaces/_wrappers_election_.voter.md)›*

___

###  getVoterRewards

▸ **getVoterRewards**(`address`: Address, `epochNumber`: number, `voterShare?`: Record‹Address, BigNumber›): *Promise‹[VoterReward](../interfaces/_wrappers_election_.voterreward.md)[]›*

*Defined in [contractkit/src/wrappers/Election.ts:480](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L480)*

Retrieves VoterRewards for address at epochNumber.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | The address to retrieve VoterRewards for. |
`epochNumber` | number | The epoch to retrieve VoterRewards at. |
`voterShare?` | Record‹Address, BigNumber› | Optionally address' share of group rewards.  |

**Returns:** *Promise‹[VoterReward](../interfaces/_wrappers_election_.voterreward.md)[]›*

___

###  getVoterShare

▸ **getVoterShare**(`address`: Address, `blockNumber?`: undefined | number): *Promise‹Record‹Address, BigNumber››*

*Defined in [contractkit/src/wrappers/Election.ts:510](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L510)*

Retrieves a voter's share of active votes.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | The voter to retrieve share for. |
`blockNumber?` | undefined &#124; number | The block to retrieve the voter's share at.  |

**Returns:** *Promise‹Record‹Address, BigNumber››*

___

###  getVotesForGroupByAccount

▸ **getVotesForGroupByAccount**(`account`: Address, `group`: Address, `blockNumber?`: undefined | number): *Promise‹[GroupVote](../interfaces/_wrappers_election_.groupvote.md)›*

*Defined in [contractkit/src/wrappers/Election.ts:216](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L216)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |
`group` | Address |
`blockNumber?` | undefined &#124; number |

**Returns:** *Promise‹[GroupVote](../interfaces/_wrappers_election_.groupvote.md)›*

___

###  hasActivatablePendingVotes

▸ **hasActivatablePendingVotes**(`account`: Address): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Election.ts:267](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L267)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *Promise‹boolean›*

___

###  hasPendingVotes

▸ **hasPendingVotes**(`account`: Address): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Election.ts:255](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L255)*

Returns whether or not the account has any pending votes.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`account` | Address | The address of the account casting votes. |

**Returns:** *Promise‹boolean›*

The groups that `account` has voted for.

___

###  revoke

▸ **revoke**(`account`: Address, `group`: Address, `value`: BigNumber): *Promise‹Array‹CeloTransactionObject‹boolean›››*

*Defined in [contractkit/src/wrappers/Election.ts:362](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L362)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |
`group` | Address |
`value` | BigNumber |

**Returns:** *Promise‹Array‹CeloTransactionObject‹boolean›››*

___

###  revokeActive

▸ **revokeActive**(`account`: Address, `group`: Address, `value`: BigNumber): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [contractkit/src/wrappers/Election.ts:347](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L347)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |
`group` | Address |
`value` | BigNumber |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  revokePending

▸ **revokePending**(`account`: Address, `group`: Address, `value`: BigNumber): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [contractkit/src/wrappers/Election.ts:332](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L332)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |
`group` | Address |
`value` | BigNumber |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  vote

▸ **vote**(`validatorGroup`: Address, `value`: BigNumber): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [contractkit/src/wrappers/Election.ts:388](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L388)*

Increments the number of total and pending votes for `group`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorGroup` | Address | The validator group to vote for. |
`value` | BigNumber | The amount of gold to use to vote.  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*
