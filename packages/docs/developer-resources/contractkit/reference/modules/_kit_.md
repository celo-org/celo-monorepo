# External module: "kit"

## Index

### Classes

* [ContractKit](../classes/_kit_.contractkit.md)

### Interfaces

* [KitOptions](../interfaces/_kit_.kitoptions.md)
* [NetworkConfig](../interfaces/_kit_.networkconfig.md)

### Functions

* [newKit](_kit_.md#newkit)
* [newKitFromWeb3](_kit_.md#newkitfromweb3)

## Functions

###  newKit

▸ **newKit**(`url`: string, `wallet?`: [Wallet](../interfaces/_wallets_wallet_.wallet.md)): *[ContractKit](../classes/_kit_.contractkit.md)‹›*

*Defined in [contractkit/src/kit.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L34)*

Creates a new instance of `ContractKit` give a nodeUrl

**`optional`** wallet to reuse or add a wallet different that the default (example ledger-wallet)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | CeloBlockchain node url |
`wallet?` | [Wallet](../interfaces/_wallets_wallet_.wallet.md) | - |

**Returns:** *[ContractKit](../classes/_kit_.contractkit.md)‹›*

___

###  newKitFromWeb3

▸ **newKitFromWeb3**(`web3`: Web3, `wallet?`: [Wallet](../interfaces/_wallets_wallet_.wallet.md)): *[ContractKit](../classes/_kit_.contractkit.md)‹›*

*Defined in [contractkit/src/kit.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L46)*

Creates a new instance of `ContractKit` give a web3 instance

**`optional`** wallet to reuse or add a wallet different that the default (example ledger-wallet)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3` | Web3 | Web3 instance |
`wallet?` | [Wallet](../interfaces/_wallets_wallet_.wallet.md) | - |

**Returns:** *[ContractKit](../classes/_kit_.contractkit.md)‹›*
