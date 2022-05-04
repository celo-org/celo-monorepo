[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/Governance"](../modules/_wrappers_governance_.md) › [GovernanceWrapper](_wrappers_governance_.governancewrapper.md)

# Class: GovernanceWrapper

Contract managing voting for governance proposals.

## Hierarchy

  ↳ [BaseWrapperForGoverning](_wrappers_basewrapperforgoverning_.basewrapperforgoverning.md)‹Governance›

  ↳ **GovernanceWrapper**

## Index

### Constructors

* [constructor](_wrappers_governance_.governancewrapper.md#constructor)

### Properties

* [approveHotfix](_wrappers_governance_.governancewrapper.md#approvehotfix)
* [concurrentProposals](_wrappers_governance_.governancewrapper.md#concurrentproposals)
* [dequeueFrequency](_wrappers_governance_.governancewrapper.md#dequeuefrequency)
* [dequeueProposalsIfReady](_wrappers_governance_.governancewrapper.md#dequeueproposalsifready)
* [eventTypes](_wrappers_governance_.governancewrapper.md#eventtypes)
* [events](_wrappers_governance_.governancewrapper.md#events)
* [executeHotfix](_wrappers_governance_.governancewrapper.md#executehotfix)
* [getApprover](_wrappers_governance_.governancewrapper.md#getapprover)
* [getProposalMetadata](_wrappers_governance_.governancewrapper.md#getproposalmetadata)
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
* [methodIds](_wrappers_governance_.governancewrapper.md#methodids)
* [minDeposit](_wrappers_governance_.governancewrapper.md#mindeposit)
* [minQuorumSize](_wrappers_governance_.governancewrapper.md#minquorumsize)
* [prepareHotfix](_wrappers_governance_.governancewrapper.md#preparehotfix)
* [proposalExists](_wrappers_governance_.governancewrapper.md#proposalexists)
* [propose](_wrappers_governance_.governancewrapper.md#propose)
* [queueExpiry](_wrappers_governance_.governancewrapper.md#queueexpiry)
* [revokeVotes](_wrappers_governance_.governancewrapper.md#revokevotes)
* [whitelistHotfix](_wrappers_governance_.governancewrapper.md#whitelisthotfix)
* [withdraw](_wrappers_governance_.governancewrapper.md#withdraw)

### Accessors

* [address](_wrappers_governance_.governancewrapper.md#address)

### Methods

* [approve](_wrappers_governance_.governancewrapper.md#approve)
* [execute](_wrappers_governance_.governancewrapper.md#execute)
* [getApprovalStatus](_wrappers_governance_.governancewrapper.md#getapprovalstatus)
* [getApproverMultisig](_wrappers_governance_.governancewrapper.md#getapprovermultisig)
* [getConfig](_wrappers_governance_.governancewrapper.md#getconfig)
* [getConstitution](_wrappers_governance_.governancewrapper.md#getconstitution)
* [getDequeue](_wrappers_governance_.governancewrapper.md#getdequeue)
* [getHotfixRecord](_wrappers_governance_.governancewrapper.md#gethotfixrecord)
* [getHumanReadableConfig](_wrappers_governance_.governancewrapper.md#gethumanreadableconfig)
* [getHumanReadableProposalMetadata](_wrappers_governance_.governancewrapper.md#gethumanreadableproposalmetadata)
* [getParticipationParameters](_wrappers_governance_.governancewrapper.md#getparticipationparameters)
* [getPastEvents](_wrappers_governance_.governancewrapper.md#getpastevents)
* [getProposal](_wrappers_governance_.governancewrapper.md#getproposal)
* [getProposalRecord](_wrappers_governance_.governancewrapper.md#getproposalrecord)
* [getProposalStage](_wrappers_governance_.governancewrapper.md#getproposalstage)
* [getSupport](_wrappers_governance_.governancewrapper.md#getsupport)
* [getTransactionConstitution](_wrappers_governance_.governancewrapper.md#gettransactionconstitution)
* [getVoteRecord](_wrappers_governance_.governancewrapper.md#getvoterecord)
* [getVoteRecords](_wrappers_governance_.governancewrapper.md#getvoterecords)
* [getVoteValue](_wrappers_governance_.governancewrapper.md#getvotevalue)
* [getVoteWeight](_wrappers_governance_.governancewrapper.md#getvoteweight)
* [getVoter](_wrappers_governance_.governancewrapper.md#getvoter)
* [humanReadableProposalSchedule](_wrappers_governance_.governancewrapper.md#humanreadableproposalschedule)
* [isUpvoting](_wrappers_governance_.governancewrapper.md#isupvoting)
* [isVotingReferendum](_wrappers_governance_.governancewrapper.md#isvotingreferendum)
* [proposalSchedule](_wrappers_governance_.governancewrapper.md#proposalschedule)
* [revokeUpvote](_wrappers_governance_.governancewrapper.md#revokeupvote)
* [sortedQueue](_wrappers_governance_.governancewrapper.md#sortedqueue)
* [stageDurations](_wrappers_governance_.governancewrapper.md#stagedurations)
* [upvote](_wrappers_governance_.governancewrapper.md#upvote)
* [version](_wrappers_governance_.governancewrapper.md#version)
* [vote](_wrappers_governance_.governancewrapper.md#vote)

## Constructors

###  constructor

\+ **new GovernanceWrapper**(`connection`: Connection, `contract`: Governance, `contracts`: ContractWrappersForVotingAndRules): *[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)*

*Inherited from [ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md).[constructor](_wrappers_validators_.validatorswrapper.md#constructor)*

*Overrides [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapperForGoverning.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | Governance |
`contracts` | ContractWrappersForVotingAndRules |

**Returns:** *[GovernanceWrapper](_wrappers_governance_.governancewrapper.md)*

## Properties

###  approveHotfix

• **approveHotfix**: *function* = proxySend(
    this.connection,
    this.contract.methods.approveHotfix,
    tupleParser(bufferToHex)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:893](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L893)*

Marks the given hotfix approved by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

**`notice`** Only the `approver` address will succeed in sending this transaction

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L156)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L170)*

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

• **dequeueProposalsIfReady**: *function* = proxySend(
    this.connection,
    this.contract.methods.dequeueProposalsIfReady
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:659](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L659)*

Dequeues any queued proposals if `dequeueFrequency` seconds have elapsed since the last dequeue

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

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

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *Governance["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  executeHotfix

• **executeHotfix**: *function* = proxySend(this.connection, this.contract.methods.executeHotfix, hotfixToParams)

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:915](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L915)*

Executes a given sequence of transactions if the corresponding hash is prepared and approved.

**`param`** Governance hotfix proposal

**`param`** Secret which guarantees uniqueness of hash

**`notice`** keccak256 hash of abi encoded transactions computed on-chain

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getApprover

• **getApprover**: *function* = proxyCall(this.contract.methods.approver)

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:382](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L382)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:310](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L310)*

Returns the metadata associated with a given proposal.

**`param`** Governance proposal UUID

#### Type declaration:

▸ (`proposalID`: BigNumber.Value): *Promise‹[ProposalMetadata](../interfaces/_wrappers_governance_.proposalmetadata.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:339](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L339)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:605](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L605)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:572](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L572)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:523](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L523)*

Returns the current upvoted governance proposal ID and applied vote weight (zeroes if none).

**`param`** Address of upvoter

#### Type declaration:

▸ (`upvoter`: Address): *Promise‹[UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`upvoter` | Address |

___

###  getUpvotes

• **getUpvotes**: *function* = proxyCall(
    this.contract.methods.getUpvotes,
    tupleParser(valueToString),
    valueToBigNumber
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:582](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L582)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:592](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L592)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:873](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L873)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:356](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L356)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:365](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L365)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:858](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L858)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:849](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L849)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:496](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L496)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:566](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L566)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:374](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L374)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:257](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L257)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:165](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L165)*

Query time of last proposal dequeue

**`returns`** Time of last dequeue

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
          : this.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L68)*

___

###  minDeposit

• **minDeposit**: *function* = proxyCall(this.contract.methods.minDeposit, undefined, valueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:175](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L175)*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:863](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L863)*

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
    this.connection,
    this.contract.methods.prepareHotfix,
    tupleParser(bufferToHex)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:903](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L903)*

Marks the given hotfix prepared for current epoch if quorum of validators have whitelisted it.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

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

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:514](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L514)*

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

• **propose**: *function* = proxySend(this.connection, this.contract.methods.propose, proposalToParams)

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:508](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L508)*

Submits a new governance proposal.

**`param`** Governance proposal

**`param`** A URL where further information about the proposal can be viewed

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  queueExpiry

• **queueExpiry**: *function* = proxyCall(this.contract.methods.queueExpiry, undefined, valueToBigNumber)

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:180](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L180)*

Query queue expiry parameter.

**`returns`** The number of seconds a proposal can stay in the queue before expiring.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  revokeVotes

• **revokeVotes**: *function* = proxySend(this.connection, this.contract.methods.revokeVotes)

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:806](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L806)*

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  whitelistHotfix

• **whitelistHotfix**: *function* = proxySend(
    this.connection,
    this.contract.methods.whitelistHotfix,
    tupleParser(bufferToHex)
  )

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:882](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L882)*

Marks the given hotfix whitelisted by `sender`.

**`param`** keccak256 hash of hotfix's associated abi encoded transactions

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  withdraw

• **withdraw**: *function* = proxySend(this.connection, this.contract.methods.withdraw)

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:501](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L501)*

Withdraws refunded proposal deposits.

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  approve

▸ **approve**(`proposalID`: BigNumber.Value): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:784](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L784)*

Approves given proposal, allowing it to later move to `referendum`.

**`notice`** Only the `approver` address will succeed in sending this transaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  execute

▸ **execute**(`proposalID`: BigNumber.Value): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:823](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L823)*

Executes a given proposal's associated transactions.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  getApprovalStatus

▸ **getApprovalStatus**(`proposalID`: BigNumber.Value): *Promise‹ApprovalStatus›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:448](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L448)*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

**Returns:** *Promise‹ApprovalStatus›*

___

###  getApproverMultisig

▸ **getApproverMultisig**(): *Promise‹[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:387](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L387)*

Returns the approver multisig contract for proposals and hotfixes.

**Returns:** *Promise‹[MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)‹››*

___

###  getConfig

▸ **getConfig**(): *Promise‹[GovernanceConfig](../interfaces/_wrappers_governance_.governanceconfig.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:262](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L262)*

Returns current configuration parameters.

**Returns:** *Promise‹[GovernanceConfig](../interfaces/_wrappers_governance_.governanceconfig.md)›*

___

###  getConstitution

▸ **getConstitution**(`proposal`: [Proposal](../modules/_wrappers_governance_.md#proposal)): *Promise‹BigNumber›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:211](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L211)*

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposal` | [Proposal](../modules/_wrappers_governance_.md#proposal) | Proposal to determine the constitution for running.  |

**Returns:** *Promise‹BigNumber›*

___

###  getDequeue

▸ **getDequeue**(`filterZeroes`: boolean): *Promise‹BigNumber‹›[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:619](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L619)*

Returns the (existing) proposal dequeue as list of proposal IDs.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`filterZeroes` | boolean | false |

**Returns:** *Promise‹BigNumber‹›[]›*

___

###  getHotfixRecord

▸ **getHotfixRecord**(`hash`: Buffer): *Promise‹[HotfixRecord](../interfaces/_wrappers_governance_.hotfixrecord.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:835](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L835)*

Returns approved, executed, and prepared status associated with a given hotfix.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`hash` | Buffer | keccak256 hash of hotfix's associated abi encoded transactions  |

**Returns:** *Promise‹[HotfixRecord](../interfaces/_wrappers_governance_.hotfixrecord.md)›*

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:285](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L285)*

**`dev`** Returns human readable configuration of the governance contract

**Returns:** *Promise‹object›*

GovernanceConfig object

___

###  getHumanReadableProposalMetadata

▸ **getHumanReadableProposalMetadata**(`proposalID`: BigNumber.Value): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:326](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L326)*

Returns the human readable metadata associated with a given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹object›*

___

###  getParticipationParameters

▸ **getParticipationParameters**(): *Promise‹[ParticipationParameters](../interfaces/_wrappers_governance_.participationparameters.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:223](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L223)*

Returns the participation parameters.

**Returns:** *Promise‹[ParticipationParameters](../interfaces/_wrappers_governance_.participationparameters.md)›*

The participation parameters.

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Governance›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Governance› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getProposal

▸ **getProposal**(`proposalID`: BigNumber.Value): *Promise‹[Proposal](../modules/_wrappers_governance_.md#proposal)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:442](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L442)*

Returns the proposal associated with a given id.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹[Proposal](../modules/_wrappers_governance_.md#proposal)›*

___

###  getProposalRecord

▸ **getProposalRecord**(`proposalID`: BigNumber.Value): *Promise‹[ProposalRecord](../interfaces/_wrappers_governance_.proposalrecord.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:465](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L465)*

Returns the stage, metadata, upvotes, votes, and transactions associated with a given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹[ProposalRecord](../interfaces/_wrappers_governance_.proposalrecord.md)›*

___

###  getProposalStage

▸ **getProposalStage**(`proposalID`: BigNumber.Value): *Promise‹[ProposalStage](../enums/_wrappers_governance_.proposalstage.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:390](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L390)*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

**Returns:** *Promise‹[ProposalStage](../enums/_wrappers_governance_.proposalstage.md)›*

___

###  getSupport

▸ **getSupport**(`proposalID`: BigNumber.Value): *Promise‹object›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:234](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L234)*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

**Returns:** *Promise‹object›*

___

###  getTransactionConstitution

▸ **getTransactionConstitution**(`tx`: [ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)): *Promise‹BigNumber›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:198](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L198)*

Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction) | Transaction to determine the constitution for running.  |

**Returns:** *Promise‹BigNumber›*

___

###  getVoteRecord

▸ **getVoteRecord**(`voter`: Address, `proposalID`: BigNumber.Value): *Promise‹[VoteRecord](../interfaces/_wrappers_governance_.voterecord.md) | null›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:546](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L546)*

Returns the corresponding vote record

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`voter` | Address | Address of voter |
`proposalID` | BigNumber.Value | Governance proposal UUID  |

**Returns:** *Promise‹[VoteRecord](../interfaces/_wrappers_governance_.voterecord.md) | null›*

___

###  getVoteRecords

▸ **getVoteRecords**(`voter`: Address): *Promise‹[VoteRecord](../interfaces/_wrappers_governance_.voterecord.md)[]›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:629](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L629)*

**Parameters:**

Name | Type |
------ | ------ |
`voter` | Address |

**Returns:** *Promise‹[VoteRecord](../interfaces/_wrappers_governance_.voterecord.md)[]›*

___

###  getVoteValue

▸ **getVoteValue**(`proposalID`: BigNumber.Value, `voter`: Address): *Promise‹[VoteValue](../enums/_wrappers_governance_.votevalue.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:813](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L813)*

Returns `voter`'s vote choice on a given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |
`voter` | Address | Address of voter  |

**Returns:** *Promise‹[VoteValue](../enums/_wrappers_governance_.votevalue.md)›*

___

###  getVoteWeight

▸ **getVoteWeight**(`voter`: Address): *Promise‹BigNumber‹››*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:668](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L668)*

Returns the number of votes that will be applied to a proposal for a given voter.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`voter` | Address | Address of voter  |

**Returns:** *Promise‹BigNumber‹››*

___

###  getVoter

▸ **getVoter**(`account`: Address): *Promise‹[Voter](../interfaces/_wrappers_governance_.voter.md)›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:643](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L643)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *Promise‹[Voter](../interfaces/_wrappers_governance_.voter.md)›*

___

###  humanReadableProposalSchedule

▸ **humanReadableProposalSchedule**(`proposalID`: BigNumber.Value): *Promise‹Partial‹StageDurations‹string›››*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:428](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L428)*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

**Returns:** *Promise‹Partial‹StageDurations‹string›››*

___

###  isUpvoting

▸ **isUpvoting**(`upvoter`: Address): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:532](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L532)*

**Parameters:**

Name | Type |
------ | ------ |
`upvoter` | Address |

**Returns:** *Promise‹boolean›*

___

###  isVotingReferendum

▸ **isVotingReferendum**(`voter`: Address): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:635](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L635)*

**Parameters:**

Name | Type |
------ | ------ |
`voter` | Address |

**Returns:** *Promise‹boolean›*

___

###  proposalSchedule

▸ **proposalSchedule**(`proposalID`: BigNumber.Value): *Promise‹Partial‹StageDurations‹BigNumber›››*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:402](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L402)*

**Parameters:**

Name | Type |
------ | ------ |
`proposalID` | BigNumber.Value |

**Returns:** *Promise‹Partial‹StageDurations‹BigNumber›››*

___

###  revokeUpvote

▸ **revokeUpvote**(`upvoter`: Address): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:771](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L771)*

Revokes provided upvoter's upvote.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`upvoter` | Address | Address of upvoter  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  sortedQueue

▸ **sortedQueue**(`queue`: [UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)[]): *[UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)[]*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:709](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L709)*

**Parameters:**

Name | Type |
------ | ------ |
`queue` | [UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)[] |

**Returns:** *[UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)[]*

___

###  stageDurations

▸ **stageDurations**(): *Promise‹DequeuedStageDurations›*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:185](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L185)*

Query durations of different stages in proposal lifecycle.

**Returns:** *Promise‹DequeuedStageDurations›*

Durations for approval, referendum and execution stages in seconds.

___

###  upvote

▸ **upvote**(`proposalID`: BigNumber.Value, `upvoter`: Address): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:755](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L755)*

Applies provided upvoter's upvote to given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |
`upvoter` | Address | Address of upvoter  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

___

###  vote

▸ **vote**(`proposalID`: BigNumber.Value, `vote`: keyof typeof VoteValue): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [packages/sdk/contractkit/src/wrappers/Governance.ts:797](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L797)*

Applies `sender`'s vote choice to a given proposal.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`proposalID` | BigNumber.Value | Governance proposal UUID |
`vote` | keyof typeof VoteValue | Choice to apply (yes, no, abstain)  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*
