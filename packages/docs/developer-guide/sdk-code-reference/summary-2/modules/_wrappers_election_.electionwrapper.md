# ElectionWrapper

Contract for voting for validators and managing validator groups.

## Hierarchy

* [BaseWrapper]()‹Election›

  ↳ **ElectionWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [electabilityThreshold]()
* [eventTypes]()
* [events]()
* [getCurrentValidatorSigners]()
* [getGroupsVotedForByAccount]()
* [getTotalVotes]()
* [getTotalVotesForGroupByAccount]()
* [methodIds]()
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
* [getPastEvents]()
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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Election |

**Returns:** [_ElectionWrapper_]()

## Properties

### electabilityThreshold

• **electabilityThreshold**: _function_ = proxyCall\( this.contract.methods.getElectabilityThreshold, undefined, fixidityValueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:81_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L81)

Returns the current election threshold.

**`returns`** Election threshold.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _Election\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### getCurrentValidatorSigners

• **getCurrentValidatorSigners**: _function_ = proxyCall\( this.contract.methods.getCurrentValidatorSigners \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:139_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L139)

Returns the current validator signers using the precompiles.

**`returns`** List of current validator signers.

#### Type declaration:

▸ \(\): _Promise‹Address\[\]›_

### getGroupsVotedForByAccount

• **getGroupsVotedForByAccount**: _function_ = proxyCall\( this.contract.methods.getGroupsVotedForByAccount \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:212_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L212)

Returns the groups that `account` has voted for.

**`param`** The address of the account casting votes.

**`returns`** The groups that `account` has voted for.

#### Type declaration:

▸ \(`account`: Address\): _Promise‹Address\[\]›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

### getTotalVotes

• **getTotalVotes**: _function_ = proxyCall\(this.contract.methods.getTotalVotes, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Election.ts:133_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L133)

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

_Defined in_ [_contractkit/src/wrappers/Election.ts:190_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L190)

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

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

### numberValidatorsInCurrentSet

• **numberValidatorsInCurrentSet**: _function_ = proxyCall\( this.contract.methods.numberValidatorsInCurrentSet, undefined, valueToInt \)

_Defined in_ [_contractkit/src/wrappers/Election.ts:123_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L123)

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

_Defined in_ [_contractkit/src/wrappers/Election.ts:113_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L113)

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

_Defined in_ [_contractkit/src/wrappers/Election.ts:103_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L103)

Gets a validator address from the current validator set.

**`param`** Index of requested validator in the validator set.

**`returns`** Address of validator at the requested index.

#### Type declaration:

▸ \(`index`: number\): _Promise‹Address›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `index` | number |

### validatorSignerAddressFromSet

• **validatorSignerAddressFromSet**: _function_ = proxyCall\(this.contract.methods.validatorSignerAddressFromSet\)

_Defined in_ [_contractkit/src/wrappers/Election.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L93)

Gets a validator address from the validator set at the given block number.

**`param`** Index of requested validator in the validator set.

**`param`** Block number to retrieve the validator set from.

**`returns`** Address of validator at the requested index.

#### Type declaration:

