# External module: "contractkit/src/wallets/ledger-utils/tokens"

## Index

### Interfaces

* [API](../interfaces/_contractkit_src_wallets_ledger_utils_tokens_.api.md)
* [TokenInfo](../interfaces/_contractkit_src_wallets_ledger_utils_tokens_.tokeninfo.md)

### Functions

* [list](_contractkit_src_wallets_ledger_utils_tokens_.md#const-list)
* [tokenInfoByAddressAndChainId](_contractkit_src_wallets_ledger_utils_tokens_.md#const-tokeninfobyaddressandchainid)

## Functions

### `Const` list

▸ **list**(): *[TokenInfo](../interfaces/_contractkit_src_wallets_ledger_utils_tokens_.tokeninfo.md)[]*

*Defined in [contractkit/src/wallets/ledger-utils/tokens.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-utils/tokens.ts#L17)*

list all the ERC20 tokens informations

**Returns:** *[TokenInfo](../interfaces/_contractkit_src_wallets_ledger_utils_tokens_.tokeninfo.md)[]*

___

### `Const` tokenInfoByAddressAndChainId

▸ **tokenInfoByAddressAndChainId**(`contract`: [Address](_contractkit_src_base_.md#address), `chainId`: number): *[TokenInfo](../interfaces/_contractkit_src_wallets_ledger_utils_tokens_.tokeninfo.md) | null | undefined*

*Defined in [contractkit/src/wallets/ledger-utils/tokens.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-utils/tokens.ts#L9)*

Retrieve the token information by a given contract address and chainId if any

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [Address](_contractkit_src_base_.md#address) |
`chainId` | number |

**Returns:** *[TokenInfo](../interfaces/_contractkit_src_wallets_ledger_utils_tokens_.tokeninfo.md) | null | undefined*
