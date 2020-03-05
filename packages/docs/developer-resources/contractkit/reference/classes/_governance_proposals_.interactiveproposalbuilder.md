# Class: InteractiveProposalBuilder

## Hierarchy

* **InteractiveProposalBuilder**

## Index

### Constructors

* [constructor](_governance_proposals_.interactiveproposalbuilder.md#constructor)

### Methods

* [outputTransactions](_governance_proposals_.interactiveproposalbuilder.md#outputtransactions)
* [promptTransactions](_governance_proposals_.interactiveproposalbuilder.md#prompttransactions)

## Constructors

###  constructor

\+ **new InteractiveProposalBuilder**(`builder`: [ProposalBuilder](_governance_proposals_.proposalbuilder.md)): *[InteractiveProposalBuilder](_governance_proposals_.interactiveproposalbuilder.md)*

*Defined in [packages/contractkit/src/governance/proposals.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L155)*

**Parameters:**

Name | Type |
------ | ------ |
`builder` | [ProposalBuilder](_governance_proposals_.proposalbuilder.md) |

**Returns:** *[InteractiveProposalBuilder](_governance_proposals_.interactiveproposalbuilder.md)*

## Methods

###  outputTransactions

▸ **outputTransactions**(): *Promise‹void›*

*Defined in [packages/contractkit/src/governance/proposals.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L158)*

**Returns:** *Promise‹void›*

___

###  promptTransactions

▸ **promptTransactions**(`num`: number): *Promise‹[ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)[]›*

*Defined in [packages/contractkit/src/governance/proposals.ts:163](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L163)*

**Parameters:**

Name | Type |
------ | ------ |
`num` | number |

**Returns:** *Promise‹[ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)[]›*
