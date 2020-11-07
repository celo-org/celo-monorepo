# Class: ProposalBuilder

Builder class to construct proposals from JSON or transaction objects.

## Hierarchy

* **ProposalBuilder**

## Index

### Constructors

* [constructor](_governance_proposals_.proposalbuilder.md#constructor)

### Methods

* [addJsonTx](_governance_proposals_.proposalbuilder.md#addjsontx)
* [addTx](_governance_proposals_.proposalbuilder.md#addtx)
* [addWeb3Tx](_governance_proposals_.proposalbuilder.md#addweb3tx)
* [build](_governance_proposals_.proposalbuilder.md#build)
* [fromJsonTx](_governance_proposals_.proposalbuilder.md#fromjsontx)
* [fromWeb3tx](_governance_proposals_.proposalbuilder.md#fromweb3tx)

## Constructors

###  constructor

\+ **new ProposalBuilder**(`kit`: [ContractKit](_kit_.contractkit.md), `builders`: Array‹function›, `registryAdditions`: RegistryAdditions): *[ProposalBuilder](_governance_proposals_.proposalbuilder.md)*

*Defined in [packages/contractkit/src/governance/proposals.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L123)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) | - |
`builders` | Array‹function› | [] |
`registryAdditions` | RegistryAdditions | {} |

**Returns:** *[ProposalBuilder](_governance_proposals_.proposalbuilder.md)*

## Methods

###  addJsonTx

▸ **addJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)): *number*

*Defined in [packages/contractkit/src/governance/proposals.ts:213](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L213)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md) |

**Returns:** *number*

___

###  addTx

▸ **addTx**(`tx`: [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹any›, `params`: Partial‹ProposalTxParams›): *void*

*Defined in [packages/contractkit/src/governance/proposals.ts:166](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L166)*

Adds a Celo transaction to the list for proposal construction.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tx` | [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹any› | - | A Celo transaction object to add to the proposal. |
`params` | Partial‹ProposalTxParams› | {} | Optional parameters for how the transaction should be executed.  |

**Returns:** *void*

___

###  addWeb3Tx

▸ **addWeb3Tx**(`tx`: TransactionObject‹any›, `params`: ProposalTxParams): *number*

*Defined in [packages/contractkit/src/governance/proposals.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L158)*

Adds a Web3 transaction to the list for proposal construction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | TransactionObject‹any› | A Web3 transaction object to add to the proposal. |
`params` | ProposalTxParams | Parameters for how the transaction should be executed.  |

**Returns:** *number*

___

###  build

▸ **build**(): *Promise‹object[]›*

*Defined in [packages/contractkit/src/governance/proposals.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L134)*

Build calls all of the added build steps and returns the final proposal.

**Returns:** *Promise‹object[]›*

A constructed Proposal object (i.e. a list of ProposalTransaction)

___

###  fromJsonTx

▸ **fromJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)): *Promise‹object›*

*Defined in [packages/contractkit/src/governance/proposals.ts:176](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L176)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md) |

**Returns:** *Promise‹object›*

___

###  fromWeb3tx

▸ **fromWeb3tx**(`tx`: TransactionObject‹any›, `params`: ProposalTxParams): *[ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)*

*Defined in [packages/contractkit/src/governance/proposals.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L147)*

Converts a Web3 transaction into a proposal transaction object.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | TransactionObject‹any› | A Web3 transaction object to convert. |
`params` | ProposalTxParams | Parameters for how the transaction should be executed.  |

**Returns:** *[ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)*
