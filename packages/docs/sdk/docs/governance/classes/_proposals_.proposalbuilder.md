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
* [buildFunctionCallToExternalContract](_proposals_.proposalbuilder.md#buildfunctioncalltoexternalcontract)
* [fromJsonTx](_proposals_.proposalbuilder.md#fromjsontx)
* [fromWeb3tx](_proposals_.proposalbuilder.md#fromweb3tx)
* [getRegistryAddition](_proposals_.proposalbuilder.md#getregistryaddition)
* [isRegistered](_proposals_.proposalbuilder.md#isregistered)
* [setRegistryAddition](_proposals_.proposalbuilder.md#setregistryaddition)

## Constructors

###  constructor

\+ **new ProposalBuilder**(`kit`: ContractKit, `builders`: Array‹function›, `registryAdditions`: RegistryAdditions): *[ProposalBuilder](_proposals_.proposalbuilder.md)*

*Defined in [proposals.ts:213](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L213)*

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

*Defined in [proposals.ts:217](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L217)*

## Methods

###  addJsonTx

▸ **addJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)): *number*

*Defined in [proposals.ts:346](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L346)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** *number*

___

###  addProxyRepointingTx

▸ **addProxyRepointingTx**(`contract`: CeloContract, `newImplementationAddress`: string): *void*

*Defined in [proposals.ts:248](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L248)*

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

*Defined in [proposals.ts:274](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L274)*

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

*Defined in [proposals.ts:266](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L266)*

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

*Defined in [proposals.ts:224](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L224)*

Build calls all of the added build steps and returns the final proposal.

**Returns:** *Promise‹ProposalTransaction[]›*

A constructed Proposal object (i.e. a list of ProposalTransaction)

___

###  buildFunctionCallToExternalContract

▸ **buildFunctionCallToExternalContract**(`tx`: [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)): *Promise‹ProposalTransaction›*

*Defined in [proposals.ts:294](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L294)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** *Promise‹ProposalTransaction›*

___

###  fromJsonTx

▸ **fromJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)): *Promise‹ProposalTransaction›*

*Defined in [proposals.ts:302](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L302)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** *Promise‹ProposalTransaction›*

___

###  fromWeb3tx

▸ **fromWeb3tx**(`tx`: CeloTxObject‹any›, `params`: ProposalTxParams): *ProposalTransaction*

*Defined in [proposals.ts:237](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L237)*

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

*Defined in [proposals.ts:287](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L287)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | CeloContract |

**Returns:** *string | undefined*

___

###  isRegistered

▸ **isRegistered**(`contract`: CeloContract): *boolean*

*Defined in [proposals.ts:290](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L290)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | CeloContract |

**Returns:** *boolean*

___

###  setRegistryAddition

▸ **setRegistryAddition**(`contract`: CeloContract, `address`: string): *string*

*Defined in [proposals.ts:284](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L284)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | CeloContract |
`address` | string |

**Returns:** *string*
