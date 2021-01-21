# proposals

## Index

### Classes

* [InteractiveProposalBuilder]()
* [ProposalBuilder]()

### Interfaces

* [ProposalTransactionJSON]()

### Variables

* [HOTFIX\_PARAM\_ABI\_TYPES](_proposals_.md#const-hotfix_param_abi_types)

### Functions

* [hotfixToEncodedParams](_proposals_.md#const-hotfixtoencodedparams)
* [hotfixToHash](_proposals_.md#const-hotfixtohash)
* [proposalToJSON](_proposals_.md#const-proposaltojson)

## Variables

### `Const` HOTFIX\_PARAM\_ABI\_TYPES

• **HOTFIX\_PARAM\_ABI\_TYPES**: _string\[\]_ = getAbiTypes\(GovernanceABI as any, 'executeHotfix'\)

_Defined in_ [_proposals.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L36)

## Functions

### `Const` hotfixToEncodedParams

▸ **hotfixToEncodedParams**\(`kit`: ContractKit, `proposal`: Proposal, `salt`: Buffer\): _string_

_Defined in_ [_proposals.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L38)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | ContractKit |
| `proposal` | Proposal |
| `salt` | Buffer |

**Returns:** _string_

### `Const` hotfixToHash

▸ **hotfixToHash**\(`kit`: ContractKit, `proposal`: Proposal, `salt`: Buffer\): _Buffer‹›_

_Defined in_ [_proposals.ts:43_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L43)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | ContractKit |
| `proposal` | Proposal |
| `salt` | Buffer |

**Returns:** _Buffer‹›_

### `Const` proposalToJSON

▸ **proposalToJSON**\(`kit`: ContractKit, `proposal`: Proposal\): _Promise‹_[_ProposalTransactionJSON_]()_\[\]›_

_Defined in_ [_proposals.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L82)

Convert a compiled proposal to a human-readable JSON form using network information.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `kit` | ContractKit | Contract kit instance used to resolve addresses to contract names. |
| `proposal` | Proposal | A constructed proposal object. |

**Returns:** _Promise‹_[_ProposalTransactionJSON_]()_\[\]›_

The JSON encoding of the proposal.

