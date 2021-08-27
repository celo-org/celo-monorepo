# wrappers/Governance

## Index

### Enumerations

* [ProposalStage]()
* [VoteValue]()

### Classes

* [GovernanceWrapper]()

### Interfaces

* [GovernanceConfig]()
* [HotfixRecord]()
* [ParticipationParameters]()
* [ProposalMetadata]()
* [ProposalRecord]()
* [ProposalStageDurations]()
* [UpvoteRecord]()
* [VoteRecord]()
* [Voter]()
* [Votes]()

### Type aliases

* [HotfixParams](_wrappers_governance_.md#hotfixparams)
* [Proposal](_wrappers_governance_.md#proposal)
* [ProposalParams](_wrappers_governance_.md#proposalparams)
* [ProposalTransaction](_wrappers_governance_.md#proposaltransaction)

### Functions

* [hotfixToParams](_wrappers_governance_.md#const-hotfixtoparams)
* [proposalToParams](_wrappers_governance_.md#const-proposaltoparams)

## Type aliases

### HotfixParams

Ƭ **HotfixParams**: _Parameters‹Governance\["methods"\]\["executeHotfix"\]›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:111_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L111)

### Proposal

Ƭ **Proposal**: [_ProposalTransaction_](_wrappers_governance_.md#proposaltransaction)_\[\]_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L71)

### ProposalParams

Ƭ **ProposalParams**: _Parameters‹Governance\["methods"\]\["propose"\]›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L69)

### ProposalTransaction

Ƭ **ProposalTransaction**: _Pick‹CeloTxPending, "to" \| "input" \| "value"›_

_Defined in_ [_contractkit/src/wrappers/Governance.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L70)

## Functions

### `Const` hotfixToParams

▸ **hotfixToParams**\(`proposal`: [Proposal](_wrappers_governance_.md#proposal), `salt`: Buffer\): [_HotfixParams_](_wrappers_governance_.md#hotfixparams)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:112_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L112)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposal` | [Proposal](_wrappers_governance_.md#proposal) |
| `salt` | Buffer |

**Returns:** [_HotfixParams_](_wrappers_governance_.md#hotfixparams)

### `Const` proposalToParams

▸ **proposalToParams**\(`proposal`: [Proposal](_wrappers_governance_.md#proposal), `descriptionURL`: string\): [_ProposalParams_](_wrappers_governance_.md#proposalparams)

_Defined in_ [_contractkit/src/wrappers/Governance.ts:73_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Governance.ts#L73)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `proposal` | [Proposal](_wrappers_governance_.md#proposal) |
| `descriptionURL` | string |

**Returns:** [_ProposalParams_](_wrappers_governance_.md#proposalparams)

