[@celo/governance](../README.md) › ["proposals"](_proposals_.md)

# Module: "proposals"

## Index

### Classes

* [InteractiveProposalBuilder](../classes/_proposals_.interactiveproposalbuilder.md)
* [ProposalBuilder](../classes/_proposals_.proposalbuilder.md)

### Interfaces

* [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)

### Variables

* [hotfixExecuteAbi](_proposals_.md#const-hotfixexecuteabi)

### Functions

* [hotfixToEncodedParams](_proposals_.md#const-hotfixtoencodedparams)
* [hotfixToHash](_proposals_.md#const-hotfixtohash)
* [proposalToJSON](_proposals_.md#const-proposaltojson)

## Variables

### `Const` hotfixExecuteAbi

• **hotfixExecuteAbi**: *AbiItem* = getAbiByName(GovernanceABI, 'executeHotfix')

*Defined in [proposals.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L46)*

## Functions

### `Const` hotfixToEncodedParams

▸ **hotfixToEncodedParams**(`kit`: ContractKit, `proposal`: Proposal, `salt`: Buffer): *string*

*Defined in [proposals.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L48)*

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

*Defined in [proposals.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | ContractKit |
`proposal` | Proposal |
`salt` | Buffer |

**Returns:** *Buffer‹›*

___

### `Const` proposalToJSON

▸ **proposalToJSON**(`kit`: ContractKit, `proposal`: Proposal, `registryAdditions?`: RegistryAdditions): *Promise‹[ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)[]›*

*Defined in [proposals.ts:124](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L124)*

Convert a compiled proposal to a human-readable JSON form using network information.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`kit` | ContractKit | Contract kit instance used to resolve addresses to contract names. |
`proposal` | Proposal | A constructed proposal object. |
`registryAdditions?` | RegistryAdditions | Registry remappings prior to parsing the proposal as a map of name to corresponding contract address. |

**Returns:** *Promise‹[ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)[]›*

The JSON encoding of the proposal.
