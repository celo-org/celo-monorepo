# governance/proposals

## Index

### Classes

* [ProposalBuilder]()

### Interfaces

* [ProposalTransactionJSON]()

### Variables

* [HOTFIX\_PARAM\_ABI\_TYPES](_governance_proposals_.md#const-hotfix_param_abi_types)

### Functions

* [hotfixToEncodedParams](_governance_proposals_.md#const-hotfixtoencodedparams)
* [hotfixToHash](_governance_proposals_.md#const-hotfixtohash)
* [proposalToJSON](_governance_proposals_.md#const-proposaltojson)

## Variables

### `Const` HOTFIX\_PARAM\_ABI\_TYPES

• **HOTFIX\_PARAM\_ABI\_TYPES**: _string\[\]_ = getAbiTypes\(GovernanceABI as any, 'executeHotfix'\)

_Defined in_ [_contractkit/src/governance/proposals.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L15)

## Functions

### `Const` hotfixToEncodedParams

▸ **hotfixToEncodedParams**\(`kit`: [ContractKit](), `proposal`: [Proposal](_wrappers_governance_.md#proposal), `salt`: Buffer\): _string_

_Defined in_ [_contractkit/src/governance/proposals.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `proposal` | [Proposal](_wrappers_governance_.md#proposal) |
| `salt` | Buffer |

**Returns:** _string_

### `Const` hotfixToHash

▸ **hotfixToHash**\(`kit`: [ContractKit](), `proposal`: [Proposal](_wrappers_governance_.md#proposal), `salt`: Buffer\): _Buffer‹›_

_Defined in_ [_contractkit/src/governance/proposals.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L20)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `proposal` | [Proposal](_wrappers_governance_.md#proposal) |
| `salt` | Buffer |

**Returns:** _Buffer‹›_

### `Const` proposalToJSON

▸ **proposalToJSON**\(`kit`: [ContractKit](), `proposal`: [Proposal](_wrappers_governance_.md#proposal)\): _Promise‹_[_ProposalTransactionJSON_]()_\[\]›_

_Defined in_ [_contractkit/src/governance/proposals.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L50)

Convert a compiled proposal to a human-readable JSON form using network information.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `kit` | [ContractKit]() | Contract kit instance used to resolve addresses to contract names. |
| `proposal` | [Proposal](_wrappers_governance_.md#proposal) | A constructed proposal object. |

**Returns:** _Promise‹_[_ProposalTransactionJSON_]()_\[\]›_

The JSON encoding of the proposal.

