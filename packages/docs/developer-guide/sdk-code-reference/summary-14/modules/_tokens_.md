# tokens

## Index

### Interfaces

* [API]()
* [TokenInfo]()

### Functions

* [compareLedgerAppVersions](_tokens_.md#compareledgerappversions)
* [list](_tokens_.md#const-list)
* [tokenInfoByAddressAndChainId](_tokens_.md#const-tokeninfobyaddressandchainid)

## Functions

### compareLedgerAppVersions

▸ **compareLedgerAppVersions**\(`version1`: string, `version2`: string\): _number_

_Defined in_ [_wallet-ledger/src/tokens.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/tokens.ts#L33)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `version1` | string |
| `version2` | string |

**Returns:** _number_

-1: version1 &lt; version2, 0: version1 == version2, 1: version1 &gt; version2

### `Const` list

▸ **list**\(\): [_TokenInfo_]()_\[\]_

_Defined in_ [_wallet-ledger/src/tokens.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/tokens.ts#L16)

list all the ERC20 tokens informations

**Returns:** [_TokenInfo_]()_\[\]_

### `Const` tokenInfoByAddressAndChainId

▸ **tokenInfoByAddressAndChainId**\(`contract`: Address, `chainId`: number\): [_TokenInfo_]() _\| null \| undefined_

_Defined in_ [_wallet-ledger/src/tokens.ts:8_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-ledger/src/tokens.ts#L8)

Retrieve the token information by a given contract address and chainId if any

**Parameters:**

| Name | Type |
| :--- | :--- |
| `contract` | Address |
| `chainId` | number |

**Returns:** [_TokenInfo_]() _\| null \| undefined_

