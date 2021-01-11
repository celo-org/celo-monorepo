# Module: "proposals"

## Index

### Classes

* [InteractiveProposalBuilder](../classes/_proposals_.interactiveproposalbuilder.md)
* [ProposalBuilder](../classes/_proposals_.proposalbuilder.md)

### Interfaces

* [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)

### Variables

* [HOTFIX_PARAM_ABI_TYPES](_proposals_.md#const-hotfix_param_abi_types)

### Functions

* [hotfixToEncodedParams](_proposals_.md#const-hotfixtoencodedparams)
* [hotfixToHash](_proposals_.md#const-hotfixtohash)
* [proposalToJSON](_proposals_.md#const-proposaltojson)

## Variables

### `Const` HOTFIX_PARAM_ABI_TYPES

• **HOTFIX_PARAM_ABI_TYPES**: *string[]* = getAbiTypes(GovernanceABI as any, 'executeHotfix')

*Defined in [proposals.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L36)*

## Functions

### `Const` hotfixToEncodedParams

▸ **hotfixToEncodedParams**(`kit`: ContractKit, `proposal`: Proposal, `salt`: Buffer): *string*

*Defined in [proposals.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | ContractKit |
`proposal` | Proposal |
`salt` | Buffer |

**Returns:** *string*

___

### `Const` hotfixToHash

▸ **hotfixToHash**(`kit`: ContractKit, `proposal`: Proposal, `salt`: Buffer): *Buffer‹›*

*Defined in [proposals.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | ContractKit |
`proposal` | Proposal |
`salt` | Buffer |

**Returns:** *Buffer‹›*

___

### `Const` proposalToJSON

▸ **proposalToJSON**(`kit`: ContractKit, `proposal`: Proposal): *Promise‹[ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)[]›*

*Defined in [proposals.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L82)*

Convert a compiled proposal to a human-readable JSON form using network information.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`kit` | ContractKit | Contract kit instance used to resolve addresses to contract names. |
`proposal` | Proposal | A constructed proposal object. |

**Returns:** *Promise‹[ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)[]›*

The JSON encoding of the proposal.
