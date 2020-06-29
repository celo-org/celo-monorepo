# Class: TxParamsNormalizer

## Hierarchy

* **TxParamsNormalizer**

## Index

### Constructors

* [constructor](_contractkit_src_utils_tx_params_normalizer_.txparamsnormalizer.md#constructor)

### Properties

* [rpcCaller](_contractkit_src_utils_tx_params_normalizer_.txparamsnormalizer.md#rpccaller)

### Methods

* [populate](_contractkit_src_utils_tx_params_normalizer_.txparamsnormalizer.md#populate)

## Constructors

###  constructor

\+ **new TxParamsNormalizer**(`rpcCaller`: [RpcCaller](../interfaces/_contractkit_src_utils_rpc_caller_.rpccaller.md)): *[TxParamsNormalizer](_contractkit_src_utils_tx_params_normalizer_.txparamsnormalizer.md)*

*Defined in [contractkit/src/utils/tx-params-normalizer.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-params-normalizer.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`rpcCaller` | [RpcCaller](../interfaces/_contractkit_src_utils_rpc_caller_.rpccaller.md) |

**Returns:** *[TxParamsNormalizer](_contractkit_src_utils_tx_params_normalizer_.txparamsnormalizer.md)*

## Properties

###  rpcCaller

• **rpcCaller**: *[RpcCaller](../interfaces/_contractkit_src_utils_rpc_caller_.rpccaller.md)*

*Defined in [contractkit/src/utils/tx-params-normalizer.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-params-normalizer.ts#L19)*

## Methods

###  populate

▸ **populate**(`celoTxParams`: Tx): *Promise‹Tx›*

*Defined in [contractkit/src/utils/tx-params-normalizer.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-params-normalizer.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`celoTxParams` | Tx |

**Returns:** *Promise‹Tx›*
