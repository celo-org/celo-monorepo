# Class: ProposalBuilder

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

*Defined in [packages/contractkit/src/governance/proposals.ts:49](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/governance/proposals.ts#L49)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) | - |
`builders` | Array‹function› | [] |

**Returns:** *[ProposalBuilder](_governance_proposals_.proposalbuilder.md)*

## Methods

###  addJsonTx

▸ **addJsonTx**(`tx`: [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md)): *number*

*Defined in [packages/contractkit/src/governance/proposals.ts:82](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/governance/proposals.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | [ProposalTransactionJSON](../interfaces/_governance_proposals_.proposaltransactionjson.md) |

**Returns:** *number*

___

###  addProxyRepointingTx

▸ **addProxyRepointingTx**(`proxyAddress`: string, `newImplementationAddress`: string): *void*

*Defined in [packages/contractkit/src/governance/proposals.ts:63](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/governance/proposals.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`proxyAddress` | string |
`newImplementationAddress` | string |

**Returns:** *void*

___

###  addTx

▸ **addTx**(`tx`: [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹any›, `params`: Partial‹ProposalTxParams›): *void*

*Defined in [packages/contractkit/src/governance/proposals.ts:73](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/governance/proposals.ts#L73)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`tx` | [CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹any› | - |
`params` | Partial‹ProposalTxParams› | {} |

**Returns:** *void*

___

###  addWeb3Tx

▸ **addWeb3Tx**(`tx`: TransactionObject‹any›, `params`: ProposalTxParams): *number*

*Defined in [packages/contractkit/src/governance/proposals.ts:70](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/governance/proposals.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | TransactionObject‹any› |
`params` | ProposalTxParams |

**Returns:** *number*

___

###  build

▸ **build**(): *Promise‹object[]›*

*Defined in [packages/contractkit/src/governance/proposals.ts:55](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/governance/proposals.ts#L55)*

**Returns:** *Promise‹object[]›*

___

###  fromWeb3tx

▸ **fromWeb3tx**(`tx`: TransactionObject‹any›, `params`: ProposalTxParams): *[ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)*

*Defined in [packages/contractkit/src/governance/proposals.ts:57](https://github.com/celo-org/celo-monorepo/blob/6049da1fa/packages/contractkit/src/governance/proposals.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | TransactionObject‹any› |
`params` | ProposalTxParams |

**Returns:** *[ProposalTransaction](../modules/_wrappers_governance_.md#proposaltransaction)*
