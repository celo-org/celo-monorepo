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

*Defined in [packages/contractkit/src/wrappers/Governance.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L93)*

___

###  Proposal

Ƭ **Proposal**: *[ProposalTransaction](_wrappers_governance_.md#proposaltransaction)[]*

*Defined in [packages/contractkit/src/wrappers/Governance.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L55)*

___

###  ProposalParams

Ƭ **ProposalParams**: *Parameters‹Governance["methods"]["propose"]›*

*Defined in [packages/contractkit/src/wrappers/Governance.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L53)*

___

###  ProposalTransaction

Ƭ **ProposalTransaction**: *Pick‹Transaction, "to" | "input" | "value"›*

*Defined in [packages/contractkit/src/wrappers/Governance.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L54)*

## Functions

### `Const` hotfixToParams

▸ **hotfixToParams**(`proposal`: [Proposal](_wrappers_governance_.md#proposal), `salt`: Buffer): *[HotfixParams](_wrappers_governance_.md#hotfixparams)*

*Defined in [packages/contractkit/src/wrappers/Governance.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L94)*

**Parameters:**

Name | Type |
------ | ------ |
`proposal` | [Proposal](_wrappers_governance_.md#proposal) |
`salt` | Buffer |

**Returns:** *[HotfixParams](_wrappers_governance_.md#hotfixparams)*

___

### `Const` proposalToParams

▸ **proposalToParams**(`proposal`: [Proposal](_wrappers_governance_.md#proposal)): *[ProposalParams](_wrappers_governance_.md#proposalparams)*

*Defined in [packages/contractkit/src/wrappers/Governance.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Governance.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`proposal` | [Proposal](_wrappers_governance_.md#proposal) |

**Returns:** *[ProposalParams](_wrappers_governance_.md#proposalparams)*
