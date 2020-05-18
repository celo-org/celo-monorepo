# utils/tx-uri

## Index

### Functions

* [QrFromUri](_utils_tx_uri_.md#qrfromuri)
* [buildUri](_utils_tx_uri_.md#builduri)
* [parseUri](_utils_tx_uri_.md#parseuri)

## Functions

### QrFromUri

▸ **QrFromUri**\(`uri`: string, `type`: "svg" \| "terminal" \| "utf8"\): _Promise‹string›_

_Defined in_ [_contractkit/src/utils/tx-uri.ts:107_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L107)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `uri` | string |
| `type` | "svg" \| "terminal" \| "utf8" |

**Returns:** _Promise‹string›_

### buildUri

▸ **buildUri**\(`tx`: Tx, `functionName?`: undefined \| string, `abiTypes`: string\[\]\): _string_

_Defined in_ [_contractkit/src/utils/tx-uri.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L62)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `tx` | Tx | - |
| `functionName?` | undefined \| string | - |
| `abiTypes` | string\[\] | \[\] |

**Returns:** _string_

### parseUri

▸ **parseUri**\(`uri`: string\): _Tx_

_Defined in_ [_contractkit/src/utils/tx-uri.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/tx-uri.ts#L23)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `uri` | string |

**Returns:** _Tx_

