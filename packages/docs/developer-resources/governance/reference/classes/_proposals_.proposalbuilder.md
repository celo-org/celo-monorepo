# Class: ProposalBuilder

Builder class to construct proposals from JSON or transaction objects.

## Hierarchy

* **ProposalBuilder**

## Index

### Constructors

* [constructor](_proposals_.proposalbuilder.md#constructor)

### Methods

* [addJsonTx](_proposals_.proposalbuilder.md#addjsontx)
* [addProxyRepointingTx](_proposals_.proposalbuilder.md#addproxyrepointingtx)
* [addTx](_proposals_.proposalbuilder.md#addtx)
* [addWeb3Tx](_proposals_.proposalbuilder.md#addweb3tx)
* [build](_proposals_.proposalbuilder.md#build)
* [fromJsonTx](_proposals_.proposalbuilder.md#fromjsontx)
* [fromWeb3tx](_proposals_.proposalbuilder.md#fromweb3tx)

## Constructors

###  constructor

\+ **new ProposalBuilder**(`kit`: ContractKit, `builders`: Array‹function›, `registryAdditions`: RegistryAdditions): *[ProposalBuilder](_proposals_.proposalbuilder.md)*

*Defined in [proposals.ts:136](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L136)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`kit` | ContractKit | - |
`builders` | Array‹function› | [] |
`registryAdditions` | RegistryAdditions | {} |

**Returns:** *[ProposalBuilder](_proposals_.proposalbuilder.md)*

## Methods

###  addJsonTx

▸ **addJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)): *number*

*Defined in [proposals.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L243)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** *number*

___

###  addProxyRepointingTx

▸ **addProxyRepointingTx**(`contract`: CeloContract, `newImplementationAddress`: string): *void*

*Defined in [proposals.ts:171](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L171)*

Adds a transaction to set the implementation on a proxy to the given address.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`contract` | CeloContract | Celo contract name of the proxy which should have its implementation set. |
`newImplementationAddress` | string | Address of the new contract implementation.  |

**Returns:** *void*

___

###  addTx

▸ **addTx**(`tx`: CeloTransactionObject‹any›, `params`: Partial‹ProposalTxParams›): *void*

*Defined in [proposals.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L197)*

Adds a Celo transaction to the list for proposal construction.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tx` | CeloTransactionObject‹any› | - | A Celo transaction object to add to the proposal. |
`params` | Partial‹ProposalTxParams› | {} | Optional parameters for how the transaction should be executed.  |

**Returns:** *void*

___

###  addWeb3Tx

▸ **addWeb3Tx**(`tx`: CeloTxObject‹any›, `params`: ProposalTxParams): *number*

*Defined in [proposals.ts:189](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L189)*

Adds a Web3 transaction to the list for proposal construction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | CeloTxObject‹any› | A Web3 transaction object to add to the proposal. |
`params` | ProposalTxParams | Parameters for how the transaction should be executed.  |

**Returns:** *number*

___

###  build

▸ **build**(): *Promise‹Pick‹CeloTxPending, "to" | "input" | "value"›[]›*

*Defined in [proposals.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L147)*

Build calls all of the added build steps and returns the final proposal.

**Returns:** *Promise‹Pick‹CeloTxPending, "to" | "input" | "value"›[]›*

A constructed Proposal object (i.e. a list of ProposalTransaction)

___

###  fromJsonTx

▸ **fromJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)): *Promise‹Pick‹CeloTxPending, "to" | "input" | "value"››*

*Defined in [proposals.ts:207](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L207)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** *Promise‹Pick‹CeloTxPending, "to" | "input" | "value"››*

___

###  fromWeb3tx

▸ **fromWeb3tx**(`tx`: CeloTxObject‹any›, `params`: ProposalTxParams): *ProposalTransaction*

*Defined in [proposals.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L160)*

Converts a Web3 transaction into a proposal transaction object.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | CeloTxObject‹any› | A Web3 transaction object to convert. |
`params` | ProposalTxParams | Parameters for how the transaction should be executed.  |

**Returns:** *ProposalTransaction*
