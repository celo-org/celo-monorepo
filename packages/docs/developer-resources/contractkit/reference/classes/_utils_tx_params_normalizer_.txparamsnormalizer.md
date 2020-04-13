# Class: TxParamsNormalizer

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

###  constructor

\+ **new TxParamsNormalizer**(`rpcCaller`: [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)): *[TxParamsNormalizer](_utils_tx_params_normalizer_.txparamsnormalizer.md)*

*Defined in [src/utils/tx-params-normalizer.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-params-normalizer.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`rpcCaller` | [RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md) |

**Returns:** *[TxParamsNormalizer](_utils_tx_params_normalizer_.txparamsnormalizer.md)*

## Properties

###  rpcCaller

• **rpcCaller**: *[RpcCaller](../interfaces/_utils_rpc_caller_.rpccaller.md)*

*Defined in [src/utils/tx-params-normalizer.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-params-normalizer.ts#L18)*

## Methods

###  populate

▸ **populate**(`celoTxParams`: Tx): *Promise‹Tx›*

*Defined in [src/utils/tx-params-normalizer.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-params-normalizer.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`celoTxParams` | Tx |

**Returns:** *Promise‹Tx›*
