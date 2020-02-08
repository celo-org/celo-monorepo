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

▸ **newKit**(`url`: string): *[ContractKit](../classes/_kit_.contractkit.md)‹›*

*Defined in [packages/contractkit/src/kit.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L28)*

Creates a new instance of `ContractKit` give a nodeUrl

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | CeloBlockchain node url  |

**Returns:** *[ContractKit](../classes/_kit_.contractkit.md)‹›*

___

###  newKitFromWeb3

▸ **newKitFromWeb3**(`web3`: Web3): *[ContractKit](../classes/_kit_.contractkit.md)‹›*

*Defined in [packages/contractkit/src/kit.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L36)*

Creates a new instance of `ContractKit` give a web3 instance

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3` | Web3 | Web3 instance  |

**Returns:** *[ContractKit](../classes/_kit_.contractkit.md)‹›*
