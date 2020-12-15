# Class: TxParamsNormalizer

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

###  constructor

\+ **new TxParamsNormalizer**(`connection`: [Connection](_connection_.connection.md)): *[TxParamsNormalizer](_utils_tx_params_normalizer_.txparamsnormalizer.md)*

*Defined in [packages/sdk/connect/src/utils/tx-params-normalizer.ts:16](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-params-normalizer.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | [Connection](_connection_.connection.md) |

**Returns:** *[TxParamsNormalizer](_utils_tx_params_normalizer_.txparamsnormalizer.md)*

## Properties

### `Readonly` connection

• **connection**: *[Connection](_connection_.connection.md)*

*Defined in [packages/sdk/connect/src/utils/tx-params-normalizer.ts:18](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-params-normalizer.ts#L18)*

## Methods

###  populate

▸ **populate**(`celoTxParams`: [CeloTx](../modules/_types_.md#celotx)): *Promise‹[CeloTx](../modules/_types_.md#celotx)›*

*Defined in [packages/sdk/connect/src/utils/tx-params-normalizer.ts:20](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/connect/src/utils/tx-params-normalizer.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`celoTxParams` | [CeloTx](../modules/_types_.md#celotx) |

**Returns:** *Promise‹[CeloTx](../modules/_types_.md#celotx)›*
