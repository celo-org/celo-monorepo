# kit

## Index

### Classes

* [ContractKit]()

### Interfaces

* [KitOptions]()
* [NetworkConfig]()

### Functions

* [newKit](_kit_.md#newkit)
* [newKitFromWeb3](_kit_.md#newkitfromweb3)

## Functions

### newKit

▸ **newKit**\(`url`: string, `wallet?`: [Wallet]()\): [_ContractKit_]()_‹›_

_Defined in_ [_contractkit/src/kit.ts:34_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L34)

Creates a new instance of `ContractKit` give a nodeUrl

**`optional`** wallet to reuse or add a wallet different that the default \(example ledger-wallet\)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `url` | string | CeloBlockchain node url |
| `wallet?` | [Wallet]() | - |

**Returns:** [_ContractKit_]()_‹›_

### newKitFromWeb3

▸ **newKitFromWeb3**\(`web3`: Web3, `wallet?`: [Wallet]()\): [_ContractKit_]()_‹›_

_Defined in_ [_contractkit/src/kit.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L46)

Creates a new instance of `ContractKit` give a web3 instance

**`optional`** wallet to reuse or add a wallet different that the default \(example ledger-wallet\)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `web3` | Web3 | Web3 instance |
| `wallet?` | [Wallet]() | - |

**Returns:** [_ContractKit_]()_‹›_

