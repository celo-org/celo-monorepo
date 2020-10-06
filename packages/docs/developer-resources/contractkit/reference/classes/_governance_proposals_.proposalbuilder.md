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
* [fromJsonTx](_governance_proposals_.proposalbuilder.md#fromjsontx)
* [fromWeb3tx](_governance_proposals_.proposalbuilder.md#fromweb3tx)

## Constructors

###  constructor

\+ **new ProposalBuilder**(`kit`: [ContractKit](_kit_.contractkit.md), `builders`: Array‹function›): *[ProposalBuilder](_governance_proposals_.proposalbuilder.md)*

*Defined in [packages/contractkit/src/governance/proposals.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L77)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) | - |
`builders` | Array‹function› | [] |

**Returns:** *[ProposalBuilder](_governance_proposals_.proposalbuilder.md)*

## Methods

###  addJsonTx

▸ **addJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)): *number*

*Defined in [packages/contractkit/src/governance/proposals.ts:153](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L153)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md) |

**Returns:** *number*

___

###  addProxyRepointingTx

▸ **addProxyRepointingTx**(`contract`: [CeloContract](../enums/_base_.celocontract.md), `newImplementationAddress`: string): *void*

*Defined in [packages/contractkit/src/governance/proposals.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L105)*

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

*Defined in [packages/contractkit/src/governance/proposals.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L128)*

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

*Defined in [packages/contractkit/src/governance/proposals.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L120)*

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

*Defined in [packages/contractkit/src/governance/proposals.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L87)*

Build calls all of the added build steps and returns the final proposal.

**Returns:** *Promise‹object[]›*

A constructed Proposal object (i.e. a list of ProposalTransaction)

___

###  fromJsonTx

▸ **fromJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)): *Promise‹object›*

*Defined in [packages/contractkit/src/governance/proposals.ts:138](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L138)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md) |

**Returns:** *Promise‹object›*

___

###  fromWeb3tx

▸ **fromWeb3tx**(`tx`: TransactionObject‹any›, `params`: ProposalTxParams): *[ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)*

*Defined in [packages/contractkit/src/governance/proposals.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L94)*

Converts a Web3 transaction into a proposal transaction object.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | TransactionObject‹any› | A Web3 transaction object to convert. |
`params` | ProposalTxParams | Parameters for how the transaction should be executed.  |

**Returns:** *[ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)*
