# Class: GovernanceWrapper

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
* [minDeposit](_wrappers_governance_.governancewrapper.md#mindeposit)
* [minQuorumSize](_wrappers_governance_.governancewrapper.md#minquorumsize)
* [prepareHotfix](_wrappers_governance_.governancewrapper.md#preparehotfix)
* [proposalExists](_wrappers_governance_.governancewrapper.md#proposalexists)
* [propose](_wrappers_governance_.governancewrapper.md#propose)
* [queueExpiry](_wrappers_governance_.governancewrapper.md#queueexpiry)
* [whitelistHotfix](_wrappers_governance_.governancewrapper.md#whitelisthotfix)

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
* [getVoteValue](_wrappers_governance_.governancewrapper.md#getvotevalue)
* [getVoteWeight](_wrappers_governance_.governancewrapper.md#getvoteweight)
* [revokeUpvote](_wrappers_governance_.governancewrapper.md#revokeupvote)
* [sortedQueue](_wrappers_governance_.governancewrapper.md#sortedqueue)
* [stageDurations](_wrappers_governance_.governancewrapper.md#stagedurations)
* [timeUntilStages](_wrappers_governance_.governancewrapper.md#timeuntilstages)
* [upvote](_wrappers_governance_.governancewrapper.md#upvote)
* [vote](_wrappers_governance_.governancewrapper.md#vote)

## Constructors

###  constructor

\+ **new GovernanceWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Governance): *[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Governance |

**Returns:** *[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)*

## Properties

###  approveHotfix

• **approveHotfix**: *function* = proxySend(
    this.kit,
    this.contract.methods.approveHotfix,
    tupleParser(bufferToString)
  )

*Defined in [contractkit/src/wrappers/Governance.ts:670](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L670)*

Marks the given hotfix approved by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

**`notice`** Only the `approver` address will succeed in sending this transaction

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

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

*Defined in [contractkit/src/wrappers/Governance.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L128)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:137](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L137)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:441](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L441)*

Dequeues any queued proposals if `dequeueFrequency` seconds have elapsed since the last dequeue

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  executeHotfix

• **executeHotfix**: *function* = proxySend(this.kit, this.contract.methods.executeHotfix, hotfixToParams)

*Defined in [contractkit/src/wrappers/Governance.ts:692](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L692)*

Executes a given sequence of transactions if the corresponding hash is prepared and approved.

**`param`** Governance hotfix proposal

**`param`** Secret which guarantees uniqueness of hash

**`notice`** keccak256 hash of abi encoded transactions computed on-chain

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getApprover

• **getApprover**: *function* = proxyCall(this.contract.methods.approver)

*Defined in [contractkit/src/wrappers/Governance.ts:293](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L293)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:233](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L233)*

Returns the metadata associated with a given proposal.

**`param`** Governance proposal UUID

#### Type declaration:

▸ (`proposalID`: BigNumber.Value): *Promise‹[ProposalMetadata](../interfaces/_wrappers_governance_.proposalmetadata.md)›*

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

*Defined in [contractkit/src/wrappers/Governance.ts:295](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L295)*

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
      input: bytesToString(res[2]),
    })
  )

*Defined in [contractkit/src/wrappers/Governance.ts:250](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L250)*

Returns the transaction at the given index associated with a given proposal.

**`param`** Governance proposal UUID

**`param`** Transaction index

#### Type declaration:

▸ (`proposalID`: BigNumber.Value, `txIndex`: number): *Promise‹[ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)›*

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

*Defined in [contractkit/src/wrappers/Governance.ts:417](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L417)*

Returns the proposal queue as list of upvote records.

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

*Defined in [contractkit/src/wrappers/Governance.ts:375](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L375)*

Returns the current upvoted governance proposal ID and applied vote weight (zeroes if none).

**`param`** Address of upvoter

#### Type declaration:

▸ (`upvoter`: [Address](../modules/_base_.md#address)): *Promise‹[UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`upvoter` | [Address](../modules/_base_.md#address) |

___

###  getUpvotes

• **getUpvotes**: *function* = proxyCall(
    this.contract.methods.getUpvotes,
    tupleParser(valueToString),
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Governance.ts:394](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L394)*

Returns the upvotes applied to a given proposal.

**`param`** Governance proposal UUID

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

*Defined in [contractkit/src/wrappers/Governance.ts:404](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L404)*

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
    tupleParser(bufferToString)
  )

*Defined in [contractkit/src/wrappers/Governance.ts:650](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L650)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L267)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:276](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L276)*

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

• **isHotfixPassing**: *function* = proxyCall(this.contract.methods.isHotfixPassing, tupleParser(bufferToString))

*Defined in [contractkit/src/wrappers/Governance.ts:635](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L635)*

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
    tupleParser(bufferToString, (s: Address) => identity<Address>(s))
  )

*Defined in [contractkit/src/wrappers/Governance.ts:626](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L626)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:353](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L353)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:388](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L388)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:285](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L285)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:205](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L205)*

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

###  minDeposit

• **minDeposit**: *function* = proxyCall(this.contract.methods.minDeposit, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Governance.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L142)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:640](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L640)*

Returns the number of validators required to reach a Byzantine quorum

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  prepareHotfix

• **prepareHotfix**: *function* = proxySend(
    this.kit,
    this.contract.methods.prepareHotfix,
    tupleParser(bufferToString)
  )

*Defined in [contractkit/src/wrappers/Governance.ts:680](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L680)*

Marks the given hotfix prepared for current epoch if quorum of validators have whitelisted it.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

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

*Defined in [contractkit/src/wrappers/Governance.ts:366](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L366)*

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

*Defined in [contractkit/src/wrappers/Governance.ts:360](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L360)*

Submits a new governance proposal.

**`param`** Governance proposal

**`param`** A URL where further information about the proposal can be viewed

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  queueExpiry

• **queueExpiry**: *function* = proxyCall(this.contract.methods.queueExpiry, undefined, valueToBigNumber)

*Defined in [contractkit/src/wrappers/Governance.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L147)*

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
    tupleParser(bufferToString)
  )

*Defined in [contractkit/src/wrappers/Governance.ts:659](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L659)*

Marks the given hotfix whitelisted by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ (...`args`: InputArgs): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  approve

▸ **approve**(`proposalID`: BigNumber.Value): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Governance.ts:563](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L563)*

