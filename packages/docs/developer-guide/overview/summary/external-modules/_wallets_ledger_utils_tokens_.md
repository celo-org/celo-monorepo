# wallets/ledger-utils/tokens

## Index

### Interfaces

* [API]()
* [TokenInfo]()

### Functions

* [compareLedgerAppVersions](_wallets_ledger_utils_tokens_.md#compareledgerappversions)
* [list](_wallets_ledger_utils_tokens_.md#const-list)
* [tokenInfoByAddressAndChainId](_wallets_ledger_utils_tokens_.md#const-tokeninfobyaddressandchainid)

## Functions

### compareLedgerAppVersions

▸ **compareLedgerAppVersions**\(`version1`: string, `version2`: string\): _number_

_Defined in_ [_contractkit/src/wallets/ledger-utils/tokens.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-utils/tokens.ts#L33)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `version1` | string |
| `version2` | string |

**Returns:** _number_

-1: version1 &lt; version2, 0: version1 == version2, 1: version1 &gt; version2

### `Const` list

▸ **list**\(\): [_TokenInfo_]()_\[\]_

_Defined in_ [_contractkit/src/wallets/ledger-utils/tokens.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-utils/tokens.ts#L16)

list all the ERC20 tokens informations

**Returns:** [_TokenInfo_]()_\[\]_

### `Const` tokenInfoByAddressAndChainId

▸ **tokenInfoByAddressAndChainId**\(`contract`: [Address](_base_.md#address), `chainId`: number\): [_TokenInfo_]() _\| null \| undefined_

_Defined in_ [_contractkit/src/wallets/ledger-utils/tokens.ts:8_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/ledger-utils/tokens.ts#L8)

Retrieve the token information by a given contract address and chainId if any

**Parameters:**

| Name | Type |
| :--- | :--- |
| `contract` | [Address](_base_.md#address) |
| `chainId` | number |

**Returns:** [_TokenInfo_]() _\| null \| undefined_

