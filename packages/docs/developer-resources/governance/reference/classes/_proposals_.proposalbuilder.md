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
* [getRegistryAddition](_proposals_.proposalbuilder.md#getregistryaddition)
* [isRegistered](_proposals_.proposalbuilder.md#isregistered)
* [setRegistryAddition](_proposals_.proposalbuilder.md#setregistryaddition)

## Constructors

###  constructor

\+ **new ProposalBuilder**(`kit`: ContractKit, `builders`: Array‹function›, `registryAdditions`: RegistryAdditions): *[ProposalBuilder](_proposals_.proposalbuilder.md)*

*Defined in [proposals.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L147)*

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

*Defined in [proposals.ts:275](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L275)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** *number*

___

###  addProxyRepointingTx

▸ **addProxyRepointingTx**(`contract`: CeloContract, `newImplementationAddress`: string): *void*

*Defined in [proposals.ts:182](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L182)*

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

*Defined in [proposals.ts:208](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L208)*

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

*Defined in [proposals.ts:200](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L200)*

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

*Defined in [proposals.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L158)*

Build calls all of the added build steps and returns the final proposal.

**Returns:** *Promise‹Pick‹CeloTxPending, "to" | "input" | "value"›[]›*

A constructed Proposal object (i.e. a list of ProposalTransaction)

___

###  fromJsonTx

▸ **fromJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)): *Promise‹ProposalTransaction›*

*Defined in [proposals.ts:228](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L228)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** *Promise‹ProposalTransaction›*

___

###  fromWeb3tx

▸ **fromWeb3tx**(`tx`: CeloTxObject‹any›, `params`: ProposalTxParams): *ProposalTransaction*

*Defined in [proposals.ts:171](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L171)*

Converts a Web3 transaction into a proposal transaction object.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | CeloTxObject‹any› | A Web3 transaction object to convert. |
`params` | ProposalTxParams | Parameters for how the transaction should be executed.  |

**Returns:** *ProposalTransaction*

___

###  getRegistryAddition

▸ **getRegistryAddition**(`contract`: CeloContract): *string | undefined*

*Defined in [proposals.ts:221](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L221)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | CeloContract |

**Returns:** *string | undefined*

___

###  isRegistered

▸ **isRegistered**(`contract`: CeloContract): *boolean*

*Defined in [proposals.ts:224](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L224)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | CeloContract |

**Returns:** *boolean*

___

###  setRegistryAddition

▸ **setRegistryAddition**(`contract`: CeloContract, `address`: string): *string*

*Defined in [proposals.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L218)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | CeloContract |
`address` | string |

**Returns:** *string*
