# ElectionWrapper

Contract for voting for validators and managing validator groups.

## Hierarchy

* [BaseWrapper]()‹Election›

  ↳ **ElectionWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [\_activate]()
* [electabilityThreshold]()
* [events]()
* [getCurrentValidatorSigners]()
* [getGroupsVotedForByAccount]()
* [getTotalVotes]()
* [getTotalVotesForGroupByAccount]()
* [numberValidatorsInCurrentSet]()
* [numberValidatorsInSet]()
* [validatorSignerAddressFromCurrentSet]()
* [validatorSignerAddressFromSet]()

### Accessors

* [address]()

### Methods

* [activate]()
* [electValidatorSigners]()
* [electableValidators]()
* [findLesserAndGreaterAfterVote]()
* [getActiveVotesForGroup]()
* [getConfig]()
* [getElectedValidators]()
* [getEligibleValidatorGroupsVotes]()
* [getGroupVoterRewards]()
* [getTotalVotesForGroup]()
* [getValidatorGroupVotes]()
* [getValidatorGroupsVotes]()
* [getValidatorSigners]()
* [getVoter]()
* [getVoterRewards]()
* [getVoterShare]()
* [getVotesForGroupByAccount]()
* [hasActivatablePendingVotes]()
* [hasPendingVotes]()
* [revoke]()
* [revokeActive]()
* [revokePending]()
* [vote]()

## Constructors

### constructor

