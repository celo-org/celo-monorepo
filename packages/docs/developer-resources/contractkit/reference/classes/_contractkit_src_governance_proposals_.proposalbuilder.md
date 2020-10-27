# Class: ProposalBuilder

Builder class to construct proposals from JSON or transaction objects.

## Hierarchy

* **ProposalBuilder**

## Index

### Constructors

* [constructor](_contractkit_src_governance_proposals_.proposalbuilder.md#constructor)

### Methods

* [addJsonTx](_contractkit_src_governance_proposals_.proposalbuilder.md#addjsontx)
* [addTx](_contractkit_src_governance_proposals_.proposalbuilder.md#addtx)
* [addWeb3Tx](_contractkit_src_governance_proposals_.proposalbuilder.md#addweb3tx)
* [build](_contractkit_src_governance_proposals_.proposalbuilder.md#build)
* [fromJsonTx](_contractkit_src_governance_proposals_.proposalbuilder.md#fromjsontx)
* [fromWeb3tx](_contractkit_src_governance_proposals_.proposalbuilder.md#fromweb3tx)

## Constructors

###  constructor

\+ **new ProposalBuilder**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `builders`: Array‹function›, `registryAdditions`: RegistryAdditions): *[ProposalBuilder](_contractkit_src_governance_proposals_.proposalbuilder.md)*

*Defined in [packages/contractkit/src/governance/proposals.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L93)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) | - |
`builders` | Array‹function› | [] |
`registryAdditions` | RegistryAdditions | {} |

**Returns:** *[ProposalBuilder](_contractkit_src_governance_proposals_.proposalbuilder.md)*

## Methods

###  addJsonTx

▸ **addJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_contractkit_src_governance_proposals_.proposaltransactionjson.md)): *number*

*Defined in [packages/contractkit/src/governance/proposals.ts:183](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L183)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_contractkit_src_governance_proposals_.proposaltransactionjson.md) |

**Returns:** *number*

___

###  addTx

▸ **addTx**(`tx`: [CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹any›, `params`: Partial‹ProposalTxParams›): *void*

*Defined in [packages/contractkit/src/governance/proposals.ts:136](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L136)*

Adds a Celo transaction to the list for proposal construction.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tx` | [CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹any› | - | A Celo transaction object to add to the proposal. |
`params` | Partial‹ProposalTxParams› | {} | Optional parameters for how the transaction should be executed.  |

**Returns:** *void*

___

###  addWeb3Tx

▸ **addWeb3Tx**(`tx`: TransactionObject‹any›, `params`: ProposalTxParams): *number*

*Defined in [packages/contractkit/src/governance/proposals.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L128)*

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

*Defined in [packages/contractkit/src/governance/proposals.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L104)*

Build calls all of the added build steps and returns the final proposal.

**Returns:** *Promise‹object[]›*

A constructed Proposal object (i.e. a list of ProposalTransaction)

___

###  fromJsonTx

▸ **fromJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_contractkit_src_governance_proposals_.proposaltransactionjson.md)): *Promise‹object›*

*Defined in [packages/contractkit/src/governance/proposals.ts:146](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L146)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_contractkit_src_governance_proposals_.proposaltransactionjson.md) |

**Returns:** *Promise‹object›*

___

###  fromWeb3tx

▸ **fromWeb3tx**(`tx`: TransactionObject‹any›, `params`: ProposalTxParams): *[ProposalTransaction](../modules/_contractkit_src_wrappers_governance_.md#proposaltransaction)*

*Defined in [packages/contractkit/src/governance/proposals.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L117)*

Converts a Web3 transaction into a proposal transaction object.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | TransactionObject‹any› | A Web3 transaction object to convert. |
`params` | ProposalTxParams | Parameters for how the transaction should be executed.  |

**Returns:** *[ProposalTransaction](../modules/_contractkit_src_wrappers_governance_.md#proposaltransaction)*
