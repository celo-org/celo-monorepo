# ProposalBuilder

Builder class to construct proposals from JSON or transaction objects.

## Hierarchy

* **ProposalBuilder**

## Index

### Constructors

* [constructor]()

### Methods

* [addJsonTx]()
* [addProxyRepointingTx]()
* [addTx]()
* [addWeb3Tx]()
* [build]()
* [fromWeb3tx]()

## Constructors

### constructor

+ **new ProposalBuilder**\(`kit`: [ContractKit](), `builders`: Array‹function›\): [_ProposalBuilder_]()

_Defined in_ [_contractkit/src/governance/proposals.ts:74_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L74)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `kit` | [ContractKit]() | - |
| `builders` | Array‹function› | \[\] |

**Returns:** [_ProposalBuilder_]()

## Methods

### addJsonTx

▸ **addJsonTx**\(`tx`: [ProposalTransactionJSON]()\): _number_

_Defined in_ [_contractkit/src/governance/proposals.ts:139_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L139)

Adds a JSON encoded proposal transaction to the builder list.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | [ProposalTransactionJSON]() | A JSON encoded proposal transaction. |

**Returns:** _number_

### addProxyRepointingTx

▸ **addProxyRepointingTx**\(`contract`: [CeloContract](), `newImplementationAddress`: string\): _void_

_Defined in_ [_contractkit/src/governance/proposals.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L102)

Adds a transaction to set the implementation on a proxy to the given address.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `contract` | [CeloContract]() | Celo contract name of the proxy which should have its implementation set. |
| `newImplementationAddress` | string | Address of the new contract implementation. |

**Returns:** _void_

### addTx

▸ **addTx**\(`tx`: [CeloTransactionObject]()‹any›, `params`: Partial‹ProposalTxParams›\): _void_

_Defined in_ [_contractkit/src/governance/proposals.ts:125_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L125)

Adds a Celo transaction to the list for proposal construction.

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `tx` | [CeloTransactionObject]()‹any› | - | A Celo transaction object to add to the proposal. |
| `params` | Partial‹ProposalTxParams› | {} | Optional parameters for how the transaction should be executed. |

**Returns:** _void_

### addWeb3Tx

▸ **addWeb3Tx**\(`tx`: TransactionObject‹any›, `params`: ProposalTxParams\): _number_

_Defined in_ [_contractkit/src/governance/proposals.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L117)

Adds a Web3 transaction to the list for proposal construction.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | TransactionObject‹any› | A Web3 transaction object to add to the proposal. |
| `params` | ProposalTxParams | Parameters for how the transaction should be executed. |

**Returns:** _number_

### build

▸ **build**\(\): _Promise‹object\[\]›_

_Defined in_ [_contractkit/src/governance/proposals.ts:84_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L84)

Build calls all of the added build steps and returns the final proposal.

**Returns:** _Promise‹object\[\]›_

A constructed Proposal object \(i.e. a list of ProposalTransaction\)

### fromWeb3tx

▸ **fromWeb3tx**\(`tx`: TransactionObject‹any›, `params`: ProposalTxParams\): [_ProposalTransaction_](_wrappers_governance_.md#proposaltransaction)

_Defined in_ [_contractkit/src/governance/proposals.ts:91_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L91)

Converts a Web3 transaction into a proposal transaction object.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | TransactionObject‹any› | A Web3 transaction object to convert. |
| `params` | ProposalTxParams | Parameters for how the transaction should be executed. |

**Returns:** [_ProposalTransaction_](_wrappers_governance_.md#proposaltransaction)