+ **new ElectionWrapper**\(`kit`: [ContractKit](), `contract`: Election\): [_ElectionWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Election |

**Returns:** [_ElectionWrapper_]()

## Properties

### \_activate

• **\_activate**: _function_ = proxySend\(this.kit, this.contract.methods.activate\)

_Defined in_ [_contractkit/src/wrappers/Election.ts:321_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L321)

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### electabilityThreshold

• **electabilityThreshold**: _function_ = proxyCall\( this.contract.methods.getElectabilityThreshold, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:85_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L85)

Returns the current election threshold.

**`returns`** Election threshold.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### getCurrentValidatorSigners

• **getCurrentValidatorSigners**: _function_ = proxyCall\( this.contract.methods.getCurrentValidatorSigners \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:143_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L143)

Returns the current validator signers using the precompiles.

**`returns`** List of current validator signers.

#### Type declaration:

▸ \(\): _Promise‹_[_Address_](_base_.md#address)_\[\]›_

### getGroupsVotedForByAccount

• **getGroupsVotedForByAccount**: _function_ = proxyCall\( this.contract.methods.getGroupsVotedForByAccount \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:216_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L216)

Returns the groups that `account` has voted for.

**`param`** The address of the account casting votes.

**`returns`** The groups that `account` has voted for.

#### Type declaration:

▸ \(`account`: [Address](_base_.md#address)\): _Promise‹_[_Address_](_base_.md#address)_\[\]›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |

### getTotalVotes

• **getTotalVotes**: _function_ = proxyCall\(this.contract.methods.getTotalVotes, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Election.ts:137_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L137)

Returns the total votes received across all groups.

**`returns`** The total votes received across all groups.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getTotalVotesForGroupByAccount

• **getTotalVotesForGroupByAccount**: _function_ = proxyCall\( this.contract.methods.getTotalVotesForGroupByAccount, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:194_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L194)

Returns the total votes for `group` made by `account`.

**`param`** The address of the validator group.

**`param`** The address of the voting account.

**`returns`** The total votes for `group` made by `account`.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### numberValidatorsInCurrentSet

• **numberValidatorsInCurrentSet**: _function_ = proxyCall\( this.contract.methods.numberValidatorsInCurrentSet, undefined, valueToInt \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:127_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L127)

Gets the size of the current elected validator set.

**`returns`** Size of the current elected validator set.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### numberValidatorsInSet

• **numberValidatorsInSet**: _function_ = proxyCall\( this.contract.methods.numberValidatorsInSet, undefined, valueToInt \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L117)

Gets the size of the validator set that must sign the given block number.

**`param`** Block number to retrieve the validator set from.

**`returns`** Size of the validator set.

#### Type declaration:

▸ \(`blockNumber`: number\): _Promise‹number›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber` | number |

### validatorSignerAddressFromCurrentSet

• **validatorSignerAddressFromCurrentSet**: _function_ = proxyCall\( this.contract.methods.validatorSignerAddressFromCurrentSet, tupleParser\(identity\) \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:107_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L107)

Gets a validator address from the current validator set.

**`param`** Index of requested validator in the validator set.

**`returns`** Address of validator at the requested index.

#### Type declaration:

▸ \(`index`: number\): _Promise‹_[_Address_](_base_.md#address)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `index` | number |

### validatorSignerAddressFromSet

• **validatorSignerAddressFromSet**: _function_ = proxyCall\(this.contract.methods.validatorSignerAddressFromSet\)

_Defined in_ [_contractkit/src/wrappers/Election.ts:97_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L97)

Gets a validator address from the validator set at the given block number.

**`param`** Index of requested validator in the validator set.

**`param`** Block number to retrieve the validator set from.

**`returns`** Address of validator at the requested index.

#### Type declaration:

▸ \(`signerIndex`: number, `blockNumber`: number\): _Promise‹_[_Address_](_base_.md#address)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signerIndex` | number |
| `blockNumber` | number |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### activate

▸ **activate**\(`account`: [Address](_base_.md#address)\): _Promise‹Array‹_[_CeloTransactionObject_]()_‹boolean›››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:327_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L327)

Activates any activatable pending votes.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | [Address](_base_.md#address) | The account with pending votes to activate. |

**Returns:** _Promise‹Array‹_[_CeloTransactionObject_]()_‹boolean›››_

### electValidatorSigners

▸ **electValidatorSigners**\(`min?`: undefined \| number, `max?`: undefined \| number\): _Promise‹_[_Address_](_base_.md#address)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:164_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L164)

Returns a list of elected validators with seats allocated to groups via the D'Hondt method.

**`dev`** See [https://en.wikipedia.org/wiki/D%27Hondt\_method\#Allocation](https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation) for more information.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `min?` | undefined \| number |
| `max?` | undefined \| number |

**Returns:** _Promise‹_[_Address_](_base_.md#address)_\[\]›_

The list of elected validators.

### electableValidators

▸ **electableValidators**\(\): _Promise‹_[_ElectableValidators_]()_›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:76_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L76)

Returns the minimum and maximum number of validators that can be elected.

**Returns:** _Promise‹_[_ElectableValidators_]()_›_

The minimum and maximum number of validators that can be elected.

### findLesserAndGreaterAfterVote

▸ **findLesserAndGreaterAfterVote**\(`votedGroup`: [Address](_base_.md#address), `voteWeight`: BigNumber\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:423_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L423)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `votedGroup` | [Address](_base_.md#address) |
| `voteWeight` | BigNumber |

**Returns:** _Promise‹object›_

### getActiveVotesForGroup

▸ **getActiveVotesForGroup**\(`group`: [Address](_base_.md#address), `blockNumber?`: undefined \| number\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:205_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L205)

Returns the active votes for `group`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `group` | [Address](_base_.md#address) | The address of the validator group. |
| `blockNumber?` | undefined \| number | - |

**Returns:** _Promise‹BigNumber›_

The active votes for `group`.

### getConfig

▸ **getConfig**\(\): _Promise‹_[_ElectionConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:282_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L282)

Returns current configuration parameters.

**Returns:** _Promise‹_[_ElectionConfig_]()_›_

### getElectedValidators

▸ **getElectedValidators**\(`epochNumber`: number\): _Promise‹_[_Validator_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:452_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L452)

Retrieves the set of validatorsparticipating in BFT at epochNumber.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `epochNumber` | number | The epoch to retrieve the elected validator set at. |

**Returns:** _Promise‹_[_Validator_]()_\[\]›_

### getEligibleValidatorGroupsVotes

▸ **getEligibleValidatorGroupsVotes**\(\): _Promise‹_[_ValidatorGroupVote_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:408_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L408)

Returns the current eligible validator groups and their total votes.

**Returns:** _Promise‹_[_ValidatorGroupVote_]()_\[\]›_

### getGroupVoterRewards

▸ **getGroupVoterRewards**\(`epochNumber`: number\): _Promise‹_[_GroupVoterReward_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:463_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L463)

Retrieves GroupVoterRewards at epochNumber.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `epochNumber` | number | The epoch to retrieve GroupVoterRewards at. |

**Returns:** _Promise‹_[_GroupVoterReward_]()_\[\]›_

### getTotalVotesForGroup

▸ **getTotalVotesForGroup**\(`group`: [Address](_base_.md#address), `blockNumber?`: undefined \| number\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:182_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L182)

Returns the total votes for `group`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `group` | [Address](_base_.md#address) | The address of the validator group. |
| `blockNumber?` | undefined \| number | - |

**Returns:** _Promise‹BigNumber›_

The total votes for `group`.

### getValidatorGroupVotes

▸ **getValidatorGroupVotes**\(`address`: [Address](_base_.md#address)\): _Promise‹_[_ValidatorGroupVote_]()_›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:298_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L298)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_base_.md#address) |

**Returns:** _Promise‹_[_ValidatorGroupVote_]()_›_

### getValidatorGroupsVotes

▸ **getValidatorGroupsVotes**\(\): _Promise‹_[_ValidatorGroupVote_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:315_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L315)

Returns the current registered validator groups and their total votes and eligibility.

**Returns:** _Promise‹_[_ValidatorGroupVote_]()_\[\]›_

### getValidatorSigners

▸ **getValidatorSigners**\(`blockNumber`: number\): _Promise‹_[_Address_](_base_.md#address)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:152_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L152)

Returns the validator signers for block `blockNumber`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `blockNumber` | number | Block number to retrieve signers for. |

**Returns:** _Promise‹_[_Address_](_base_.md#address)_\[\]›_

Address of each signer in the validator set.

### getVoter

▸ **getVoter**\(`account`: [Address](_base_.md#address), `blockNumber?`: undefined \| number\): _Promise‹_[_Voter_]()_›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:242_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L242)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_Voter_]()_›_

### getVoterRewards

▸ **getVoterRewards**\(`address`: [Address](_base_.md#address), `epochNumber`: number, `voterShare?`: Record‹[Address](_base_.md#address), BigNumber›\): _Promise‹_[_VoterReward_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:488_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L488)

Retrieves VoterRewards for address at epochNumber.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | The address to retrieve VoterRewards for. |
| `epochNumber` | number | The epoch to retrieve VoterRewards at. |
| `voterShare?` | Record‹[Address](_base_.md#address), BigNumber› | Optionally address' share of group rewards. |

**Returns:** _Promise‹_[_VoterReward_]()_\[\]›_

### getVoterShare

▸ **getVoterShare**\(`address`: [Address](_base_.md#address), `blockNumber?`: undefined \| number\): _Promise‹Record‹_[_Address_](_base_.md#address)_, BigNumber››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:518_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L518)

Retrieves a voter's share of active votes.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | The voter to retrieve share for. |
| `blockNumber?` | undefined \| number | The block to retrieve the voter's share at. |

**Returns:** _Promise‹Record‹_[_Address_](_base_.md#address)_, BigNumber››_

### getVotesForGroupByAccount

▸ **getVotesForGroupByAccount**\(`account`: [Address](_base_.md#address), `group`: [Address](_base_.md#address), `blockNumber?`: undefined \| number\): _Promise‹_[_GroupVote_]()_›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:220_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L220)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |
| `group` | [Address](_base_.md#address) |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_GroupVote_]()_›_

### hasActivatablePendingVotes

▸ **hasActivatablePendingVotes**\(`account`: [Address](_base_.md#address)\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:271_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L271)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |

**Returns:** _Promise‹boolean›_

### hasPendingVotes

▸ **hasPendingVotes**\(`account`: [Address](_base_.md#address)\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:259_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L259)

Returns whether or not the account has any pending votes.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | [Address](_base_.md#address) | The address of the account casting votes. |

**Returns:** _Promise‹boolean›_

The groups that `account` has voted for.

### revoke

▸ **revoke**\(`account`: [Address](_base_.md#address), `group`: [Address](_base_.md#address), `value`: BigNumber\): _Promise‹Array‹_[_CeloTransactionObject_]()_‹boolean›››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:366_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L366)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |
| `group` | [Address](_base_.md#address) |
| `value` | BigNumber |

**Returns:** _Promise‹Array‹_[_CeloTransactionObject_]()_‹boolean›››_

### revokeActive

▸ **revokeActive**\(`account`: [Address](_base_.md#address), `group`: [Address](_base_.md#address), `value`: BigNumber\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:351_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L351)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |
| `group` | [Address](_base_.md#address) |
| `value` | BigNumber |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### revokePending

▸ **revokePending**\(`account`: [Address](_base_.md#address), `group`: [Address](_base_.md#address), `value`: BigNumber\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:336_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L336)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |
| `group` | [Address](_base_.md#address) |
| `value` | BigNumber |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### vote

▸ **vote**\(`validatorGroup`: [Address](_base_.md#address), `value`: BigNumber\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:392_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Election.ts#L392)

Increments the number of total and pending votes for `group`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorGroup` | [Address](_base_.md#address) | The validator group to vote for. |
| `value` | BigNumber | The amount of gold to use to vote. |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

