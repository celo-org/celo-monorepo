# GovernanceWrapper

Contract managing voting for governance proposals.

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Governance›

  ↳ **GovernanceWrapper**

## Index

### Constructors

* [constructor](_wrappers_governance_.governancewrapper.md#constructor)

### Properties

* [approveHotfix](_wrappers_governance_.governancewrapper.md#approvehotfix)
* [concurrentProposals](_wrappers_governance_.governancewrapper.md#concurrentproposals)
* [dequeueFrequency](_wrappers_governance_.governancewrapper.md#dequeuefrequency)
* [dequeueProposalsIfReady](_wrappers_governance_.governancewrapper.md#dequeueproposalsifready)
* [events](_wrappers_governance_.governancewrapper.md#events)
* [executeHotfix](_wrappers_governance_.governancewrapper.md#executehotfix)
* [getApprover](_wrappers_governance_.governancewrapper.md#getapprover)
* [getProposalMetadata](_wrappers_governance_.governancewrapper.md#getproposalmetadata)
* [getProposalStage](_wrappers_governance_.governancewrapper.md#getproposalstage)
* [getProposalTransaction](_wrappers_governance_.governancewrapper.md#getproposaltransaction)
* [getQueue](_wrappers_governance_.governancewrapper.md#getqueue)
* [getRefundedDeposits](_wrappers_governance_.governancewrapper.md#getrefundeddeposits)
* [getUpvoteRecord](_wrappers_governance_.governancewrapper.md#getupvoterecord)
* [getUpvotes](_wrappers_governance_.governancewrapper.md#getupvotes)
* [getVotes](_wrappers_governance_.governancewrapper.md#getvotes)
* [hotfixWhitelistValidatorTally](_wrappers_governance_.governancewrapper.md#hotfixwhitelistvalidatortally)
* [isApproved](_wrappers_governance_.governancewrapper.md#isapproved)
* [isDequeuedProposalExpired](_wrappers_governance_.governancewrapper.md#isdequeuedproposalexpired)
* [isHotfixPassing](_wrappers_governance_.governancewrapper.md#ishotfixpassing)
* [isHotfixWhitelistedBy](_wrappers_governance_.governancewrapper.md#ishotfixwhitelistedby)
* [isProposalPassing](_wrappers_governance_.governancewrapper.md#isproposalpassing)
* [isQueued](_wrappers_governance_.governancewrapper.md#isqueued)
* [isQueuedProposalExpired](_wrappers_governance_.governancewrapper.md#isqueuedproposalexpired)
* [isVoting](_wrappers_governance_.governancewrapper.md#isvoting)
* [lastDequeue](_wrappers_governance_.governancewrapper.md#lastdequeue)
* [minDeposit](_wrappers_governance_.governancewrapper.md#mindeposit)
* [minQuorumSize](_wrappers_governance_.governancewrapper.md#minquorumsize)
* [prepareHotfix](_wrappers_governance_.governancewrapper.md#preparehotfix)
* [proposalExists](_wrappers_governance_.governancewrapper.md#proposalexists)
* [propose](_wrappers_governance_.governancewrapper.md#propose)
* [queueExpiry](_wrappers_governance_.governancewrapper.md#queueexpiry)
* [whitelistHotfix](_wrappers_governance_.governancewrapper.md#whitelisthotfix)
* [withdraw](_wrappers_governance_.governancewrapper.md#withdraw)

### Accessors

* [address](_wrappers_governance_.governancewrapper.md#address)

### Methods

* [approve](_wrappers_governance_.governancewrapper.md#approve)
* [execute](_wrappers_governance_.governancewrapper.md#execute)
* [getConfig](_wrappers_governance_.governancewrapper.md#getconfig)
* [getConstitution](_wrappers_governance_.governancewrapper.md#getconstitution)
* [getDequeue](_wrappers_governance_.governancewrapper.md#getdequeue)
* [getHotfixRecord](_wrappers_governance_.governancewrapper.md#gethotfixrecord)
* [getParticipationParameters](_wrappers_governance_.governancewrapper.md#getparticipationparameters)
* [getProposal](_wrappers_governance_.governancewrapper.md#getproposal)
* [getProposalRecord](_wrappers_governance_.governancewrapper.md#getproposalrecord)
* [getTransactionConstitution](_wrappers_governance_.governancewrapper.md#gettransactionconstitution)
* [getVoteRecord](_wrappers_governance_.governancewrapper.md#getvoterecord)
* [getVoteRecords](_wrappers_governance_.governancewrapper.md#getvoterecords)
* [getVoteValue](_wrappers_governance_.governancewrapper.md#getvotevalue)
* [getVoteWeight](_wrappers_governance_.governancewrapper.md#getvoteweight)
* [getVoter](_wrappers_governance_.governancewrapper.md#getvoter)
* [revokeUpvote](_wrappers_governance_.governancewrapper.md#revokeupvote)
* [sortedQueue](_wrappers_governance_.governancewrapper.md#sortedqueue)
* [stageDurations](_wrappers_governance_.governancewrapper.md#stagedurations)
* [timeUntilStages](_wrappers_governance_.governancewrapper.md#timeuntilstages)
* [upvote](_wrappers_governance_.governancewrapper.md#upvote)
* [vote](_wrappers_governance_.governancewrapper.md#vote)

## Constructors

### constructor

+ **new GovernanceWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Governance\): [_GovernanceWrapper_](_wrappers_governance_.governancewrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | Governance |

**Returns:** [_GovernanceWrapper_](_wrappers_governance_.governancewrapper.md)

## Properties

### approveHotfix

• **approveHotfix**: _function_ = proxySend\( this.kit, this.contract.methods.approveHotfix, tupleParser\(bufferToString\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:749_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L749)

Marks the given hotfix approved by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

**`notice`** Only the `approver` address will succeed in sending this transaction

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### concurrentProposals

• **concurrentProposals**: _function_ = proxyCall\( this.contract.methods.concurrentProposals, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:141_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L141)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:155_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L155)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:520_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L520)

Dequeues any queued proposals if `dequeueFrequency` seconds have elapsed since the last dequeue

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### executeHotfix

• **executeHotfix**: _function_ = proxySend\(this.kit, this.contract.methods.executeHotfix, hotfixToParams\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:771_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L771)

Executes a given sequence of transactions if the corresponding hash is prepared and approved.

**`param`** Governance hotfix proposal

**`param`** Secret which guarantees uniqueness of hash

**`notice`** keccak256 hash of abi encoded transactions computed on-chain

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getApprover

• **getApprover**: _function_ = proxyCall\(this.contract.methods.approver\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:311_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L311)

Returns the approver address for proposals and hotfixes.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getProposalMetadata

• **getProposalMetadata**: _function_ = proxyCall\( this.contract.methods.getProposal, tupleParser\(valueToString\), \(res\) =&gt; \({ proposer: res\[0\], deposit: valueToBigNumber\(res\[1\]\), timestamp: valueToBigNumber\(res\[2\]\), transactionCount: valueToInt\(res\[3\]\), descriptionURL: res\[4\], }\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:251_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L251)

Returns the metadata associated with a given proposal.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(`proposalID`: BigNumber.Value\): _Promise‹_[_ProposalMetadata_](../interfaces/_wrappers_governance_.proposalmetadata.md)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |

### getProposalStage

• **getProposalStage**: _function_ = proxyCall\( this.contract.methods.getProposalStage, tupleParser\(valueToString\), \(res\) =&gt; Object.keys\(ProposalStage\)\[valueToInt\(res\)\] as ProposalStage \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:313_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L313)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getProposalTransaction

• **getProposalTransaction**: _function_ = proxyCall\( this.contract.methods.getProposalTransaction, tupleParser\(valueToString, valueToString\), \(res\) =&gt; \({ value: res\[0\], to: res\[1\], input: bytesToString\(res\[2\]\), }\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:268_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L268)

Returns the transaction at the given index associated with a given proposal.

**`param`** Governance proposal UUID

**`param`** Transaction index

#### Type declaration:

▸ \(`proposalID`: BigNumber.Value, `txIndex`: number\): _Promise‹_[_ProposalTransaction_](../external-modules/_wrappers_governance_.md#proposaltransaction)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |
| `txIndex` | number |

### getQueue

• **getQueue**: _function_ = proxyCall\(this.contract.methods.getQueue, undefined, \(arraysObject\) =&gt; zip\( \(\_id, \_upvotes\) =&gt; \({ proposalID: valueToBigNumber\(\_id\), upvotes: valueToBigNumber\(\_upvotes\), }\), arraysObject\[0\], arraysObject\[1\] \) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:471_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L471)

Returns the proposal queue as list of upvote records.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getRefundedDeposits

• **getRefundedDeposits**: _function_ = proxyCall\( this.contract.methods.refundedDeposits, tupleParser\(stringIdentity\), valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:438_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L438)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:398_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L398)

Returns the current upvoted governance proposal ID and applied vote weight \(zeroes if none\).

**`param`** Address of upvoter

#### Type declaration:

▸ \(`upvoter`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_UpvoteRecord_](../interfaces/_wrappers_governance_.upvoterecord.md)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `upvoter` | [Address](../external-modules/_base_.md#address) |

### getUpvotes

• **getUpvotes**: _function_ = proxyCall\( this.contract.methods.getUpvotes, tupleParser\(valueToString\), valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:448_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L448)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getVotes

• **getVotes**: _function_ = proxyCall\( this.contract.methods.getVoteTotals, tupleParser\(valueToString\), \(res\): Votes =&gt; \({ \[VoteValue.Yes\]: valueToBigNumber\(res\[0\]\), \[VoteValue.No\]: valueToBigNumber\(res\[1\]\), \[VoteValue.Abstain\]: valueToBigNumber\(res\[2\]\), }\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:458_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L458)

Returns the yes, no, and abstain votes applied to a given proposal.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### hotfixWhitelistValidatorTally

• **hotfixWhitelistValidatorTally**: _function_ = proxyCall\( this.contract.methods.hotfixWhitelistValidatorTally, tupleParser\(bufferToString\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:729_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L729)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:285_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L285)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:294_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L294)

Returns whether a dequeued proposal is expired.

**`param`** Governance proposal UUID

#### Type declaration:

▸ \(`proposalID`: BigNumber.Value\): _Promise‹boolean›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |

### isHotfixPassing

• **isHotfixPassing**: _function_ = proxyCall\(this.contract.methods.isHotfixPassing, tupleParser\(bufferToString\)\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:714_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L714)

Returns whether a given hotfix can be passed.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### isHotfixWhitelistedBy

• **isHotfixWhitelistedBy**: _function_ = proxyCall\( this.contract.methods.isHotfixWhitelistedBy, tupleParser\(bufferToString, \(s: Address\) =&gt; identity\(s\)\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:705_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L705)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:371_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L371)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:432_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L432)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:303_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L303)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:223_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L223)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:150_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L150)

Query proposal dequeue frequency.

**`returns`** Current proposal dequeue frequency in seconds.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### minDeposit

• **minDeposit**: _function_ = proxyCall\(this.contract.methods.minDeposit, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:160_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L160)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:719_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L719)

Returns the number of validators required to reach a Byzantine quorum

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### prepareHotfix

• **prepareHotfix**: _function_ = proxySend\( this.kit, this.contract.methods.prepareHotfix, tupleParser\(bufferToString\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:759_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L759)

Marks the given hotfix prepared for current epoch if quorum of validators have whitelisted it.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### proposalExists

• **proposalExists**: _function_ = proxyCall\( this.contract.methods.proposalExists, tupleParser\(valueToString\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:389_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L389)

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

_Defined in_ [_contractkit/src/wrappers/Governance.ts:383_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L383)

Submits a new governance proposal.

**`param`** Governance proposal

**`param`** A URL where further information about the proposal can be viewed

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### queueExpiry

• **queueExpiry**: _function_ = proxyCall\(this.contract.methods.queueExpiry, undefined, valueToBigNumber\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:165_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L165)

Query queue expiry parameter.

**`returns`** The number of seconds a proposal can stay in the queue before expiring.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### whitelistHotfix

• **whitelistHotfix**: _function_ = proxySend\( this.kit, this.contract.methods.whitelistHotfix, tupleParser\(bufferToString\) \)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:738_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L738)

Marks the given hotfix whitelisted by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### withdraw

• **withdraw**: _function_ = proxySend\(this.kit, this.contract.methods.withdraw\)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:376_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L376)

Withdraws refunded proposal deposits.

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### approve

▸ **approve**\(`proposalID`: BigNumber.Value\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:642_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L642)

Approves given proposal, allowing it to later move to `referendum`.

**`notice`** Only the `approver` address will succeed in sending this transaction

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

### execute

▸ **execute**\(`proposalID`: BigNumber.Value\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:679_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L679)

Executes a given proposal's associated transactions.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

### getConfig

▸ **getConfig**\(\): _Promise‹_[_GovernanceConfig_](../interfaces/_wrappers_governance_.governanceconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:228_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L228)

Returns current configuration parameters.

**Returns:** _Promise‹_[_GovernanceConfig_](../interfaces/_wrappers_governance_.governanceconfig.md)_›_

### getConstitution

▸ **getConstitution**\(`proposal`: [Proposal](../external-modules/_wrappers_governance_.md#proposal)\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:196_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L196)

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposal` | [Proposal](../external-modules/_wrappers_governance_.md#proposal) | Proposal to determine the constitution for running. |

**Returns:** _Promise‹BigNumber›_

### getDequeue

▸ **getDequeue**\(`filterZeroes`: boolean\): _Promise‹BigNumber‹›\[\]›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:485_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L485)

Returns the \(existing\) proposal dequeue as list of proposal IDs.

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `filterZeroes` | boolean | false |

**Returns:** _Promise‹BigNumber‹›\[\]›_

### getHotfixRecord

▸ **getHotfixRecord**\(`hash`: Buffer\): _Promise‹_[_HotfixRecord_](../interfaces/_wrappers_governance_.hotfixrecord.md)_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:691_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L691)

Returns approved, executed, and prepared status associated with a given hotfix.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `hash` | Buffer | keccak256 hash of hotfix's associated abi encoded transactions |

**Returns:** _Promise‹_[_HotfixRecord_](../interfaces/_wrappers_governance_.hotfixrecord.md)_›_

### getParticipationParameters

▸ **getParticipationParameters**\(\): _Promise‹_[_ParticipationParameters_](../interfaces/_wrappers_governance_.participationparameters.md)_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:208_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L208)

Returns the participation parameters.

**Returns:** _Promise‹_[_ParticipationParameters_](../interfaces/_wrappers_governance_.participationparameters.md)_›_

The participation parameters.

### getProposal

▸ **getProposal**\(`proposalID`: BigNumber.Value\): _Promise‹_[_Proposal_](../external-modules/_wrappers_governance_.md#proposal)_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:333_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L333)

Returns the proposal associated with a given id.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_Proposal_](../external-modules/_wrappers_governance_.md#proposal)_›_

### getProposalRecord

▸ **getProposalRecord**\(`proposalID`: BigNumber.Value\): _Promise‹_[_ProposalRecord_](../interfaces/_wrappers_governance_.proposalrecord.md)_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:343_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L343)

Returns the stage, metadata, upvotes, votes, and transactions associated with a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_ProposalRecord_](../interfaces/_wrappers_governance_.proposalrecord.md)_›_

### getTransactionConstitution

▸ **getTransactionConstitution**\(`tx`: [ProposalTransaction](../external-modules/_wrappers_governance_.md#proposaltransaction)\): _Promise‹BigNumber›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:183_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L183)

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal transaction.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [ProposalTransaction](../external-modules/_wrappers_governance_.md#proposaltransaction) | Transaction to determine the constitution for running. |

**Returns:** _Promise‹BigNumber›_

### getVoteRecord

▸ **getVoteRecord**\(`voter`: [Address](../external-modules/_base_.md#address), `proposalID`: BigNumber.Value\): _Promise‹_[_VoteRecord_](../interfaces/_wrappers_governance_.voterecord.md) _\| null›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:412_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L412)

Returns the corresponding vote record

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `voter` | [Address](../external-modules/_base_.md#address) | Address of voter |
| `proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** _Promise‹_[_VoteRecord_](../interfaces/_wrappers_governance_.voterecord.md) _\| null›_

### getVoteRecords

▸ **getVoteRecords**\(`voter`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_VoteRecord_](../interfaces/_wrappers_governance_.voterecord.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:495_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L495)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `voter` | [Address](../external-modules/_base_.md#address) |

**Returns:** _Promise‹_[_VoteRecord_](../interfaces/_wrappers_governance_.voterecord.md)_\[\]›_

### getVoteValue

▸ **getVoteValue**\(`proposalID`: BigNumber.Value, `voter`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_VoteValue_](../enums/_wrappers_governance_.votevalue.md)_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:669_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L669)

Returns `voter`'s vote choice on a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |
| `voter` | [Address](../external-modules/_base_.md#address) | Address of voter |

**Returns:** _Promise‹_[_VoteValue_](../enums/_wrappers_governance_.votevalue.md)_›_

### getVoteWeight

▸ **getVoteWeight**\(`voter`: [Address](../external-modules/_base_.md#address)\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:526_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L526)

Returns the number of votes that will be applied to a proposal for a given voter.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `voter` | [Address](../external-modules/_base_.md#address) | Address of voter |

**Returns:** _Promise‹BigNumber‹››_

### getVoter

▸ **getVoter**\(`account`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_Voter_](../interfaces/_wrappers_governance_.voter.md)_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:504_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L504)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | [Address](../external-modules/_base_.md#address) |

**Returns:** _Promise‹_[_Voter_](../interfaces/_wrappers_governance_.voter.md)_›_

### revokeUpvote

▸ **revokeUpvote**\(`upvoter`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:629_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L629)

Revokes provided upvoter's upvote.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `upvoter` | [Address](../external-modules/_base_.md#address) | Address of upvoter |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

### sortedQueue

▸ **sortedQueue**\(`queue`: [UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)\[\]\): [_UpvoteRecord_](../interfaces/_wrappers_governance_.upvoterecord.md)_\[\]_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:567_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L567)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `queue` | [UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)\[\] |

**Returns:** [_UpvoteRecord_](../interfaces/_wrappers_governance_.upvoterecord.md)_\[\]_

### stageDurations

▸ **stageDurations**\(\): _Promise‹_[_ProposalStageDurations_](../interfaces/_wrappers_governance_.proposalstagedurations.md)_›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:170_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L170)

Query durations of different stages in proposal lifecycle.

**Returns:** _Promise‹_[_ProposalStageDurations_](../interfaces/_wrappers_governance_.proposalstagedurations.md)_›_

Durations for approval, referendum and execution stages in seconds.

### timeUntilStages

▸ **timeUntilStages**\(`proposalID`: BigNumber.Value\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:319_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L319)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposalID` | BigNumber.Value |

**Returns:** _Promise‹object›_

### upvote

▸ **upvote**\(`proposalID`: BigNumber.Value, `upvoter`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:613_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L613)

Applies provided upvoter's upvote to given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |
| `upvoter` | [Address](../external-modules/_base_.md#address) | Address of upvoter |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

### vote

▸ **vote**\(`proposalID`: BigNumber.Value, `vote`: keyof typeof VoteValue\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:655_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L655)

Applies `sender`'s vote choice to a given proposal.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `proposalID` | BigNumber.Value | Governance proposal UUID |
| `vote` | keyof typeof VoteValue | Choice to apply \(yes, no, abstain\) |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

