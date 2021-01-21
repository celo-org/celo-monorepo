# GovernanceWrapper

Contract managing voting for governance proposals.

## Hierarchy

* [BaseWrapper]()‹Governance›

  ↳ **GovernanceWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [approveHotfix]()
* [concurrentProposals]()
* [dequeueFrequency]()
* [dequeueProposalsIfReady]()
* [eventTypes]()
* [events]()
* [executeHotfix]()
* [getApprover]()
* [getProposalMetadata]()
* [getProposalStage]()
* [getProposalTransaction]()
* [getQueue]()
* [getRefundedDeposits]()
* [getUpvoteRecord]()
* [getUpvotes]()
* [getVotes]()
* [hotfixWhitelistValidatorTally]()
* [isApproved]()
* [isDequeuedProposalExpired]()
* [isHotfixPassing]()
* [isHotfixWhitelistedBy]()
* [isProposalPassing]()
* [isQueued]()
* [isQueuedProposalExpired]()
* [isVoting]()
* [lastDequeue]()
* [methodIds]()
* [minDeposit]()
* [minQuorumSize]()
* [prepareHotfix]()
* [proposalExists]()
* [propose]()
* [queueExpiry]()
* [whitelistHotfix]()
* [withdraw]()

### Accessors

* [address]()

### Methods

* [approve]()
* [execute]()
* [getConfig]()
* [getConstitution]()
* [getDequeue]()
* [getHotfixRecord]()
* [getHumanReadableConfig]()
* [getHumanReadableProposalMetadata]()
* [getParticipationParameters]()
* [getPastEvents]()
* [getProposal]()
* [getProposalRecord]()
* [getTransactionConstitution]()
* [getVoteRecord]()
* [getVoteRecords]()
* [getVoteValue]()
* [getVoteWeight]()
* [getVoter]()
* [humanReadableTimeUntilStages]()
* [revokeUpvote]()
* [sortedQueue]()
* [stageDurations]()
* [timeUntilStages]()
* [upvote]()
* [vote]()

## Constructors

### constructor

