# TxParamsNormalizer

## Hierarchy

* **TxParamsNormalizer**

## Index

### Constructors

* [constructor](_utils_tx_params_normalizer_.txparamsnormalizer.md#constructor)

### Properties

* [connection](_utils_tx_params_normalizer_.txparamsnormalizer.md#readonly-connection)

### Methods

* [populate](_utils_tx_params_normalizer_.txparamsnormalizer.md#populate)

## Constructors

### constructor

+ **new TxParamsNormalizer**\(`connection`: [Connection](_connection_.connection.md)\): [_TxParamsNormalizer_](_utils_tx_params_normalizer_.txparamsnormalizer.md)

_Defined in_ [_packages/sdk/connect/src/utils/tx-params-normalizer.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-params-normalizer.ts#L16)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `connection` | [Connection](_connection_.connection.md) |

**Returns:** [_TxParamsNormalizer_](_utils_tx_params_normalizer_.txparamsnormalizer.md)

## Properties

### `Readonly` connection

• **connection**: [_Connection_](_connection_.connection.md)

_Defined in_ [_packages/sdk/connect/src/utils/tx-params-normalizer.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-params-normalizer.ts#L18)

## Methods

### populate

▸ **populate**\(`celoTxParams`: [CeloTx](../modules/_types_.md#celotx)\): _Promise‹_[_CeloTx_](../modules/_types_.md#celotx)_›_

_Defined in_ [_packages/sdk/connect/src/utils/tx-params-normalizer.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-params-normalizer.ts#L20)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `celoTxParams` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** _Promise‹_[_CeloTx_](../modules/_types_.md#celotx)_›_