▸ \(`signerIndex`: number, `blockNumber`: number\): _Promise‹Address›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signerIndex` | number |
| `blockNumber` | number |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### activate

▸ **activate**\(`account`: Address\): _Promise‹Array‹CeloTransactionObject‹boolean›››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:323_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L323)

Activates any activatable pending votes.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | Address | The account with pending votes to activate. |

**Returns:** _Promise‹Array‹CeloTransactionObject‹boolean›››_

### electValidatorSigners

▸ **electValidatorSigners**\(`min?`: undefined \| number, `max?`: undefined \| number\): _Promise‹Address\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:160_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L160)

Returns a list of elected validators with seats allocated to groups via the D'Hondt method.

**`dev`** See [https://en.wikipedia.org/wiki/D%27Hondt\_method\#Allocation](https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation) for more information.

**Parameters:**

| Name | Type |
| :--- | :--- |
| `min?` | undefined \| number |
| `max?` | undefined \| number |

**Returns:** _Promise‹Address\[\]›_

The list of elected validators.

### electableValidators

▸ **electableValidators**\(\): _Promise‹_[_ElectableValidators_]()_›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L72)

Returns the minimum and maximum number of validators that can be elected.

**Returns:** _Promise‹_[_ElectableValidators_]()_›_

The minimum and maximum number of validators that can be elected.

### findLesserAndGreaterAfterVote

▸ **findLesserAndGreaterAfterVote**\(`votedGroup`: Address, `voteWeight`: BigNumber\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:415_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L415)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `votedGroup` | Address |
| `voteWeight` | BigNumber |

**Returns:** _Promise‹object›_

### getActiveVotesForGroup

▸ **getActiveVotesForGroup**\(`group`: Address, `blockNumber?`: undefined \| number\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:201_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L201)

Returns the active votes for `group`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `group` | Address | The address of the validator group. |
| `blockNumber?` | undefined \| number | - |

**Returns:** _Promise‹BigNumber›_

The active votes for `group`.

### getConfig

▸ **getConfig**\(\): _Promise‹_[_ElectionConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:278_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L278)

Returns current configuration parameters.

**Returns:** _Promise‹_[_ElectionConfig_]()_›_

### getElectedValidators

▸ **getElectedValidators**\(`epochNumber`: number\): _Promise‹_[_Validator_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:444_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L444)

Retrieves the set of validatorsparticipating in BFT at epochNumber.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `epochNumber` | number | The epoch to retrieve the elected validator set at. |

**Returns:** _Promise‹_[_Validator_]()_\[\]›_

### getEligibleValidatorGroupsVotes

▸ **getEligibleValidatorGroupsVotes**\(\): _Promise‹_[_ValidatorGroupVote_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:400_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L400)

Returns the current eligible validator groups and their total votes.

**Returns:** _Promise‹_[_ValidatorGroupVote_]()_\[\]›_

### getGroupVoterRewards

▸ **getGroupVoterRewards**\(`epochNumber`: number\): _Promise‹_[_GroupVoterReward_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:455_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L455)

Retrieves GroupVoterRewards at epochNumber.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `epochNumber` | number | The epoch to retrieve GroupVoterRewards at. |

**Returns:** _Promise‹_[_GroupVoterReward_]()_\[\]›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Election›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Election› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getTotalVotesForGroup

▸ **getTotalVotesForGroup**\(`group`: Address, `blockNumber?`: undefined \| number\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:178_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L178)

Returns the total votes for `group`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `group` | Address | The address of the validator group. |
| `blockNumber?` | undefined \| number | - |

**Returns:** _Promise‹BigNumber›_

The total votes for `group`.

### getValidatorGroupVotes

▸ **getValidatorGroupVotes**\(`address`: Address\): _Promise‹_[_ValidatorGroupVote_]()_›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:294_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L294)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |

**Returns:** _Promise‹_[_ValidatorGroupVote_]()_›_

### getValidatorGroupsVotes

▸ **getValidatorGroupsVotes**\(\): _Promise‹_[_ValidatorGroupVote_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:311_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L311)

Returns the current registered validator groups and their total votes and eligibility.

**Returns:** _Promise‹_[_ValidatorGroupVote_]()_\[\]›_

### getValidatorSigners

▸ **getValidatorSigners**\(`blockNumber`: number\): _Promise‹Address\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:148_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L148)

Returns the validator signers for block `blockNumber`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `blockNumber` | number | Block number to retrieve signers for. |

**Returns:** _Promise‹Address\[\]›_

Address of each signer in the validator set.

### getVoter

▸ **getVoter**\(`account`: Address, `blockNumber?`: undefined \| number\): _Promise‹_[_Voter_]()_›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:238_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L238)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_Voter_]()_›_

### getVoterRewards

▸ **getVoterRewards**\(`address`: Address, `epochNumber`: number, `voterShare?`: Record‹Address, BigNumber›\): _Promise‹_[_VoterReward_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:480_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L480)

Retrieves VoterRewards for address at epochNumber.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | The address to retrieve VoterRewards for. |
| `epochNumber` | number | The epoch to retrieve VoterRewards at. |
| `voterShare?` | Record‹Address, BigNumber› | Optionally address' share of group rewards. |

**Returns:** _Promise‹_[_VoterReward_]()_\[\]›_

### getVoterShare

▸ **getVoterShare**\(`address`: Address, `blockNumber?`: undefined \| number\): _Promise‹Record‹Address, BigNumber››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:510_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L510)

Retrieves a voter's share of active votes.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | The voter to retrieve share for. |
| `blockNumber?` | undefined \| number | The block to retrieve the voter's share at. |

**Returns:** _Promise‹Record‹Address, BigNumber››_

### getVotesForGroupByAccount

▸ **getVotesForGroupByAccount**\(`account`: Address, `group`: Address, `blockNumber?`: undefined \| number\): _Promise‹_[_GroupVote_]()_›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:216_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L216)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |
| `group` | Address |
| `blockNumber?` | undefined \| number |

**Returns:** _Promise‹_[_GroupVote_]()_›_

### hasActivatablePendingVotes

▸ **hasActivatablePendingVotes**\(`account`: Address\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:267_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L267)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹boolean›_

### hasPendingVotes

▸ **hasPendingVotes**\(`account`: Address\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Election.ts:255_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L255)

Returns whether or not the account has any pending votes.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `account` | Address | The address of the account casting votes. |

**Returns:** _Promise‹boolean›_

The groups that `account` has voted for.

### revoke

▸ **revoke**\(`account`: Address, `group`: Address, `value`: BigNumber\): _Promise‹Array‹CeloTransactionObject‹boolean›››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:362_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L362)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |
| `group` | Address |
| `value` | BigNumber |

**Returns:** _Promise‹Array‹CeloTransactionObject‹boolean›››_

### revokeActive

▸ **revokeActive**\(`account`: Address, `group`: Address, `value`: BigNumber\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:347_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L347)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |
| `group` | Address |
| `value` | BigNumber |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### revokePending

▸ **revokePending**\(`account`: Address, `group`: Address, `value`: BigNumber\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:332_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L332)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |
| `group` | Address |
| `value` | BigNumber |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### vote

▸ **vote**\(`validatorGroup`: Address, `value`: BigNumber\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Election.ts:388_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Election.ts#L388)

Increments the number of total and pending votes for `group`.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validatorGroup` | Address | The validator group to vote for. |
| `value` | BigNumber | The amount of gold to use to vote. |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

