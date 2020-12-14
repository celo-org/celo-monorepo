# ProposalBuilder

Builder class to construct proposals from JSON or transaction objects.

## Hierarchy

* **ProposalBuilder**

## Index

### Constructors

* [constructor]()

### Methods

* [addJsonTx]()
* [addTx]()
* [addWeb3Tx]()
* [build]()
* [fromJsonTx]()
* [fromWeb3tx]()

## Constructors

### constructor

+ **new ProposalBuilder**\(`kit`: [ContractKit](), `builders`: Array‹function›, `registryAdditions`: RegistryAdditions\): [_ProposalBuilder_]()

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:123_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L123)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `kit` | [ContractKit]() | - |
| `builders` | Array‹function› | \[\] |
| `registryAdditions` | RegistryAdditions | {} |

**Returns:** [_ProposalBuilder_]()

## Methods

### addJsonTx

▸ **addJsonTx**\(`tx`: [ProposalTransactionJSON]()\): _number_

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:213_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L213)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [ProposalTransactionJSON]() |

**Returns:** _number_

### addTx

▸ **addTx**\(`tx`: [CeloTransactionObject]()‹any›, `params`: Partial‹ProposalTxParams›\): _void_

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:166_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L166)

Adds a Celo transaction to the list for proposal construction.

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `tx` | [CeloTransactionObject]()‹any› | - | A Celo transaction object to add to the proposal. |
| `params` | Partial‹ProposalTxParams› | {} | Optional parameters for how the transaction should be executed. |

**Returns:** _void_

### addWeb3Tx

▸ **addWeb3Tx**\(`tx`: TransactionObject‹any›, `params`: ProposalTxParams\): _number_

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:158_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L158)

Adds a Web3 transaction to the list for proposal construction.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | TransactionObject‹any› | A Web3 transaction object to add to the proposal. |
| `params` | ProposalTxParams | Parameters for how the transaction should be executed. |

**Returns:** _number_

### build

▸ **build**\(\): _Promise‹Pick‹Transaction, "to" \| "value" \| "input"›\[\]›_

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:134_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L134)

Build calls all of the added build steps and returns the final proposal.

**Returns:** _Promise‹Pick‹Transaction, "to" \| "value" \| "input"›\[\]›_

A constructed Proposal object \(i.e. a list of ProposalTransaction\)

### fromJsonTx

▸ **fromJsonTx**\(`tx`: [ProposalTransactionJSON]()\): _Promise‹Pick‹Transaction, "to" \| "value" \| "input"››_

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:176_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L176)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | [ProposalTransactionJSON]() |

**Returns:** _Promise‹Pick‹Transaction, "to" \| "value" \| "input"››_

### fromWeb3tx

▸ **fromWeb3tx**\(`tx`: TransactionObject‹any›, `params`: ProposalTxParams\): [_ProposalTransaction_](_wrappers_governance_.md#proposaltransaction)

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:147_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L147)

Converts a Web3 transaction into a proposal transaction object.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tx` | TransactionObject‹any› | A Web3 transaction object to convert. |
| `params` | ProposalTxParams | Parameters for how the transaction should be executed. |

**Returns:** [_ProposalTransaction_](_wrappers_governance_.md#proposaltransaction)

