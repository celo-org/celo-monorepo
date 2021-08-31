# kit

## Index

### Classes

* [ContractKit]()

### Interfaces

* [NetworkConfig]()

### Functions

* [newKit](_kit_.md#newkit)
* [newKitFromWeb3](_kit_.md#newkitfromweb3)

## Functions

### newKit

▸ **newKit**\(`url`: string, `wallet?`: ReadOnlyWallet\): [_ContractKit_]()_‹›_

_Defined in_ [_contractkit/src/kit.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L37)

Creates a new instance of `ContractKit` give a nodeUrl

**`optional`** wallet to reuse or add a wallet different that the default \(example ledger-wallet\)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `url` | string | CeloBlockchain node url |
| `wallet?` | ReadOnlyWallet | - |

**Returns:** [_ContractKit_]()_‹›_

### newKitFromWeb3

▸ **newKitFromWeb3**\(`web3`: Web3, `wallet`: ReadOnlyWallet\): [_ContractKit_]()_‹›_

_Defined in_ [_contractkit/src/kit.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L48)

Creates a new instance of the `ContractKit` with a web3 instance

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `web3` | Web3 | - | Web3 instance |
| `wallet` | ReadOnlyWallet | new LocalWallet\(\) | - |

**Returns:** [_ContractKit_]()_‹›_