Approves given proposal, allowing it to later move to `referendum`.

**`notice`** Only the `approver` address will succeed in sending this transaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  execute

▸ **execute**(`proposalID`: BigNumber.Value): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Governance.ts:600](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L600)*

Executes a given proposal's associated transactions.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  getConfig

▸ **getConfig**(): *Promise‹[GovernanceConfig](../interfaces/_wrappers_governance_.governanceconfig.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L210)*

Returns current configuration parameters.

**Returns:** *Promise‹[GovernanceConfig](../interfaces/_wrappers_governance_.governanceconfig.md)›*

___

###  getConstitution

▸ **getConstitution**(`proposal`: [Proposal](../modules/_wrappers_governance_.md#proposal)): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/Governance.ts:178](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L178)*

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposal` | [Proposal](../modules/_wrappers_governance_.md#proposal) | Proposal to determine the constitution for running.  |

**Returns:** *Promise‹BigNumber›*

___

###  getDequeue

▸ **getDequeue**(`filterZeroes`: boolean): *Promise‹BigNumber‹›[]›*

*Defined in [contractkit/src/wrappers/Governance.ts:431](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L431)*

Returns the (existing) proposal dequeue as list of proposal IDs.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`filterZeroes` | boolean | false |

**Returns:** *Promise‹BigNumber‹›[]›*

___

###  getHotfixRecord

▸ **getHotfixRecord**(`hash`: Buffer): *Promise‹[HotfixRecord](../interfaces/_wrappers_governance_.hotfixrecord.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:612](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L612)*

Returns approved, executed, and prepared status associated with a given hotfix.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`hash` | Buffer | keccak256 hash of hotfix's associated abi encoded transactions  |

**Returns:** *Promise‹[HotfixRecord](../interfaces/_wrappers_governance_.hotfixrecord.md)›*

___

###  getParticipationParameters

▸ **getParticipationParameters**(): *Promise‹[ParticipationParameters](../interfaces/_wrappers_governance_.participationparameters.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:190](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L190)*

Returns the participation parameters.

**Returns:** *Promise‹[ParticipationParameters](../interfaces/_wrappers_governance_.participationparameters.md)›*

The participation parameters.

___

###  getProposal

▸ **getProposal**(`proposalID`: BigNumber.Value): *Promise‹[Proposal](../modules/_wrappers_governance_.md#proposal)›*

*Defined in [contractkit/src/wrappers/Governance.ts:315](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L315)*

Returns the proposal associated with a given id.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹[Proposal](../modules/_wrappers_governance_.md#proposal)›*

___

###  getProposalRecord

▸ **getProposalRecord**(`proposalID`: BigNumber.Value): *Promise‹[ProposalRecord](../interfaces/_wrappers_governance_.proposalrecord.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:325](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L325)*

Returns the stage, metadata, upvotes, votes, and transactions associated with a given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹[ProposalRecord](../interfaces/_wrappers_governance_.proposalrecord.md)›*

___

###  getTransactionConstitution

▸ **getTransactionConstitution**(`tx`: [ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)): *Promise‹BigNumber›*

*Defined in [contractkit/src/wrappers/Governance.ts:165](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L165)*

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction) | Transaction to determine the constitution for running.  |

**Returns:** *Promise‹BigNumber›*

___

###  getVoteValue

▸ **getVoteValue**(`proposalID`: BigNumber.Value, `voter`: [Address](../modules/_base_.md#address)): *Promise‹[VoteValue](../enums/_wrappers_governance_.votevalue.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:590](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L590)*

Returns `voter`'s vote choice on a given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |
`voter` | [Address](../modules/_base_.md#address) | Address of voter  |

**Returns:** *Promise‹[VoteValue](../enums/_wrappers_governance_.votevalue.md)›*

___

###  getVoteWeight

▸ **getVoteWeight**(`voter`: [Address](../modules/_base_.md#address)): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Governance.ts:447](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L447)*

Returns the number of votes that will be applied to a proposal for a given voter.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`voter` | [Address](../modules/_base_.md#address) | Address of voter  |

**Returns:** *Promise‹BigNumber‹››*

___

###  revokeUpvote

▸ **revokeUpvote**(`upvoter`: [Address](../modules/_base_.md#address)): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Governance.ts:550](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L550)*

Revokes provided upvoter's upvote.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`upvoter` | [Address](../modules/_base_.md#address) | Address of upvoter  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  sortedQueue

▸ **sortedQueue**(`queue`: [UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)[]): *[UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)[]*

*Defined in [contractkit/src/wrappers/Governance.ts:488](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L488)*

**Parameters:**

Name | Type |
------ | ------ |
`queue` | [UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)[] |

**Returns:** *[UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)[]*

___

###  stageDurations

▸ **stageDurations**(): *Promise‹[ProposalStageDurations](../interfaces/_wrappers_governance_.proposalstagedurations.md)›*

*Defined in [contractkit/src/wrappers/Governance.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L152)*

Query durations of different stages in proposal lifecycle.

**Returns:** *Promise‹[ProposalStageDurations](../interfaces/_wrappers_governance_.proposalstagedurations.md)›*

Durations for approval, referendum and execution stages in seconds.

___

###  timeUntilStages

▸ **timeUntilStages**(`proposalID`: BigNumber.Value): *Promise‹object›*

*Defined in [contractkit/src/wrappers/Governance.ts:301](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L301)*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

**Returns:** *Promise‹object›*

___

###  upvote

▸ **upvote**(`proposalID`: BigNumber.Value, `upvoter`: [Address](../modules/_base_.md#address)): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Governance.ts:534](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L534)*

Applies provided upvoter's upvote to given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |
`upvoter` | [Address](../modules/_base_.md#address) | Address of upvoter  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  vote

▸ **vote**(`proposalID`: BigNumber.Value, `vote`: keyof typeof VoteValue): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Governance.ts:576](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L576)*

Applies `sender`'s vote choice to a given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |
`vote` | keyof typeof VoteValue | Choice to apply (yes, no, abstain)  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*
