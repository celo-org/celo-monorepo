# packages/sdk/utils/src/dappkit

## Index

### Enumerations

* [DappKitRequestTypes]()
* [DappKitResponseStatus]()

### Interfaces

* [AccountAuthRequest]()
* [AccountAuthResponseFailure]()
* [AccountAuthResponseSuccess]()
* [DappKitRequestBase]()
* [DappKitRequestMeta]()
* [SignTxRequest]()
* [SignTxResponseFailure]()
* [SignTxResponseSuccess]()
* [TxToSignParam]()

### Type aliases

* [AccountAuthResponse](_packages_sdk_utils_src_dappkit_.md#accountauthresponse)
* [DappKitRequest](_packages_sdk_utils_src_dappkit_.md#dappkitrequest)
* [DappKitResponse](_packages_sdk_utils_src_dappkit_.md#dappkitresponse)
* [SignTxResponse](_packages_sdk_utils_src_dappkit_.md#signtxresponse)

### Variables

* [DAPPKIT\_BASE\_HOST](_packages_sdk_utils_src_dappkit_.md#const-dappkit_base_host)

### Functions

* [AccountAuthRequest](_packages_sdk_utils_src_dappkit_.md#const-accountauthrequest)
* [AccountAuthResponseSuccess](_packages_sdk_utils_src_dappkit_.md#const-accountauthresponsesuccess)
* [SignTxRequest](_packages_sdk_utils_src_dappkit_.md#const-signtxrequest)
* [SignTxResponseSuccess](_packages_sdk_utils_src_dappkit_.md#const-signtxresponsesuccess)
* [parseDappKitRequestDeeplink](_packages_sdk_utils_src_dappkit_.md#parsedappkitrequestdeeplink)
* [parseDappkitResponseDeeplink](_packages_sdk_utils_src_dappkit_.md#parsedappkitresponsedeeplink)
* [produceResponseDeeplink](_packages_sdk_utils_src_dappkit_.md#produceresponsedeeplink)
* [serializeDappKitRequestDeeplink](_packages_sdk_utils_src_dappkit_.md#serializedappkitrequestdeeplink)

## Type aliases

### AccountAuthResponse

Ƭ **AccountAuthResponse**: [_AccountAuthResponseSuccess_]() _\|_ [_AccountAuthResponseFailure_]()

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L59)

### DappKitRequest

Ƭ **DappKitRequest**: [_AccountAuthRequest_]() _\|_ [_SignTxRequest_]()

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:131_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L131)

### DappKitResponse

Ƭ **DappKitResponse**: [_AccountAuthResponse_](_packages_sdk_utils_src_dappkit_.md#accountauthresponse) _\|_ [_SignTxResponse_](_packages_sdk_utils_src_dappkit_.md#signtxresponse)

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L80)

### SignTxResponse

Ƭ **SignTxResponse**: [_SignTxResponseSuccess_]() _\|_ [_SignTxResponseFailure_]()

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L78)

## Variables

### `Const` DAPPKIT\_BASE\_HOST

• **DAPPKIT\_BASE\_HOST**: _"celo://wallet/dappkit"_ = "celo://wallet/dappkit"

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:4_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L4)

## Functions

### `Const` AccountAuthRequest

▸ **AccountAuthRequest**\(`meta`: [DappKitRequestMeta]()\): [_AccountAuthRequest_]()

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L32)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `meta` | [DappKitRequestMeta]() |

**Returns:** [_AccountAuthRequest_]()

### `Const` AccountAuthResponseSuccess

▸ **AccountAuthResponseSuccess**\(`address`: string, `phoneNumber`: string\): [_AccountAuthResponseSuccess_]()

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L44)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `phoneNumber` | string |

**Returns:** [_AccountAuthResponseSuccess_]()

### `Const` SignTxRequest

▸ **SignTxRequest**\(`txs`: [TxToSignParam]()\[\], `meta`: [DappKitRequestMeta]()\): [_SignTxRequest_]()

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L117)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txs` | [TxToSignParam]()\[\] |
| `meta` | [DappKitRequestMeta]() |

**Returns:** [_SignTxRequest_]()

### `Const` SignTxResponseSuccess

▸ **SignTxResponseSuccess**\(`rawTxs`: string\[\]\): [_SignTxResponseSuccess_]()

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:67_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L67)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `rawTxs` | string\[\] |

**Returns:** [_SignTxResponseSuccess_]()

### parseDappKitRequestDeeplink

▸ **parseDappKitRequestDeeplink**\(`url`: string\): [_DappKitRequest_](_packages_sdk_utils_src_dappkit_.md#dappkitrequest)

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:233_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L233)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `url` | string |

**Returns:** [_DappKitRequest_](_packages_sdk_utils_src_dappkit_.md#dappkitrequest)

### parseDappkitResponseDeeplink

▸ **parseDappkitResponseDeeplink**\(`url`: string\): [_DappKitResponse_](_packages_sdk_utils_src_dappkit_.md#dappkitresponse) _& object_

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:176_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L176)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `url` | string |

**Returns:** [_DappKitResponse_](_packages_sdk_utils_src_dappkit_.md#dappkitresponse) _& object_

### produceResponseDeeplink

▸ **produceResponseDeeplink**\(`request`: [DappKitRequest](_packages_sdk_utils_src_dappkit_.md#dappkitrequest), `response`: [DappKitResponse](_packages_sdk_utils_src_dappkit_.md#dappkitresponse)\): _string_

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L82)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `request` | [DappKitRequest](_packages_sdk_utils_src_dappkit_.md#dappkitrequest) |
| `response` | [DappKitResponse](_packages_sdk_utils_src_dappkit_.md#dappkitresponse) |

**Returns:** _string_

### serializeDappKitRequestDeeplink

▸ **serializeDappKitRequestDeeplink**\(`request`: [DappKitRequest](_packages_sdk_utils_src_dappkit_.md#dappkitrequest)\): _string_

_Defined in_ [_packages/sdk/utils/src/dappkit.ts:145_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L145)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `request` | [DappKitRequest](_packages_sdk_utils_src_dappkit_.md#dappkitrequest) |

**Returns:** _string_

