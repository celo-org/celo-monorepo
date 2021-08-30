# tx-uri

## Index

### Functions

* [QrFromUri](_tx_uri_.md#qrfromuri)
* [buildUri](_tx_uri_.md#builduri)
* [parseUri](_tx_uri_.md#parseuri)

## Functions

### QrFromUri

▸ **QrFromUri**\(`uri`: string, `type`: "svg" \| "terminal" \| "utf8"\): _Promise‹string›_

_Defined in_ [_tx-uri.ts:114_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/transactions-uri/src/tx-uri.ts#L114)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `uri` | string |
| `type` | "svg" \| "terminal" \| "utf8" |

**Returns:** _Promise‹string›_

### buildUri

▸ **buildUri**\(`tx`: CeloTx, `functionName?`: undefined \| string, `abiTypes`: string\[\]\): _string_

_Defined in_ [_tx-uri.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/transactions-uri/src/tx-uri.ts#L65)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `tx` | CeloTx | - |
| `functionName?` | undefined \| string | - |
| `abiTypes` | string\[\] | \[\] |

**Returns:** _string_

### parseUri

▸ **parseUri**\(`uri`: string\): _CeloTx_

_Defined in_ [_tx-uri.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/transactions-uri/src/tx-uri.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `uri` | string |

**Returns:** _CeloTx_

