# ProposalBuilder

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

### constructor

+ **new ProposalBuilder**\(`kit`: ContractKit, `builders`: Array‹function›, `registryAdditions`: RegistryAdditions\): [_ProposalBuilder_](_proposals_.proposalbuilder.md)

_Defined in_ [_proposals.ts:136_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L136)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `kit` | ContractKit | - |
| `builders` | Array‹function› | \[\] |
| `registryAdditions` | RegistryAdditions | {} |

**Returns:** [_ProposalBuilder_](_proposals_.proposalbuilder.md)

## Methods

### addJsonTx

▸ **addJsonTx**\(`tx`: [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)\): _number_

_Defined in_ [_proposals.ts:243_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L243)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** _number_

### addProxyRepointingTx

▸ **addProxyRepointingTx**\(`contract`: CeloContract, `newImplementationAddress`: string\): _void_

_Defined in_ [_proposals.ts:171_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L171)

Adds a transaction to set the implementation on a proxy to the given address.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `contract` | CeloContract | Celo contract name of the proxy which should have its implementation set. |
| `newImplementationAddress` | string | Address of the new contract implementation. |

**Returns:** _void_

### addTx

▸ **addTx**\(`tx`: CeloTransactionObject‹any›, `params`: Partial‹ProposalTxParams›\): _void_

_Defined in_ [_proposals.ts:197_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L197)

Adds a Celo transaction to the list for proposal construction.

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `tx` | CeloTransactionObject‹any› | - | A Celo transaction object to add to the proposal. |
| `params` | Partial‹ProposalTxParams› | {} | Optional parameters for how the transaction should be executed. |

**Returns:** _void_

### addWeb3Tx

▸ **addWeb3Tx**\(`tx`: CeloTxObject‹any›, `params`: ProposalTxParams\): _number_

_Defined in_ [_proposals.ts:189_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L189)

Adds a Web3 transaction to the list for proposal construction.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | CeloTxObject‹any› | A Web3 transaction object to add to the proposal. |
| `params` | ProposalTxParams | Parameters for how the transaction should be executed. |

**Returns:** _number_

### build

▸ **build**\(\): _Promise‹Pick‹CeloTxPending, "to" \| "input" \| "value"›\[\]›_

_Defined in_ [_proposals.ts:147_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L147)

Build calls all of the added build steps and returns the final proposal.

**Returns:** _Promise‹Pick‹CeloTxPending, "to" \| "input" \| "value"›\[\]›_

A constructed Proposal object \(i.e. a list of ProposalTransaction\)

### fromJsonTx

▸ **fromJsonTx**\(`tx`: [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md)\): _Promise‹Pick‹CeloTxPending, "to" \| "input" \| "value"››_

_Defined in_ [_proposals.ts:207_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L207)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [ProposalTransactionJSON](../interfaces/_proposals_.proposaltransactionjson.md) |

**Returns:** _Promise‹Pick‹CeloTxPending, "to" \| "input" \| "value"››_

### fromWeb3tx

▸ **fromWeb3tx**\(`tx`: CeloTxObject‹any›, `params`: ProposalTxParams\): _ProposalTransaction_

_Defined in_ [_proposals.ts:160_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L160)

Converts a Web3 transaction into a proposal transaction object.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | CeloTxObject‹any› | A Web3 transaction object to convert. |
| `params` | ProposalTxParams | Parameters for how the transaction should be executed. |

**Returns:** _ProposalTransaction_