+ **new GovernanceWrapper**\(`kit`: [ContractKit](), `contract`: Governance\): [_GovernanceWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Governance |

**Returns:** [_GovernanceWrapper_]()

## Properties

### approveHotfix

• **approveHotfix**: _function_ = proxySend\(this.kit, this.contract.methods.approveHotfix, tupleParser\(bufferToHex\)\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:799_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L799)

Marks the given hotfix approved by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

**`notice`** Only the `approver` address will succeed in sending this transaction

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### concurrentProposals

• **concurrentProposals**: _function_ = proxyCall\( this.contract.methods.concurrentProposals, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:145_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L145)

Querying number of possible concurrent proposals.

**`returns`** Current number of possible concurrent proposals.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### dequeueFrequency

• **dequeueFrequency**: _function_ = proxyCall\(this.contract.methods.dequeueFrequency, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:159_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L159)

Query proposal dequeue frequency.

**`returns`** Current proposal dequeue frequency in seconds.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### dequeueProposalsIfReady

• **dequeueProposalsIfReady**: _function_ = proxySend\(this.kit, this.contract.methods.dequeueProposalsIfReady\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:570_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L570)

Dequeues any queued proposals if `dequeueFrequency` seconds have elapsed since the last dequeue

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _Governance\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### executeHotfix

• **executeHotfix**: _function_ = proxySend\(this.kit, this.contract.methods.executeHotfix, hotfixToParams\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:813_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L813)

Executes a given sequence of transactions if the corresponding hash is prepared and approved.

**`param`** Governance hotfix proposal

**`param`** Secret which guarantees uniqueness of hash

**`notice`** keccak256 hash of abi encoded transactions computed on-chain

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getApprover

• **getApprover**: _function_ = proxyCall\(this.contract.methods.approver\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:352_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L352)

Returns the approver address for proposals and hotfixes.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getProposalMetadata

• **getProposalMetadata**: _function_ = proxyCall\( this.contract.methods.getProposal, tupleParser\(valueToString\), \(res\) =&gt; \({ proposer: res\[0\], deposit: valueToBigNumber\(res\[1\]\), timestamp: valueToBigNumber\(res\[2\]\), transactionCount: valueToInt\(res\[3\]\), descriptionURL: res\[4\], }\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:280_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L280)

Returns the metadata associated with a given proposal.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(`proposalID`: BigNumber.Value\): _Promise‹_[_ProposalMetadata_]()_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |

### getProposalStage

• **getProposalStage**: _function_ = proxyCall\( this.contract.methods.getProposalStage, tupleParser\(valueToString\), \(res\) =&gt; Object.keys\(ProposalStage\)\[valueToInt\(res\)\] as ProposalStage \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:354_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L354)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getProposalTransaction

• **getProposalTransaction**: _function_ = proxyCall\( this.contract.methods.getProposalTransaction, tupleParser\(valueToString, valueToString\), \(res\) =&gt; \({ value: res\[0\], to: res\[1\], input: solidityBytesToString\(res\[2\]\), }\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:309_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L309)

Returns the transaction at the given index associated with a given proposal.

**`param`** Governance proposal UUID

**`param`** Transaction index

#### Type declaration:

▸ \(`proposalID`: BigNumber.Value, `txIndex`: number\): _Promise‹_[_ProposalTransaction_](_wrappers_governance_.md#proposaltransaction)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |
| `txIndex` | number |

### getQueue

• **getQueue**: _function_ = proxyCall\(this.contract.methods.getQueue, undefined, \(arraysObject\) =&gt; zip\( \(\_id, \_upvotes\) =&gt; \({ proposalID: valueToBigNumber\(\_id\), upvotes: valueToBigNumber\(\_upvotes\), }\), arraysObject\[0\], arraysObject\[1\] \) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:521_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L521)

Returns the proposal queue as list of upvote records.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getRefundedDeposits

• **getRefundedDeposits**: _function_ = proxyCall\( this.contract.methods.refundedDeposits, tupleParser\(stringIdentity\), valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:488_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L488)

Returns the value of proposal deposits that have been refunded.

**`param`** Governance proposer address.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getUpvoteRecord

• **getUpvoteRecord**: _function_ = proxyCall\( this.contract.methods.getUpvoteRecord, tupleParser\(identity\), \(o\) =&gt; \({ proposalID: valueToBigNumber\(o\[0\]\), upvotes: valueToBigNumber\(o\[1\]\), }\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:448_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L448)

Returns the current upvoted governance proposal ID and applied vote weight \(zeroes if none\).

**`param`** Address of upvoter

#### Type declaration:

▸ \(`upvoter`: Address\): _Promise‹_[_UpvoteRecord_]()_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `upvoter` | Address |

### getUpvotes

• **getUpvotes**: _function_ = proxyCall\( this.contract.methods.getUpvotes, tupleParser\(valueToString\), valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:498_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L498)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getVotes

• **getVotes**: _function_ = proxyCall\( this.contract.methods.getVoteTotals, tupleParser\(valueToString\), \(res\): Votes =&gt; \({ \[VoteValue.Yes\]: valueToBigNumber\(res\[0\]\), \[VoteValue.No\]: valueToBigNumber\(res\[1\]\), \[VoteValue.Abstain\]: valueToBigNumber\(res\[2\]\), }\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:508_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L508)

Returns the yes, no, and abstain votes applied to a given proposal.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### hotfixWhitelistValidatorTally

• **hotfixWhitelistValidatorTally**: _function_ = proxyCall\( this.contract.methods.hotfixWhitelistValidatorTally, tupleParser\(bufferToHex\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:779_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L779)

Returns the number of validators that whitelisted the hotfix

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isApproved

• **isApproved**: _function_ = proxyCall\( this.contract.methods.isApproved, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:326_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L326)

Returns whether a given proposal is approved.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(`proposalID`: BigNumber.Value\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |

### isDequeuedProposalExpired

• **isDequeuedProposalExpired**: _function_ = proxyCall\( this.contract.methods.isDequeuedProposalExpired, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:335_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L335)

Returns whether a dequeued proposal is expired.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(`proposalID`: BigNumber.Value\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |

### isHotfixPassing

• **isHotfixPassing**: _function_ = proxyCall\(this.contract.methods.isHotfixPassing, tupleParser\(bufferToHex\)\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:764_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L764)

Returns whether a given hotfix can be passed.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isHotfixWhitelistedBy

• **isHotfixWhitelistedBy**: _function_ = proxyCall\( this.contract.methods.isHotfixWhitelistedBy, tupleParser\(bufferToHex, \(s: Address\) =&gt; identity\(s\)\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:755_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L755)

Returns whether a given hotfix has been whitelisted by a given address.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

**`param`** address of whitelister

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isProposalPassing

• **isProposalPassing**: _function_ = proxyCall\(this.contract.methods.isProposalPassing, tupleParser\(valueToString\)\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:421_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L421)

Returns whether a given proposal is passing relative to the constitution's threshold.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isQueued

• **isQueued**: _function_ = proxyCall\(this.contract.methods.isQueued, tupleParser\(valueToString\)\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:482_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L482)

Returns whether a given proposal is queued.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isQueuedProposalExpired

• **isQueuedProposalExpired**: _function_ = proxyCall\( this.contract.methods.isQueuedProposalExpired, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:344_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L344)

Returns whether a dequeued proposal is expired.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isVoting

• **isVoting**: _function_ = proxyCall\(this.contract.methods.isVoting\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:227_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L227)

Returns whether or not a particular account is voting on proposals.

**`param`** The address of the account.

**`returns`** Whether or not the account is voting on proposals.

#### Type declaration:

▸ \(`account`: string\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |

### lastDequeue

• **lastDequeue**: _function_ = proxyCall\(this.contract.methods.lastDequeue, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:154_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L154)

Query proposal dequeue frequency.

**`returns`** Current proposal dequeue frequency in seconds.

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

### minDeposit

• **minDeposit**: _function_ = proxyCall\(this.contract.methods.minDeposit, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:164_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L164)

Query minimum deposit required to make a proposal.

**`returns`** Current minimum deposit.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### minQuorumSize

• **minQuorumSize**: _function_ = proxyCall\( this.contract.methods.minQuorumSizeInCurrentSet, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:769_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L769)

Returns the number of validators required to reach a Byzantine quorum

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### prepareHotfix

• **prepareHotfix**: _function_ = proxySend\(this.kit, this.contract.methods.prepareHotfix, tupleParser\(bufferToHex\)\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:805_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L805)

Marks the given hotfix prepared for current epoch if quorum of validators have whitelisted it.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### proposalExists

• **proposalExists**: _function_ = proxyCall\( this.contract.methods.proposalExists, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:439_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L439)

Returns whether a governance proposal exists with the given ID.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(`proposalID`: BigNumber.Value\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |

### propose

• **propose**: _function_ = proxySend\(this.kit, this.contract.methods.propose, proposalToParams\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:433_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L433)

Submits a new governance proposal.

**`param`** Governance proposal

**`param`** A URL where further information about the proposal can be viewed

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### queueExpiry

• **queueExpiry**: _function_ = proxyCall\(this.contract.methods.queueExpiry, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:169_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L169)

Query queue expiry parameter.

**`returns`** The number of seconds a proposal can stay in the queue before expiring.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### whitelistHotfix

• **whitelistHotfix**: _function_ = proxySend\( this.kit, this.contract.methods.whitelistHotfix, tupleParser\(bufferToHex\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:788_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L788)

Marks the given hotfix whitelisted by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### withdraw

• **withdraw**: _function_ = proxySend\(this.kit, this.contract.methods.withdraw\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:426_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L426)

Withdraws refunded proposal deposits.

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### approve

▸ **approve**\(`proposalID`: BigNumber.Value\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:692_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L692)

Approves given proposal, allowing it to later move to `referendum`.

**`notice`** Only the `approver` address will succeed in sending this transaction

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### execute

▸ **execute**\(`proposalID`: BigNumber.Value\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:729_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L729)

Executes a given proposal's associated transactions.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### getConfig

▸ **getConfig**\(\): _Promise‹_[_GovernanceConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:232_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L232)

Returns current configuration parameters.

**Returns:** _Promise‹_[_GovernanceConfig_]()_›_

### getConstitution

▸ **getConstitution**\(`proposal`: [Proposal](_wrappers_governance_.md#proposal)\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:200_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L200)

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposal` | [Proposal](_wrappers_governance_.md#proposal) | Proposal to determine the constitution for running. |

**Returns:** _Promise‹BigNumber›_

### getDequeue

▸ **getDequeue**\(`filterZeroes`: boolean\): _Promise‹BigNumber‹›\[\]›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:535_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L535)

Returns the \(existing\) proposal dequeue as list of proposal IDs.

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `filterZeroes` | boolean | false |

**Returns:** _Promise‹BigNumber‹›\[\]›_

### getHotfixRecord

▸ **getHotfixRecord**\(`hash`: Buffer\): _Promise‹_[_HotfixRecord_]()_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:741_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L741)

Returns approved, executed, and prepared status associated with a given hotfix.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `hash` | Buffer | keccak256 hash of hotfix's associated abi encoded transactions |

**Returns:** _Promise‹_[_HotfixRecord_]()_›_

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:255_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L255)

**`dev`** Returns human readable configuration of the governance contract

**Returns:** _Promise‹object›_

GovernanceConfig object

### getHumanReadableProposalMetadata

▸ **getHumanReadableProposalMetadata**\(`proposalID`: BigNumber.Value\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:296_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L296)

Returns the human readable metadata associated with a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹object›_

### getParticipationParameters

▸ **getParticipationParameters**\(\): _Promise‹_[_ParticipationParameters_]()_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:212_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L212)

Returns the participation parameters.

**Returns:** _Promise‹_[_ParticipationParameters_]()_›_

The participation parameters.

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Governance›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Governance› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getProposal

▸ **getProposal**\(`proposalID`: BigNumber.Value\): _Promise‹_[_Proposal_](_wrappers_governance_.md#proposal)_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:383_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L383)

Returns the proposal associated with a given id.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_Proposal_](_wrappers_governance_.md#proposal)_›_

### getProposalRecord

▸ **getProposalRecord**\(`proposalID`: BigNumber.Value\): _Promise‹_[_ProposalRecord_]()_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:393_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L393)

Returns the stage, metadata, upvotes, votes, and transactions associated with a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_ProposalRecord_]()_›_

### getTransactionConstitution

▸ **getTransactionConstitution**\(`tx`: [ProposalTransaction](_wrappers_governance_.md#proposaltransaction)\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:187_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L187)

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal transaction.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [ProposalTransaction](_wrappers_governance_.md#proposaltransaction) | Transaction to determine the constitution for running. |

**Returns:** _Promise‹BigNumber›_

### getVoteRecord

▸ **getVoteRecord**\(`voter`: Address, `proposalID`: BigNumber.Value\): _Promise‹_[_VoteRecord_]() _\| null›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:462_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L462)

Returns the corresponding vote record

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `voter` | Address | Address of voter |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_VoteRecord_]() _\| null›_

### getVoteRecords

▸ **getVoteRecords**\(`voter`: Address\): _Promise‹_[_VoteRecord_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:545_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L545)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `voter` | Address |

**Returns:** _Promise‹_[_VoteRecord_]()_\[\]›_

### getVoteValue

▸ **getVoteValue**\(`proposalID`: BigNumber.Value, `voter`: Address\): _Promise‹_[_VoteValue_]()_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:719_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L719)

Returns `voter`'s vote choice on a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |
| `voter` | Address | Address of voter |

**Returns:** _Promise‹_[_VoteValue_]()_›_

### getVoteWeight

▸ **getVoteWeight**\(`voter`: Address\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:576_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L576)

Returns the number of votes that will be applied to a proposal for a given voter.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `voter` | Address | Address of voter |

**Returns:** _Promise‹BigNumber‹››_

### getVoter

▸ **getVoter**\(`account`: Address\): _Promise‹_[_Voter_]()_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:554_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L554)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** _Promise‹_[_Voter_]()_›_

### humanReadableTimeUntilStages

▸ **humanReadableTimeUntilStages**\(`propoaslID`: BigNumber.Value\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:370_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L370)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `propoaslID` | BigNumber.Value |

**Returns:** _Promise‹object›_

### revokeUpvote

▸ **revokeUpvote**\(`upvoter`: Address\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:679_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L679)

Revokes provided upvoter's upvote.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `upvoter` | Address | Address of upvoter |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### sortedQueue

▸ **sortedQueue**\(`queue`: [UpvoteRecord]()\[\]\): [_UpvoteRecord_]()_\[\]_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:617_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L617)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `queue` | [UpvoteRecord]()\[\] |

**Returns:** [_UpvoteRecord_]()_\[\]_

### stageDurations

▸ **stageDurations**\(\): _Promise‹_[_ProposalStageDurations_]()_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:174_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L174)

Query durations of different stages in proposal lifecycle.

**Returns:** _Promise‹_[_ProposalStageDurations_]()_›_

Durations for approval, referendum and execution stages in seconds.

### timeUntilStages

▸ **timeUntilStages**\(`proposalID`: BigNumber.Value\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:360_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L360)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |

**Returns:** _Promise‹object›_

### upvote

▸ **upvote**\(`proposalID`: BigNumber.Value, `upvoter`: Address\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:663_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L663)

Applies provided upvoter's upvote to given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |
| `upvoter` | Address | Address of upvoter |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### vote

▸ **vote**\(`proposalID`: BigNumber.Value, `vote`: keyof typeof VoteValue\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:705_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L705)

Applies `sender`'s vote choice to a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |
| `vote` | keyof typeof VoteValue | Choice to apply \(yes, no, abstain\) |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

