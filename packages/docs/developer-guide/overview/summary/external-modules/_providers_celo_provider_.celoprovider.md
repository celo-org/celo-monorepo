# CeloProvider

## Hierarchy

* **CeloProvider**

## Index

### Constructors

* [constructor](../classes/_providers_celo_provider_.celoprovider.md#constructor)

### Properties

* [existingProvider](../classes/_providers_celo_provider_.celoprovider.md#existingprovider)
* [wallet](../classes/_providers_celo_provider_.celoprovider.md#wallet)

### Accessors

* [connected](../classes/_providers_celo_provider_.celoprovider.md#connected)

### Methods

* [addAccount](../classes/_providers_celo_provider_.celoprovider.md#addaccount)
* [getAccounts](../classes/_providers_celo_provider_.celoprovider.md#getaccounts)
* [isLocalAccount](../classes/_providers_celo_provider_.celoprovider.md#islocalaccount)
* [send](../classes/_providers_celo_provider_.celoprovider.md#send)
* [stop](../classes/_providers_celo_provider_.celoprovider.md#stop)
* [supportsSubscriptions](../classes/_providers_celo_provider_.celoprovider.md#supportssubscriptions)

## Constructors

### constructor

+ **new CeloProvider**\(`existingProvider`: provider, `wallet`: [Wallet](../interfaces/_wallets_wallet_.wallet.md)\): [_CeloProvider_](../classes/_providers_celo_provider_.celoprovider.md)

_Defined in_ [_contractkit/src/providers/celo-provider.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L27)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `existingProvider` | provider | - |
| `wallet` | [Wallet](../interfaces/_wallets_wallet_.wallet.md) | new LocalWallet\(\) |

**Returns:** [_CeloProvider_](../classes/_providers_celo_provider_.celoprovider.md)

## Properties

### existingProvider

• **existingProvider**: _provider_

_Defined in_ [_contractkit/src/providers/celo-provider.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L29)

### wallet

• **wallet**: [_Wallet_](../interfaces/_wallets_wallet_.wallet.md)

_Defined in_ [_contractkit/src/providers/celo-provider.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L27)

## Accessors

### connected

• **get connected**\(\): _any_

_Defined in_ [_contractkit/src/providers/celo-provider.ts:229_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L229)

**Returns:** _any_

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string\): _void_

_Defined in_ [_contractkit/src/providers/celo-provider.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L37)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _void_

### getAccounts

▸ **getAccounts**\(\): _Promise‹string\[\]›_

_Defined in_ [_contractkit/src/providers/celo-provider.ts:45_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L45)

**Returns:** _Promise‹string\[\]›_

### isLocalAccount

▸ **isLocalAccount**\(`address?`: undefined \| string\): _boolean_

_Defined in_ [_contractkit/src/providers/celo-provider.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L51)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | undefined \| string |

**Returns:** _boolean_

### send

▸ **send**\(`payload`: JsonRpcPayload, `callback`: Callback‹JsonRpcResponse›\): _void_

_Defined in_ [_contractkit/src/providers/celo-provider.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L58)

Send method as expected by web3.js

**Parameters:**

| Name | Type |
| :--- | :--- |
| `payload` | JsonRpcPayload |
| `callback` | Callback‹JsonRpcResponse› |

**Returns:** _void_

### stop

▸ **stop**\(\): _void_

_Defined in_ [_contractkit/src/providers/celo-provider.ts:136_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L136)

**Returns:** _void_

### supportsSubscriptions

▸ **supportsSubscriptions**\(\): _any_

_Defined in_ [_contractkit/src/providers/celo-provider.ts:233_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L233)

**Returns:** _any_

