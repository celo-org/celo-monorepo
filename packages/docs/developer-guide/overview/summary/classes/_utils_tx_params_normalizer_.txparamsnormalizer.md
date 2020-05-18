# TxParamsNormalizer

## Hierarchy

* **TxParamsNormalizer**

## Index

### Constructors

* [constructor](_utils_tx_params_normalizer_.txparamsnormalizer.md#constructor)

### Properties

* [rpcCaller](_utils_tx_params_normalizer_.txparamsnormalizer.md#rpccaller)

### Methods

* [populate](_utils_tx_params_normalizer_.txparamsnormalizer.md#populate)

## Constructors

### constructor

+ **new TxParamsNormalizer**\(`rpcCaller`: [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)\): [_TxParamsNormalizer_](_utils_tx_params_normalizer_.txparamsnormalizer.md)

_Defined in_ [_contractkit/src/utils/tx-params-normalizer.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-params-normalizer.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `rpcCaller` | [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md) |

**Returns:** [_TxParamsNormalizer_](_utils_tx_params_normalizer_.txparamsnormalizer.md)

## Properties

### rpcCaller

• **rpcCaller**: [_RpcCaller_](../interfaces/_utils_rpc_caller_.rpccaller.md)

_Defined in_ [_contractkit/src/utils/tx-params-normalizer.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-params-normalizer.ts#L19)

## Methods

### populate

▸ **populate**\(`celoTxParams`: Tx\): _Promise‹Tx›_

_Defined in_ [_contractkit/src/utils/tx-params-normalizer.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-params-normalizer.ts#L21)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `celoTxParams` | Tx |

**Returns:** _Promise‹Tx›_

