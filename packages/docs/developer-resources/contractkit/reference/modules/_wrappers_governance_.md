# External module: "wrappers/Governance"

## Index

### Enumerations

* [ProposalStage](../enums/_wrappers_governance_.proposalstage.md)
* [VoteValue](../enums/_wrappers_governance_.votevalue.md)

### Classes

* [GovernanceWrapper](../classes/_wrappers_governance_.governancewrapper.md)

### Interfaces

* [GovernanceConfig](../interfaces/_wrappers_governance_.governanceconfig.md)
* [HotfixRecord](../interfaces/_wrappers_governance_.hotfixrecord.md)
* [ParticipationParameters](../interfaces/_wrappers_governance_.participationparameters.md)
* [ProposalMetadata](../interfaces/_wrappers_governance_.proposalmetadata.md)
* [ProposalRecord](../interfaces/_wrappers_governance_.proposalrecord.md)
* [ProposalStageDurations](../interfaces/_wrappers_governance_.proposalstagedurations.md)
* [UpvoteRecord](../interfaces/_wrappers_governance_.upvoterecord.md)
* [Votes](../interfaces/_wrappers_governance_.votes.md)

### Type aliases

* [HotfixParams](_wrappers_governance_.md#hotfixparams)
* [Proposal](_wrappers_governance_.md#proposal)
* [ProposalParams](_wrappers_governance_.md#proposalparams)
* [ProposalTransaction](_wrappers_governance_.md#proposaltransaction)

### Functions

* [hotfixToParams](_wrappers_governance_.md#const-hotfixtoparams)
* [proposalToParams](_wrappers_governance_.md#const-proposaltoparams)

## Type aliases

###  HotfixParams

Ƭ **HotfixParams**: *Parameters‹Governance["methods"]["executeHotfix"]›*

*Defined in [contractkit/src/wrappers/Governance.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L104)*

___

###  Proposal

Ƭ **Proposal**: *[ProposalTransaction](_wrappers_governance_.md#proposaltransaction)[]*

*Defined in [contractkit/src/wrappers/Governance.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L64)*

___

###  ProposalParams

Ƭ **ProposalParams**: *Parameters‹Governance["methods"]["propose"]›*

*Defined in [contractkit/src/wrappers/Governance.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L62)*

___

###  ProposalTransaction

Ƭ **ProposalTransaction**: *Pick‹Transaction, "to" | "input" | "value"›*

*Defined in [contractkit/src/wrappers/Governance.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L63)*

## Functions

### `Const` hotfixToParams

▸ **hotfixToParams**(`proposal`: [Proposal](_wrappers_governance_.md#proposal), `salt`: Buffer): *[HotfixParams](_wrappers_governance_.md#hotfixparams)*

*Defined in [contractkit/src/wrappers/Governance.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`proposal` | [Proposal](_wrappers_governance_.md#proposal) |
`salt` | Buffer |

**Returns:** *[HotfixParams](_wrappers_governance_.md#hotfixparams)*

___

### `Const` proposalToParams

▸ **proposalToParams**(`proposal`: [Proposal](_wrappers_governance_.md#proposal), `descriptionURL`: string): *[ProposalParams](_wrappers_governance_.md#proposalparams)*

*Defined in [contractkit/src/wrappers/Governance.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`proposal` | [Proposal](_wrappers_governance_.md#proposal) |
`descriptionURL` | string |

**Returns:** *[ProposalParams](_wrappers_governance_.md#proposalparams)*
