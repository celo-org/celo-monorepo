[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["mini-kit"](../modules/_mini_kit_.md) › [MiniContractKit](_mini_kit_.minicontractkit.md)

# Class: MiniContractKit

MiniContractKit provides a core subset of [ContractKit](../modules/_mini_kit_.md#const-contractkit)'s functionality

**`remarks`** 

It is recommended to use this over ContractKit for dApps as it is lighter

**`param`** – an instance of @celo/connect {@link Connection}

## Hierarchy

* **MiniContractKit**

## Index

### Constructors

* [constructor](_mini_kit_.minicontractkit.md#constructor)

### Properties

* [celoTokens](_mini_kit_.minicontractkit.md#readonly-celotokens)
* [connection](_mini_kit_.minicontractkit.md#readonly-connection)
* [contracts](_mini_kit_.minicontractkit.md#readonly-contracts)
* [registry](_mini_kit_.minicontractkit.md#readonly-registry)

### Methods

* [getTotalBalance](_mini_kit_.minicontractkit.md#gettotalbalance)
* [getWallet](_mini_kit_.minicontractkit.md#getwallet)

## Constructors

###  constructor

\+ **new MiniContractKit**(`connection`: Connection): *[MiniContractKit](_mini_kit_.minicontractkit.md)*

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |

**Returns:** *[MiniContractKit](_mini_kit_.minicontractkit.md)*

## Properties

### `Readonly` celoTokens

• **celoTokens**: *[CeloTokens](_celo_tokens_.celotokens.md)*

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L61)*

helper for interacting with CELO & stable tokens

___

### `Readonly` connection

• **connection**: *Connection*

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L63)*

___

### `Readonly` contracts

• **contracts**: *[MiniContractCache](_mini_contract_cache_.minicontractcache.md)*

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L59)*

factory for subset of core contract's kit wrappers

___

### `Readonly` registry

• **registry**: *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L57)*

core contract's address registry

## Methods

###  getTotalBalance

▸ **getTotalBalance**(`address`: string): *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹BigNumber››*

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹[EachCeloToken](../modules/_celo_tokens_.md#eachcelotoken)‹BigNumber››*

___

###  getWallet

▸ **getWallet**(): *undefined | ReadOnlyWallet*

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L69)*

**Returns:** *undefined | ReadOnlyWallet*
