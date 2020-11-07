# External module: "governance/proposals"

## Index

### Classes

* [InteractiveProposalBuilder](../classes/_governance_proposals_.interactiveproposalbuilder.md)
* [ProposalBuilder](../classes/_governance_proposals_.proposalbuilder.md)

### Interfaces

* [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)

### Variables

* [HOTFIX_PARAM_ABI_TYPES](_governance_proposals_.md#const-hotfix_param_abi_types)

### Functions

* [hotfixToEncodedParams](_governance_proposals_.md#const-hotfixtoencodedparams)
* [hotfixToHash](_governance_proposals_.md#const-hotfixtohash)
* [proposalToJSON](_governance_proposals_.md#const-proposaltojson)

## Variables

### `Const` HOTFIX_PARAM_ABI_TYPES

• **HOTFIX_PARAM_ABI_TYPES**: *string[]* = getAbiTypes(GovernanceABI as any, 'executeHotfix')

*Defined in [packages/contractkit/src/governance/proposals.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L25)*

## Functions

### `Const` hotfixToEncodedParams

▸ **hotfixToEncodedParams**(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `proposal`: [Proposal](_wrappers_governance_.md#proposal), `salt`: Buffer): *string*

*Defined in [packages/contractkit/src/governance/proposals.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |
`proposal` | [Proposal](_wrappers_governance_.md#proposal) |
`salt` | Buffer |

**Returns:** *string*

___

### `Const` hotfixToHash

▸ **hotfixToHash**(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `proposal`: [Proposal](_wrappers_governance_.md#proposal), `salt`: Buffer): *Buffer‹›*

*Defined in [packages/contractkit/src/governance/proposals.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |
`proposal` | [Proposal](_wrappers_governance_.md#proposal) |
`salt` | Buffer |

**Returns:** *Buffer‹›*

___

### `Const` proposalToJSON

▸ **proposalToJSON**(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `proposal`: [Proposal](_wrappers_governance_.md#proposal)): *Promise‹[ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)[]›*

*Defined in [packages/contractkit/src/governance/proposals.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L69)*

Convert a compiled proposal to a human-readable JSON form using network information.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) | Contract kit instance used to resolve addresses to contract names. |
`proposal` | [Proposal](_wrappers_governance_.md#proposal) | A constructed proposal object. |

**Returns:** *Promise‹[ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)[]›*

The JSON encoding of the proposal.
