# Class: GovernanceWrapper

Contract managing voting for governance proposals.

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹Governance›

  ↳ **GovernanceWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_governance_.governancewrapper.md#constructor)

### Properties

* [approveHotfix](_contractkit_src_wrappers_governance_.governancewrapper.md#approvehotfix)
* [concurrentProposals](_contractkit_src_wrappers_governance_.governancewrapper.md#concurrentproposals)
* [dequeueFrequency](_contractkit_src_wrappers_governance_.governancewrapper.md#dequeuefrequency)
* [dequeueProposalsIfReady](_contractkit_src_wrappers_governance_.governancewrapper.md#dequeueproposalsifready)
* [events](_contractkit_src_wrappers_governance_.governancewrapper.md#events)
* [executeHotfix](_contractkit_src_wrappers_governance_.governancewrapper.md#executehotfix)
* [getApprover](_contractkit_src_wrappers_governance_.governancewrapper.md#getapprover)
* [getProposalMetadata](_contractkit_src_wrappers_governance_.governancewrapper.md#getproposalmetadata)
* [getProposalStage](_contractkit_src_wrappers_governance_.governancewrapper.md#getproposalstage)
* [getProposalTransaction](_contractkit_src_wrappers_governance_.governancewrapper.md#getproposaltransaction)
* [getQueue](_contractkit_src_wrappers_governance_.governancewrapper.md#getqueue)
* [getRefundedDeposits](_contractkit_src_wrappers_governance_.governancewrapper.md#getrefundeddeposits)
* [getUpvoteRecord](_contractkit_src_wrappers_governance_.governancewrapper.md#getupvoterecord)
* [getUpvotes](_contractkit_src_wrappers_governance_.governancewrapper.md#getupvotes)
* [getVotes](_contractkit_src_wrappers_governance_.governancewrapper.md#getvotes)
* [hotfixWhitelistValidatorTally](_contractkit_src_wrappers_governance_.governancewrapper.md#hotfixwhitelistvalidatortally)
* [isApproved](_contractkit_src_wrappers_governance_.governancewrapper.md#isapproved)
* [isDequeuedProposalExpired](_contractkit_src_wrappers_governance_.governancewrapper.md#isdequeuedproposalexpired)
* [isHotfixPassing](_contractkit_src_wrappers_governance_.governancewrapper.md#ishotfixpassing)
* [isHotfixWhitelistedBy](_contractkit_src_wrappers_governance_.governancewrapper.md#ishotfixwhitelistedby)
* [isProposalPassing](_contractkit_src_wrappers_governance_.governancewrapper.md#isproposalpassing)
* [isQueued](_contractkit_src_wrappers_governance_.governancewrapper.md#isqueued)
* [isQueuedProposalExpired](_contractkit_src_wrappers_governance_.governancewrapper.md#isqueuedproposalexpired)
* [isVoting](_contractkit_src_wrappers_governance_.governancewrapper.md#isvoting)
* [lastDequeue](_contractkit_src_wrappers_governance_.governancewrapper.md#lastdequeue)
* [minDeposit](_contractkit_src_wrappers_governance_.governancewrapper.md#mindeposit)
* [minQuorumSize](_contractkit_src_wrappers_governance_.governancewrapper.md#minquorumsize)
* [prepareHotfix](_contractkit_src_wrappers_governance_.governancewrapper.md#preparehotfix)
* [proposalExists](_contractkit_src_wrappers_governance_.governancewrapper.md#proposalexists)
* [propose](_contractkit_src_wrappers_governance_.governancewrapper.md#propose)
* [queueExpiry](_contractkit_src_wrappers_governance_.governancewrapper.md#queueexpiry)
* [whitelistHotfix](_contractkit_src_wrappers_governance_.governancewrapper.md#whitelisthotfix)
* [withdraw](_contractkit_src_wrappers_governance_.governancewrapper.md#withdraw)

### Accessors

* [address](_contractkit_src_wrappers_governance_.governancewrapper.md#address)

### Methods

* [approve](_contractkit_src_wrappers_governance_.governancewrapper.md#approve)
* [execute](_contractkit_src_wrappers_governance_.governancewrapper.md#execute)
* [getConfig](_contractkit_src_wrappers_governance_.governancewrapper.md#getconfig)
* [getConstitution](_contractkit_src_wrappers_governance_.governancewrapper.md#getconstitution)
* [getDequeue](_contractkit_src_wrappers_governance_.governancewrapper.md#getdequeue)
* [getHotfixRecord](_contractkit_src_wrappers_governance_.governancewrapper.md#gethotfixrecord)
* [getParticipationParameters](_contractkit_src_wrappers_governance_.governancewrapper.md#getparticipationparameters)
* [getPastEvents](_contractkit_src_wrappers_governance_.governancewrapper.md#getpastevents)
* [getProposal](_contractkit_src_wrappers_governance_.governancewrapper.md#getproposal)
* [getProposalRecord](_contractkit_src_wrappers_governance_.governancewrapper.md#getproposalrecord)
* [getTransactionConstitution](_contractkit_src_wrappers_governance_.governancewrapper.md#gettransactionconstitution)
* [getVoteRecord](_contractkit_src_wrappers_governance_.governancewrapper.md#getvoterecord)
* [getVoteRecords](_contractkit_src_wrappers_governance_.governancewrapper.md#getvoterecords)
* [getVoteValue](_contractkit_src_wrappers_governance_.governancewrapper.md#getvotevalue)
* [getVoteWeight](_contractkit_src_wrappers_governance_.governancewrapper.md#getvoteweight)
* [getVoter](_contractkit_src_wrappers_governance_.governancewrapper.md#getvoter)
* [revokeUpvote](_contractkit_src_wrappers_governance_.governancewrapper.md#revokeupvote)
* [sortedQueue](_contractkit_src_wrappers_governance_.governancewrapper.md#sortedqueue)
* [stageDurations](_contractkit_src_wrappers_governance_.governancewrapper.md#stagedurations)
* [timeUntilStages](_contractkit_src_wrappers_governance_.governancewrapper.md#timeuntilstages)
* [upvote](_contractkit_src_wrappers_governance_.governancewrapper.md#upvote)
* [vote](_contractkit_src_wrappers_governance_.governancewrapper.md#vote)

## Constructors

###  constructor

\+ **new GovernanceWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: Governance): *[GovernanceWrapper](_contractkit_src_wrappers_governance_.governancewrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | Governance |

**Returns:** *[GovernanceWrapper](_contractkit_src_wrappers_governance_.governancewrapper.md)*

## Properties

###  approveHotfix

• **approveHotfix**: *function* = proxySend(this.kit, this.contract.methods.approveHotfix, tupleParser(bufferToHex))

*Defined in [contractkit/src/wrappers/Governance.ts:754](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L754)*

Marks the given hotfix approved by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

**`notice`** Only the `approver` address will succeed in sending this transaction

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  concurrentProposals

• **concurrentProposals**: *function* = proxyCall(
    this.contract.methods.concurrentProposals,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Governance.ts:146](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L146)*

Querying number of possible concurrent proposals.

**`returns`** Current number of possible concurrent proposals.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  dequeueFrequency

• **dequeueFrequency**: *function* = proxyCall(this.contract.methods.dequeueFrequency, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Governance.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L160)*

Query proposal dequeue frequency.

**`returns`** Current proposal dequeue frequency in seconds.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  dequeueProposalsIfReady

• **dequeueProposalsIfReady**: *function* = proxySend(this.kit, this.contract.methods.dequeueProposalsIfReady)

*Defined in [contractkit/src/wrappers/Governance.ts:525](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L525)*

Dequeues any queued proposals if `dequeueFrequency` seconds have elapsed since the last dequeue

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

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

###  executeHotfix

• **executeHotfix**: *function* = proxySend(this.kit, this.contract.methods.executeHotfix, hotfixToParams)

*Defined in [contractkit/src/wrappers/Governance.ts:768](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L768)*

Executes a given sequence of transactions if the corresponding hash is prepared and approved.

**`param`** Governance hotfix proposal

**`param`** Secret which guarantees uniqueness of hash

**`notice`** keccak256 hash of abi encoded transactions computed on-chain

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getApprover

• **getApprover**: *function* = proxyCall(this.contract.methods.approver)

*Defined in [contractkit/src/wrappers/Governance.ts:316](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L316)*

Returns the approver address for proposals and hotfixes.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getProposalMetadata

• **getProposalMetadata**: *function* = proxyCall(
    this.contract.methods.getProposal,
    tupleParser(valueToString),
    (res) => ({
      proposer: res[0],
      deposit: valueToBigNumber(res[1]),
      timestamp: valueToBigNumber(res[2]),
      transactionCount: valueToInt(res[3]),
      descriptionURL: res[4],
    })
  )

*Defined in [contractkit/src/wrappers/Governance.ts:256](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L256)*

Returns the metadata associated with a given proposal.

**`param`** Governance proposal UUID

#### Type declaration:

▸ (`proposalID`: BigNumber.Value): *Promise‹[ProposalMetadata](../interfaces/_contractkit_src_wrappers_governance_.proposalmetadata.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

___

###  getProposalStage

• **getProposalStage**: *function* = proxyCall(
    this.contract.methods.getProposalStage,
    tupleParser(valueToString),
    (res) => Object.keys(ProposalStage)[valueToInt(res)] as ProposalStage
  )

*Defined in [contractkit/src/wrappers/Governance.ts:318](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L318)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getProposalTransaction

• **getProposalTransaction**: *function* = proxyCall(
    this.contract.methods.getProposalTransaction,
    tupleParser(valueToString, valueToString),
    (res) => ({
      value: res[0],
      to: res[1],
      input: solidityBytesToString(res[2]),
    })
  )

*Defined in [contractkit/src/wrappers/Governance.ts:273](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L273)*

Returns the transaction at the given index associated with a given proposal.

**`param`** Governance proposal UUID

**`param`** Transaction index

#### Type declaration:

▸ (`proposalID`: BigNumber.Value, `txIndex`: number): *Promise‹[ProposalTransaction](../modules/_contractkit_src_wrappers_governance_.md#proposaltransaction)›*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |
`txIndex` | number |

___

###  getQueue

• **getQueue**: *function* = proxyCall(this.contract.methods.getQueue, undefined, (arraysObject) =>
    zip<string, string, UpvoteRecord>(
      (_id, _upvotes) => ({
        proposalID: valueToBigNumber(_id),
        upvotes: valueToBigNumber(_upvotes),
      }),
      arraysObject[0],
      arraysObject[1]
    )
  )

*Defined in [contractkit/src/wrappers/Governance.ts:476](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L476)*

Returns the proposal queue as list of upvote records.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getRefundedDeposits

• **getRefundedDeposits**: *function* = proxyCall(
    this.contract.methods.refundedDeposits,
    tupleParser(stringIdentity),
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Governance.ts:443](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L443)*

Returns the value of proposal deposits that have been refunded.

**`param`** Governance proposer address.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getUpvoteRecord

• **getUpvoteRecord**: *function* = proxyCall(
    this.contract.methods.getUpvoteRecord,
    tupleParser(identity),
    (o) => ({
      proposalID: valueToBigNumber(o[0]),
      upvotes: valueToBigNumber(o[1]),
    })
  )

*Defined in [contractkit/src/wrappers/Governance.ts:403](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L403)*

Returns the current upvoted governance proposal ID and applied vote weight (zeroes if none).

**`param`** Address of upvoter

#### Type declaration:

▸ (`upvoter`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[UpvoteRecord](../interfaces/_contractkit_src_wrappers_governance_.upvoterecord.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`upvoter` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  getUpvotes

• **getUpvotes**: *function* = proxyCall(
    this.contract.methods.getUpvotes,
    tupleParser(valueToString),
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Governance.ts:453](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L453)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getVotes

• **getVotes**: *function* = proxyCall(
    this.contract.methods.getVoteTotals,
    tupleParser(valueToString),
    (res): Votes => ({
      [VoteValue.Yes]: valueToBigNumber(res[0]),
      [VoteValue.No]: valueToBigNumber(res[1]),
      [VoteValue.Abstain]: valueToBigNumber(res[2]),
    })
  )

*Defined in [contractkit/src/wrappers/Governance.ts:463](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L463)*

Returns the yes, no, and abstain votes applied to a given proposal.

**`param`** Governance proposal UUID

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  hotfixWhitelistValidatorTally

• **hotfixWhitelistValidatorTally**: *function* = proxyCall(
    this.contract.methods.hotfixWhitelistValidatorTally,
    tupleParser(bufferToHex)
  )

*Defined in [contractkit/src/wrappers/Governance.ts:734](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L734)*

Returns the number of validators that whitelisted the hotfix

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isApproved

• **isApproved**: *function* = proxyCall(
    this.contract.methods.isApproved,
    tupleParser(valueToString)
  )

*Defined in [contractkit/src/wrappers/Governance.ts:290](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L290)*

Returns whether a given proposal is approved.

**`param`** Governance proposal UUID

#### Type declaration:

▸ (`proposalID`: BigNumber.Value): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

___

###  isDequeuedProposalExpired

• **isDequeuedProposalExpired**: *function* = proxyCall(
    this.contract.methods.isDequeuedProposalExpired,
    tupleParser(valueToString)
  )

*Defined in [contractkit/src/wrappers/Governance.ts:299](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L299)*

Returns whether a dequeued proposal is expired.

**`param`** Governance proposal UUID

#### Type declaration:

▸ (`proposalID`: BigNumber.Value): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

___

###  isHotfixPassing

• **isHotfixPassing**: *function* = proxyCall(this.contract.methods.isHotfixPassing, tupleParser(bufferToHex))

*Defined in [contractkit/src/wrappers/Governance.ts:719](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L719)*

Returns whether a given hotfix can be passed.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isHotfixWhitelistedBy

• **isHotfixWhitelistedBy**: *function* = proxyCall(
    this.contract.methods.isHotfixWhitelistedBy,
    tupleParser(bufferToHex, (s: Address) => identity<Address>(s))
  )

*Defined in [contractkit/src/wrappers/Governance.ts:710](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L710)*

Returns whether a given hotfix has been whitelisted by a given address.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

**`param`** address of whitelister

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isProposalPassing

• **isProposalPassing**: *function* = proxyCall(this.contract.methods.isProposalPassing, tupleParser(valueToString))

*Defined in [contractkit/src/wrappers/Governance.ts:376](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L376)*

Returns whether a given proposal is passing relative to the constitution's threshold.

**`param`** Governance proposal UUID

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isQueued

• **isQueued**: *function* = proxyCall(this.contract.methods.isQueued, tupleParser(valueToString))

*Defined in [contractkit/src/wrappers/Governance.ts:437](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L437)*

Returns whether a given proposal is queued.

**`param`** Governance proposal UUID

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isQueuedProposalExpired

• **isQueuedProposalExpired**: *function* = proxyCall(
    this.contract.methods.isQueuedProposalExpired,
    tupleParser(valueToString)
  )

*Defined in [contractkit/src/wrappers/Governance.ts:308](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L308)*

Returns whether a dequeued proposal is expired.

**`param`** Governance proposal UUID

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  isVoting

• **isVoting**: *function* = proxyCall(this.contract.methods.isVoting)

*Defined in [contractkit/src/wrappers/Governance.ts:228](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L228)*

Returns whether or not a particular account is voting on proposals.

**`param`** The address of the account.

**`returns`** Whether or not the account is voting on proposals.

#### Type declaration:

▸ (`account`: string): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |

___

###  lastDequeue

• **lastDequeue**: *function* = proxyCall(this.contract.methods.lastDequeue, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Governance.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L155)*

Query proposal dequeue frequency.

**`returns`** Current proposal dequeue frequency in seconds.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  minDeposit

• **minDeposit**: *function* = proxyCall(this.contract.methods.minDeposit, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Governance.ts:165](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L165)*

Query minimum deposit required to make a proposal.

**`returns`** Current minimum deposit.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  minQuorumSize

• **minQuorumSize**: *function* = proxyCall(
    this.contract.methods.minQuorumSizeInCurrentSet,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Governance.ts:724](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L724)*

Returns the number of validators required to reach a Byzantine quorum

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  prepareHotfix

• **prepareHotfix**: *function* = proxySend(this.kit, this.contract.methods.prepareHotfix, tupleParser(bufferToHex))

*Defined in [contractkit/src/wrappers/Governance.ts:760](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L760)*

Marks the given hotfix prepared for current epoch if quorum of validators have whitelisted it.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  proposalExists

• **proposalExists**: *function* = proxyCall(
    this.contract.methods.proposalExists,
    tupleParser(valueToString)
  )

*Defined in [contractkit/src/wrappers/Governance.ts:394](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L394)*

Returns whether a governance proposal exists with the given ID.

**`param`** Governance proposal UUID

#### Type declaration:

▸ (`proposalID`: BigNumber.Value): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

___

###  propose

• **propose**: *function* = proxySend(this.kit, this.contract.methods.propose, proposalToParams)

*Defined in [contractkit/src/wrappers/Governance.ts:388](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L388)*

Submits a new governance proposal.

**`param`** Governance proposal

**`param`** A URL where further information about the proposal can be viewed

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  queueExpiry

• **queueExpiry**: *function* = proxyCall(this.contract.methods.queueExpiry, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Governance.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L170)*

Query queue expiry parameter.

**`returns`** The number of seconds a proposal can stay in the queue before expiring.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  whitelistHotfix

• **whitelistHotfix**: *function* = proxySend(
    this.kit,
    this.contract.methods.whitelistHotfix,
    tupleParser(bufferToHex)
  )

*Defined in [contractkit/src/wrappers/Governance.ts:743](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L743)*

Marks the given hotfix whitelisted by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  withdraw

• **withdraw**: *function* = proxySend(this.kit, this.contract.methods.withdraw)

*Defined in [contractkit/src/wrappers/Governance.ts:381](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L381)*

Withdraws refunded proposal deposits.

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  approve

▸ **approve**(`proposalID`: BigNumber.Value): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Governance.ts:647](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L647)*

Approves given proposal, allowing it to later move to `referendum`.

**`notice`** Only the `approver` address will succeed in sending this transaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  execute

▸ **execute**(`proposalID`: BigNumber.Value): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Governance.ts:684](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L684)*

Executes a given proposal's associated transactions.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  getConfig

▸ **getConfig**(): *Promise‹[GovernanceConfig](../interfaces/_contractkit_src_wrappers_governance_.governanceconfig.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:233](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L233)*

Returns current configuration parameters.

**Returns:** *Promise‹[GovernanceConfig](../interfaces/_contractkit_src_wrappers_governance_.governanceconfig.md)›*

___

###  getConstitution

▸ **getConstitution**(`proposal`: [Proposal](../modules/_contractkit_src_wrappers_governance_.md#proposal)): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/Governance.ts:201](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L201)*

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposal` | [Proposal](../modules/_contractkit_src_wrappers_governance_.md#proposal) | Proposal to determine the constitution for running.  |

**Returns:** *Promise‹BigNumber›*

___

###  getDequeue

▸ **getDequeue**(`filterZeroes`: boolean): *Promise‹BigNumber‹›[]›*

*Defined in [contractkit/src/wrappers/Governance.ts:490](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L490)*

Returns the (existing) proposal dequeue as list of proposal IDs.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`filterZeroes` | boolean | false |

**Returns:** *Promise‹BigNumber‹›[]›*

___

###  getHotfixRecord

▸ **getHotfixRecord**(`hash`: Buffer): *Promise‹[HotfixRecord](../interfaces/_contractkit_src_wrappers_governance_.hotfixrecord.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:696](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L696)*

Returns approved, executed, and prepared status associated with a given hotfix.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`hash` | Buffer | keccak256 hash of hotfix's associated abi encoded transactions  |

**Returns:** *Promise‹[HotfixRecord](../interfaces/_contractkit_src_wrappers_governance_.hotfixrecord.md)›*

___

###  getParticipationParameters

▸ **getParticipationParameters**(): *Promise‹[ParticipationParameters](../interfaces/_contractkit_src_wrappers_governance_.participationparameters.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:213](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L213)*

Returns the participation parameters.

**Returns:** *Promise‹[ParticipationParameters](../interfaces/_contractkit_src_wrappers_governance_.participationparameters.md)›*

The participation parameters.

___

###  getPastEvents

▸ **getPastEvents**(`event`: string, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_contractkit_src_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L29)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getProposal

▸ **getProposal**(`proposalID`: BigNumber.Value): *Promise‹[Proposal](../modules/_contractkit_src_wrappers_governance_.md#proposal)›*

*Defined in [contractkit/src/wrappers/Governance.ts:338](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L338)*

Returns the proposal associated with a given id.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹[Proposal](../modules/_contractkit_src_wrappers_governance_.md#proposal)›*

___

###  getProposalRecord

▸ **getProposalRecord**(`proposalID`: BigNumber.Value): *Promise‹[ProposalRecord](../interfaces/_contractkit_src_wrappers_governance_.proposalrecord.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:348](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L348)*

Returns the stage, metadata, upvotes, votes, and transactions associated with a given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹[ProposalRecord](../interfaces/_contractkit_src_wrappers_governance_.proposalrecord.md)›*

___

###  getTransactionConstitution

▸ **getTransactionConstitution**(`tx`: [ProposalTransaction](../modules/_contractkit_src_wrappers_governance_.md#proposaltransaction)): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/Governance.ts:188](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L188)*

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [ProposalTransaction](../modules/_contractkit_src_wrappers_governance_.md#proposaltransaction) | Transaction to determine the constitution for running.  |

**Returns:** *Promise‹BigNumber›*

___

###  getVoteRecord

▸ **getVoteRecord**(`voter`: [Address](../modules/_contractkit_src_base_.md#address), `proposalID`: BigNumber.Value): *Promise‹[VoteRecord](../interfaces/_contractkit_src_wrappers_governance_.voterecord.md) | null›*

*Defined in [contractkit/src/wrappers/Governance.ts:417](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L417)*

Returns the corresponding vote record

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`voter` | [Address](../modules/_contractkit_src_base_.md#address) | Address of voter |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹[VoteRecord](../interfaces/_contractkit_src_wrappers_governance_.voterecord.md) | null›*

___

###  getVoteRecords

▸ **getVoteRecords**(`voter`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[VoteRecord](../interfaces/_contractkit_src_wrappers_governance_.voterecord.md)[]›*

*Defined in [contractkit/src/wrappers/Governance.ts:500](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L500)*

**Parameters:**

Name | Type |
------ | ------ |
`voter` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹[VoteRecord](../interfaces/_contractkit_src_wrappers_governance_.voterecord.md)[]›*

___

###  getVoteValue

▸ **getVoteValue**(`proposalID`: BigNumber.Value, `voter`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[VoteValue](../enums/_contractkit_src_wrappers_governance_.votevalue.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:674](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L674)*

Returns `voter`'s vote choice on a given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |
`voter` | [Address](../modules/_contractkit_src_base_.md#address) | Address of voter  |

**Returns:** *Promise‹[VoteValue](../enums/_contractkit_src_wrappers_governance_.votevalue.md)›*

___

###  getVoteWeight

▸ **getVoteWeight**(`voter`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Governance.ts:531](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L531)*

Returns the number of votes that will be applied to a proposal for a given voter.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`voter` | [Address](../modules/_contractkit_src_base_.md#address) | Address of voter  |

**Returns:** *Promise‹BigNumber‹››*

___

###  getVoter

▸ **getVoter**(`account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[Voter](../interfaces/_contractkit_src_wrappers_governance_.voter.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:509](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L509)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹[Voter](../interfaces/_contractkit_src_wrappers_governance_.voter.md)›*

___

###  revokeUpvote

▸ **revokeUpvote**(`upvoter`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Governance.ts:634](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L634)*

Revokes provided upvoter's upvote.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`upvoter` | [Address](../modules/_contractkit_src_base_.md#address) | Address of upvoter  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  sortedQueue

▸ **sortedQueue**(`queue`: [UpvoteRecord](../interfaces/_contractkit_src_wrappers_governance_.upvoterecord.md)[]): *[UpvoteRecord](../interfaces/_contractkit_src_wrappers_governance_.upvoterecord.md)[]*

*Defined in [contractkit/src/wrappers/Governance.ts:572](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L572)*

**Parameters:**

Name | Type |
------ | ------ |
`queue` | [UpvoteRecord](../interfaces/_contractkit_src_wrappers_governance_.upvoterecord.md)[] |

**Returns:** *[UpvoteRecord](../interfaces/_contractkit_src_wrappers_governance_.upvoterecord.md)[]*

___

###  stageDurations

▸ **stageDurations**(): *Promise‹[ProposalStageDurations](../interfaces/_contractkit_src_wrappers_governance_.proposalstagedurations.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:175](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L175)*

Query durations of different stages in proposal lifecycle.

**Returns:** *Promise‹[ProposalStageDurations](../interfaces/_contractkit_src_wrappers_governance_.proposalstagedurations.md)›*

Durations for approval, referendum and execution stages in seconds.

___

###  timeUntilStages

▸ **timeUntilStages**(`proposalID`: BigNumber.Value): *Promise‹object›*

*Defined in [contractkit/src/wrappers/Governance.ts:324](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L324)*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

**Returns:** *Promise‹object›*

___

###  upvote

▸ **upvote**(`proposalID`: BigNumber.Value, `upvoter`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Governance.ts:618](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L618)*

Applies provided upvoter's upvote to given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |
`upvoter` | [Address](../modules/_contractkit_src_base_.md#address) | Address of upvoter  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  vote

▸ **vote**(`proposalID`: BigNumber.Value, `vote`: keyof typeof VoteValue): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Governance.ts:660](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L660)*

Applies `sender`'s vote choice to a given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |
`vote` | keyof typeof VoteValue | Choice to apply (yes, no, abstain)  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*
