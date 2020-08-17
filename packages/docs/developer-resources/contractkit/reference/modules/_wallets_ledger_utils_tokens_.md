# External module: "wallets/ledger-utils/tokens"

## Index

### Interfaces

* [API](../interfaces/_wallets_ledger_utils_tokens_.api.md)
* [TokenInfo](../interfaces/_wallets_ledger_utils_tokens_.tokeninfo.md)

### Functions

* [compareLedgerAppVersions](_wallets_ledger_utils_tokens_.md#compareledgerappversions)
* [list](_wallets_ledger_utils_tokens_.md#const-list)
* [tokenInfoByAddressAndChainId](_wallets_ledger_utils_tokens_.md#const-tokeninfobyaddressandchainid)

## Functions

###  compareLedgerAppVersions

▸ **compareLedgerAppVersions**(`version1`: string, `version2`: string): *number*

*Defined in [contractkit/src/wallets/ledger-utils/tokens.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-utils/tokens.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`version1` | string |
`version2` | string |

**Returns:** *number*

-1: version1 < version2,
 0: version1 == version2,
 1: version1 > version2

___

### `Const` list

▸ **list**(): *[TokenInfo](../interfaces/_wallets_ledger_utils_tokens_.tokeninfo.md)[]*

*Defined in [contractkit/src/wallets/ledger-utils/tokens.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-utils/tokens.ts#L16)*

list all the ERC20 tokens informations

**Returns:** *[TokenInfo](../interfaces/_wallets_ledger_utils_tokens_.tokeninfo.md)[]*

___

### `Const` tokenInfoByAddressAndChainId

▸ **tokenInfoByAddressAndChainId**(`contract`: [Address](_base_.md#address), `chainId`: number): *[TokenInfo](../interfaces/_wallets_ledger_utils_tokens_.tokeninfo.md) | null | undefined*

*Defined in [contractkit/src/wallets/ledger-utils/tokens.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-utils/tokens.ts#L8)*

Retrieve the token information by a given contract address and chainId if any

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [Address](_base_.md#address) |
`chainId` | number |

**Returns:** *[TokenInfo](../interfaces/_wallets_ledger_utils_tokens_.tokeninfo.md) | null | undefined*
