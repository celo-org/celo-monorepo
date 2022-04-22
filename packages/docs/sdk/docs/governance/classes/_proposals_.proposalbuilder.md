[@celo/governance](../README.md) › ["proposals"](../modules/_proposals_.md) › [ProposalBuilder](_proposals_.proposalbuilder.md)

# Class: ProposalBuilder

Builder class to construct proposals from JSON or transaction objects.

## Hierarchy

* **ProposalBuilder**

## Index

### Constructors

* [constructor](_proposals_.proposalbuilder.md#constructor)

### Properties

* [registryAdditions](_proposals_.proposalbuilder.md#readonly-registryadditions)

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

*Defined in [proposals.ts:212](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L212)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`kit` | ContractKit | - |
`builders` | Array‹function› | [] |
`registryAdditions` | RegistryAdditions | {} |

**Returns:** *[ProposalBuilder](_proposals_.proposalbuilder.md)*

## Properties

### `Readonly` registryAdditions

• **registryAdditions**: *RegistryAdditions*

*Defined in [proposals.ts:216](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L216)*

## Methods

###  addJsonTx

▸ **addJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)): *number*

*Defined in [proposals.ts:339](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L339)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** *number*

___

###  addProxyRepointingTx

▸ **addProxyRepointingTx**(`contract`: CeloContract, `newImplementationAddress`: string): *void*

*Defined in [proposals.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L247)*

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

*Defined in [proposals.ts:273](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L273)*

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

*Defined in [proposals.ts:265](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L265)*

Adds a Web3 transaction to the list for proposal construction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tx` | CeloTxObject‹any› | A Web3 transaction object to add to the proposal. |
`params` | ProposalTxParams | Parameters for how the transaction should be executed.  |

**Returns:** *number*

___

###  build

▸ **build**(): *Promise‹ProposalTransaction[]›*

*Defined in [proposals.ts:223](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L223)*

Build calls all of the added build steps and returns the final proposal.

**Returns:** *Promise‹ProposalTransaction[]›*

A constructed Proposal object (i.e. a list of ProposalTransaction)

___

###  fromJsonTx

▸ **fromJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)): *Promise‹ProposalTransaction›*

*Defined in [proposals.ts:293](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L293)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** *Promise‹ProposalTransaction›*

___

###  fromWeb3tx

▸ **fromWeb3tx**(`tx`: CeloTxObject‹any›, `params`: ProposalTxParams): *ProposalTransaction*

*Defined in [proposals.ts:236](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L236)*

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

*Defined in [proposals.ts:286](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L286)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | CeloContract |

**Returns:** *string | undefined*

___

###  isRegistered

▸ **isRegistered**(`contract`: CeloContract): *boolean*

*Defined in [proposals.ts:289](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L289)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | CeloContract |

**Returns:** *boolean*

___

###  setRegistryAddition

▸ **setRegistryAddition**(`contract`: CeloContract, `address`: string): *string*

*Defined in [proposals.ts:283](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L283)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | CeloContract |
`address` | string |

**Returns:** *string*
