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

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Governance |

**Returns:** [_GovernanceWrapper_]()

## Properties

### approveHotfix

• **approveHotfix**: _function_ = proxySend\(this.kit, this.contract.methods.approveHotfix, tupleParser\(bufferToHex\)\)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:802_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L802)

Marks the given hotfix approved by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

**`notice`** Only the `approver` address will succeed in sending this transaction

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### concurrentProposals

• **concurrentProposals**: _function_ = proxyCall\( this.contract.methods.concurrentProposals, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:148_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L148)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:162_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L162)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:573_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L573)

Dequeues any queued proposals if `dequeueFrequency` seconds have elapsed since the last dequeue

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

### events

• **events**: _Governance\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### executeHotfix

• **executeHotfix**: _function_ = proxySend\(this.kit, this.contract.methods.executeHotfix, hotfixToParams\)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:816_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L816)

Executes a given sequence of transactions if the corresponding hash is prepared and approved.

**`param`** Governance hotfix proposal

**`param`** Secret which guarantees uniqueness of hash

**`notice`** keccak256 hash of abi encoded transactions computed on-chain

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getApprover

• **getApprover**: _function_ = proxyCall\(this.contract.methods.approver\)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:355_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L355)

Returns the approver address for proposals and hotfixes.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getProposalMetadata

• **getProposalMetadata**: _function_ = proxyCall\( this.contract.methods.getProposal, tupleParser\(valueToString\), \(res\) =&gt; \({ proposer: res\[0\], deposit: valueToBigNumber\(res\[1\]\), timestamp: valueToBigNumber\(res\[2\]\), transactionCount: valueToInt\(res\[3\]\), descriptionURL: res\[4\], }\) \)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:283_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L283)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:357_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L357)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getProposalTransaction

• **getProposalTransaction**: _function_ = proxyCall\( this.contract.methods.getProposalTransaction, tupleParser\(valueToString, valueToString\), \(res\) =&gt; \({ value: res\[0\], to: res\[1\], input: solidityBytesToString\(res\[2\]\), }\) \)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:312_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L312)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:524_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L524)

Returns the proposal queue as list of upvote records.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getRefundedDeposits

• **getRefundedDeposits**: _function_ = proxyCall\( this.contract.methods.refundedDeposits, tupleParser\(stringIdentity\), valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:491_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L491)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:451_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L451)

Returns the current upvoted governance proposal ID and applied vote weight \(zeroes if none\).

**`param`** Address of upvoter

#### Type declaration:

▸ \(`upvoter`: [Address](_base_.md#address)\): _Promise‹_[_UpvoteRecord_]()_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `upvoter` | [Address](_base_.md#address) |

### getUpvotes

• **getUpvotes**: _function_ = proxyCall\( this.contract.methods.getUpvotes, tupleParser\(valueToString\), valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:501_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L501)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getVotes

• **getVotes**: _function_ = proxyCall\( this.contract.methods.getVoteTotals, tupleParser\(valueToString\), \(res\): Votes =&gt; \({ \[VoteValue.Yes\]: valueToBigNumber\(res\[0\]\), \[VoteValue.No\]: valueToBigNumber\(res\[1\]\), \[VoteValue.Abstain\]: valueToBigNumber\(res\[2\]\), }\) \)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:511_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L511)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:782_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L782)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:329_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L329)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:338_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L338)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:767_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L767)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:758_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L758)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:424_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L424)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:485_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L485)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:347_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L347)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:230_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L230)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L157)

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
    methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)

### minDeposit

• **minDeposit**: _function_ = proxyCall\(this.contract.methods.minDeposit, undefined, valueToBigNumber\)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:167_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L167)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:772_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L772)

Returns the number of validators required to reach a Byzantine quorum

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### prepareHotfix

• **prepareHotfix**: _function_ = proxySend\(this.kit, this.contract.methods.prepareHotfix, tupleParser\(bufferToHex\)\)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:808_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L808)

Marks the given hotfix prepared for current epoch if quorum of validators have whitelisted it.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### proposalExists

• **proposalExists**: _function_ = proxyCall\( this.contract.methods.proposalExists, tupleParser\(valueToString\) \)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:442_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L442)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:436_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L436)

Submits a new governance proposal.

**`param`** Governance proposal

**`param`** A URL where further information about the proposal can be viewed

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### queueExpiry

• **queueExpiry**: _function_ = proxyCall\(this.contract.methods.queueExpiry, undefined, valueToBigNumber\)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:172_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L172)

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

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:791_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L791)

Marks the given hotfix whitelisted by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### withdraw

• **withdraw**: _function_ = proxySend\(this.kit, this.contract.methods.withdraw\)

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:429_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L429)

Withdraws refunded proposal deposits.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### approve

▸ **approve**\(`proposalID`: BigNumber.Value\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:695_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L695)

Approves given proposal, allowing it to later move to `referendum`.

**`notice`** Only the `approver` address will succeed in sending this transaction

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### execute

▸ **execute**\(`proposalID`: BigNumber.Value\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:732_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L732)

Executes a given proposal's associated transactions.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### getConfig

▸ **getConfig**\(\): _Promise‹_[_GovernanceConfig_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:235_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L235)

Returns current configuration parameters.

**Returns:** _Promise‹_[_GovernanceConfig_]()_›_

### getConstitution

