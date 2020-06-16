# External module: "contractkit/src/wrappers/Governance"

## Index

### Enumerations

* [ProposalStage](../enums/_contractkit_src_wrappers_governance_.proposalstage.md)
* [VoteValue](../enums/_contractkit_src_wrappers_governance_.votevalue.md)

### Classes

* [GovernanceWrapper](../classes/_contractkit_src_wrappers_governance_.governancewrapper.md)

### Interfaces

* [GovernanceConfig](../interfaces/_contractkit_src_wrappers_governance_.governanceconfig.md)
* [HotfixRecord](../interfaces/_contractkit_src_wrappers_governance_.hotfixrecord.md)
* [ParticipationParameters](../interfaces/_contractkit_src_wrappers_governance_.participationparameters.md)
* [ProposalMetadata](../interfaces/_contractkit_src_wrappers_governance_.proposalmetadata.md)
* [ProposalRecord](../interfaces/_contractkit_src_wrappers_governance_.proposalrecord.md)
* [ProposalStageDurations](../interfaces/_contractkit_src_wrappers_governance_.proposalstagedurations.md)
* [UpvoteRecord](../interfaces/_contractkit_src_wrappers_governance_.upvoterecord.md)
* [VoteRecord](../interfaces/_contractkit_src_wrappers_governance_.voterecord.md)
* [Voter](../interfaces/_contractkit_src_wrappers_governance_.voter.md)
* [Votes](../interfaces/_contractkit_src_wrappers_governance_.votes.md)

### Type aliases

* [HotfixParams](_contractkit_src_wrappers_governance_.md#hotfixparams)
* [Proposal](_contractkit_src_wrappers_governance_.md#proposal)
* [ProposalParams](_contractkit_src_wrappers_governance_.md#proposalparams)
* [ProposalTransaction](_contractkit_src_wrappers_governance_.md#proposaltransaction)

### Functions

* [hotfixToParams](_contractkit_src_wrappers_governance_.md#const-hotfixtoparams)
* [proposalToParams](_contractkit_src_wrappers_governance_.md#const-proposaltoparams)

## Type aliases

###  HotfixParams

Ƭ **HotfixParams**: *Parameters‹Governance["methods"]["executeHotfix"]›*

*Defined in [contractkit/src/wrappers/Governance.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L111)*

___

###  Proposal

Ƭ **Proposal**: *[ProposalTransaction](_contractkit_src_wrappers_governance_.md#proposaltransaction)[]*

*Defined in [contractkit/src/wrappers/Governance.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L71)*

___

###  ProposalParams

Ƭ **ProposalParams**: *Parameters‹Governance["methods"]["propose"]›*

*Defined in [contractkit/src/wrappers/Governance.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L69)*

___

###  ProposalTransaction

Ƭ **ProposalTransaction**: *Pick‹Transaction, "to" | "input" | "value"›*

*Defined in [contractkit/src/wrappers/Governance.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L70)*

## Functions

### `Const` hotfixToParams

▸ **hotfixToParams**(`proposal`: [Proposal](_contractkit_src_wrappers_governance_.md#proposal), `salt`: Buffer): *[HotfixParams](_contractkit_src_wrappers_governance_.md#hotfixparams)*

*Defined in [contractkit/src/wrappers/Governance.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`proposal` | [Proposal](_contractkit_src_wrappers_governance_.md#proposal) |
`salt` | Buffer |

**Returns:** *[HotfixParams](_contractkit_src_wrappers_governance_.md#hotfixparams)*

___

### `Const` proposalToParams

▸ **proposalToParams**(`proposal`: [Proposal](_contractkit_src_wrappers_governance_.md#proposal), `descriptionURL`: string): *[ProposalParams](_contractkit_src_wrappers_governance_.md#proposalparams)*

*Defined in [contractkit/src/wrappers/Governance.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`proposal` | [Proposal](_contractkit_src_wrappers_governance_.md#proposal) |
`descriptionURL` | string |

**Returns:** *[ProposalParams](_contractkit_src_wrappers_governance_.md#proposalparams)*
