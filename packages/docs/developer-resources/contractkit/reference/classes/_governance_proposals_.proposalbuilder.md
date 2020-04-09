# Class: ProposalBuilder

Builder class to construct proposals from JSON or transaction objects.

## Hierarchy

* **ProposalBuilder**

## Index

### Constructors

* [constructor](_governance_proposals_.proposalbuilder.md#constructor)

### Methods

* [addJsonTx](_governance_proposals_.proposalbuilder.md#addjsontx)
* [addProxyRepointingTx](_governance_proposals_.proposalbuilder.md#addproxyrepointingtx)
* [addTx](_governance_proposals_.proposalbuilder.md#addtx)
* [addWeb3Tx](_governance_proposals_.proposalbuilder.md#addweb3tx)
* [build](_governance_proposals_.proposalbuilder.md#build)
* [fromWeb3tx](_governance_proposals_.proposalbuilder.md#fromweb3tx)

## Constructors

###  constructor

\+ **new ProposalBuilder**(`kit`: [ContractKit](_kit_.contractkit.md), `builders`: Array‹function›): *[ProposalBuilder](_governance_proposals_.proposalbuilder.md)*

*Defined in [contractkit/src/governance/proposals.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L74)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) | - |
`builders` | Array‹function› | [] |

**Returns:** *[ProposalBuilder](_governance_proposals_.proposalbuilder.md)*

## Methods

###  addJsonTx

▸ **addJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)): *number*

*Defined in [contractkit/src/governance/proposals.ts:139](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L139)*

Adds a JSON encoded proposal transaction to the builder list.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md) | A JSON encoded proposal transaction.  |

**Returns:** *number*

___

###  addProxyRepointingTx

▸ **addProxyRepointingTx**(`contract`: [CeloContract](../enums/_base_.celocontract.md), `newImplementationAddress`: string): *void*

*Defined in [contractkit/src/governance/proposals.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L102)*

Adds a transaction to set the implementation on a proxy to the given address.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) | Celo contract name of the proxy which should have its implementation set. |
`newImplementationAddress` | string | Address of the new contract implementation.  |

**Returns:** *void*

___

###  addTx

▸ **addTx**(`tx`: [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹any›, `params`: Partial‹ProposalTxParams›): *void*

*Defined in [contractkit/src/governance/proposals.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L125)*

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

*Defined in [contractkit/src/governance/proposals.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L117)*

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

*Defined in [contractkit/src/governance/proposals.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L84)*

Build calls all of the added build steps and returns the final proposal.

**Returns:** *Promise‹object[]›*

A constructed Proposal object (i.e. a list of ProposalTransaction)

___

###  fromWeb3tx

▸ **fromWeb3tx**(`tx`: TransactionObject‹any›, `params`: ProposalTxParams): *[ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)*

*Defined in [contractkit/src/governance/proposals.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L91)*

Converts a Web3 transaction into a proposal transaction object.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | TransactionObject‹any› | A Web3 transaction object to convert. |
`params` | ProposalTxParams | Parameters for how the transaction should be executed.  |

**Returns:** *[ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)*