▸ **getConstitution**\(`proposal`: [Proposal](_wrappers_governance_.md#proposal)\): _Promise‹BigNumber›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:203_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L203)

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposal` | [Proposal](_wrappers_governance_.md#proposal) | Proposal to determine the constitution for running. |

**Returns:** _Promise‹BigNumber›_

### getDequeue

▸ **getDequeue**\(`filterZeroes`: boolean\): _Promise‹BigNumber‹›\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:538_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L538)

Returns the \(existing\) proposal dequeue as list of proposal IDs.

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `filterZeroes` | boolean | false |

**Returns:** _Promise‹BigNumber‹›\[\]›_

### getHotfixRecord

▸ **getHotfixRecord**\(`hash`: Buffer\): _Promise‹_[_HotfixRecord_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:744_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L744)

Returns approved, executed, and prepared status associated with a given hotfix.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `hash` | Buffer | keccak256 hash of hotfix's associated abi encoded transactions |

**Returns:** _Promise‹_[_HotfixRecord_]()_›_

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:258_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L258)

**`dev`** Returns human readable configuration of the governance contract

**Returns:** _Promise‹object›_

GovernanceConfig object

### getHumanReadableProposalMetadata

▸ **getHumanReadableProposalMetadata**\(`proposalID`: BigNumber.Value\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:299_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L299)

Returns the human readable metadata associated with a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹object›_

### getParticipationParameters

▸ **getParticipationParameters**\(\): _Promise‹_[_ParticipationParameters_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:215_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L215)

Returns the participation parameters.

**Returns:** _Promise‹_[_ParticipationParameters_]()_›_

The participation parameters.

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Governance›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Governance› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getProposal

▸ **getProposal**\(`proposalID`: BigNumber.Value\): _Promise‹_[_Proposal_](_wrappers_governance_.md#proposal)_›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:386_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L386)

Returns the proposal associated with a given id.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_Proposal_](_wrappers_governance_.md#proposal)_›_

### getProposalRecord

▸ **getProposalRecord**\(`proposalID`: BigNumber.Value\): _Promise‹_[_ProposalRecord_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:396_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L396)

Returns the stage, metadata, upvotes, votes, and transactions associated with a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_ProposalRecord_]()_›_

### getTransactionConstitution

▸ **getTransactionConstitution**\(`tx`: [ProposalTransaction](_wrappers_governance_.md#proposaltransaction)\): _Promise‹BigNumber›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:190_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L190)

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal transaction.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [ProposalTransaction](_wrappers_governance_.md#proposaltransaction) | Transaction to determine the constitution for running. |

**Returns:** _Promise‹BigNumber›_

### getVoteRecord

▸ **getVoteRecord**\(`voter`: [Address](_base_.md#address), `proposalID`: BigNumber.Value\): _Promise‹_[_VoteRecord_]() _\| null›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:465_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L465)

Returns the corresponding vote record

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `voter` | [Address](_base_.md#address) | Address of voter |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_VoteRecord_]() _\| null›_

### getVoteRecords

▸ **getVoteRecords**\(`voter`: [Address](_base_.md#address)\): _Promise‹_[_VoteRecord_]()_\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:548_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L548)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `voter` | [Address](_base_.md#address) |

**Returns:** _Promise‹_[_VoteRecord_]()_\[\]›_

### getVoteValue

▸ **getVoteValue**\(`proposalID`: BigNumber.Value, `voter`: [Address](_base_.md#address)\): _Promise‹_[_VoteValue_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:722_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L722)

Returns `voter`'s vote choice on a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |
| `voter` | [Address](_base_.md#address) | Address of voter |

**Returns:** _Promise‹_[_VoteValue_]()_›_

### getVoteWeight

▸ **getVoteWeight**\(`voter`: [Address](_base_.md#address)\): _Promise‹BigNumber‹››_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:579_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L579)

Returns the number of votes that will be applied to a proposal for a given voter.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `voter` | [Address](_base_.md#address) | Address of voter |

**Returns:** _Promise‹BigNumber‹››_

### getVoter

▸ **getVoter**\(`account`: [Address](_base_.md#address)\): _Promise‹_[_Voter_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:557_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L557)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](_base_.md#address) |

**Returns:** _Promise‹_[_Voter_]()_›_

### humanReadableTimeUntilStages

▸ **humanReadableTimeUntilStages**\(`propoaslID`: BigNumber.Value\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:373_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L373)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `propoaslID` | BigNumber.Value |

**Returns:** _Promise‹object›_

### revokeUpvote

▸ **revokeUpvote**\(`upvoter`: [Address](_base_.md#address)\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:682_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L682)

Revokes provided upvoter's upvote.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `upvoter` | [Address](_base_.md#address) | Address of upvoter |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### sortedQueue

▸ **sortedQueue**\(`queue`: [UpvoteRecord]()\[\]\): [_UpvoteRecord_]()_\[\]_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:620_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L620)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `queue` | [UpvoteRecord]()\[\] |

**Returns:** [_UpvoteRecord_]()_\[\]_

### stageDurations

▸ **stageDurations**\(\): _Promise‹_[_ProposalStageDurations_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:177_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L177)

Query durations of different stages in proposal lifecycle.

**Returns:** _Promise‹_[_ProposalStageDurations_]()_›_

Durations for approval, referendum and execution stages in seconds.

### timeUntilStages

▸ **timeUntilStages**\(`proposalID`: BigNumber.Value\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:363_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L363)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |

**Returns:** _Promise‹object›_

### upvote

▸ **upvote**\(`proposalID`: BigNumber.Value, `upvoter`: [Address](_base_.md#address)\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:666_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L666)

Applies provided upvoter's upvote to given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |
| `upvoter` | [Address](_base_.md#address) | Address of upvoter |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### vote

▸ **vote**\(`proposalID`: BigNumber.Value, `vote`: keyof typeof VoteValue\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_packages/contractkit/src/wrappers/Governance.ts:708_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L708)

Applies `sender`'s vote choice to a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |
| `vote` | keyof typeof VoteValue | Choice to apply \(yes, no, abstain\) |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

