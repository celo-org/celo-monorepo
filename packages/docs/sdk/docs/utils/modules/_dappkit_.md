[@celo/utils](../README.md) › ["dappkit"](_dappkit_.md)

# Module: "dappkit"

## Index

### Enumerations

* [DappKitRequestTypes](../enums/_dappkit_.dappkitrequesttypes.md)
* [DappKitResponseStatus](../enums/_dappkit_.dappkitresponsestatus.md)

### Interfaces

* [AccountAuthRequest](../interfaces/_dappkit_.accountauthrequest.md)
* [AccountAuthResponseFailure](../interfaces/_dappkit_.accountauthresponsefailure.md)
* [AccountAuthResponseSuccess](../interfaces/_dappkit_.accountauthresponsesuccess.md)
* [DappKitRequestBase](../interfaces/_dappkit_.dappkitrequestbase.md)
* [DappKitRequestMeta](../interfaces/_dappkit_.dappkitrequestmeta.md)
* [SignTxRequest](../interfaces/_dappkit_.signtxrequest.md)
* [SignTxResponseFailure](../interfaces/_dappkit_.signtxresponsefailure.md)
* [SignTxResponseSuccess](../interfaces/_dappkit_.signtxresponsesuccess.md)
* [TxToSignParam](../interfaces/_dappkit_.txtosignparam.md)

### Type aliases

* [AccountAuthResponse](_dappkit_.md#accountauthresponse)
* [DappKitRequest](_dappkit_.md#dappkitrequest)
* [DappKitResponse](_dappkit_.md#dappkitresponse)
* [SignTxResponse](_dappkit_.md#signtxresponse)

### Variables

* [DAPPKIT_BASE_HOST](_dappkit_.md#const-dappkit_base_host)

### Functions

* [AccountAuthRequest](_dappkit_.md#const-accountauthrequest)
* [AccountAuthResponseSuccess](_dappkit_.md#const-accountauthresponsesuccess)
* [SignTxRequest](_dappkit_.md#const-signtxrequest)
* [SignTxResponseSuccess](_dappkit_.md#const-signtxresponsesuccess)
* [parseDappKitRequestDeeplink](_dappkit_.md#parsedappkitrequestdeeplink)
* [parseDappkitResponseDeeplink](_dappkit_.md#parsedappkitresponsedeeplink)
* [produceResponseDeeplink](_dappkit_.md#produceresponsedeeplink)
* [serializeDappKitRequestDeeplink](_dappkit_.md#serializedappkitrequestdeeplink)

## Type aliases

###  AccountAuthResponse

Ƭ **AccountAuthResponse**: *[AccountAuthResponseSuccess](../interfaces/_dappkit_.accountauthresponsesuccess.md) | [AccountAuthResponseFailure](../interfaces/_dappkit_.accountauthresponsefailure.md)*

*Defined in [dappkit.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L62)*

___

###  DappKitRequest

Ƭ **DappKitRequest**: *[AccountAuthRequest](../interfaces/_dappkit_.accountauthrequest.md) | [SignTxRequest](../interfaces/_dappkit_.signtxrequest.md)*

*Defined in [dappkit.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L134)*

___

###  DappKitResponse

Ƭ **DappKitResponse**: *[AccountAuthResponse](_dappkit_.md#accountauthresponse) | [SignTxResponse](_dappkit_.md#signtxresponse)*

*Defined in [dappkit.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L83)*

___

###  SignTxResponse

Ƭ **SignTxResponse**: *[SignTxResponseSuccess](../interfaces/_dappkit_.signtxresponsesuccess.md) | [SignTxResponseFailure](../interfaces/_dappkit_.signtxresponsefailure.md)*

*Defined in [dappkit.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L81)*

## Variables

### `Const` DAPPKIT_BASE_HOST

• **DAPPKIT_BASE_HOST**: *"celo://wallet/dappkit"* = "celo://wallet/dappkit"

*Defined in [dappkit.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L4)*

## Functions

### `Const` AccountAuthRequest

▸ **AccountAuthRequest**(`meta`: [DappKitRequestMeta](../interfaces/_dappkit_.dappkitrequestmeta.md)): *[AccountAuthRequest](../interfaces/_dappkit_.accountauthrequest.md)*

*Defined in [dappkit.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`meta` | [DappKitRequestMeta](../interfaces/_dappkit_.dappkitrequestmeta.md) |

**Returns:** *[AccountAuthRequest](../interfaces/_dappkit_.accountauthrequest.md)*

___

### `Const` AccountAuthResponseSuccess

▸ **AccountAuthResponseSuccess**(`address`: string, `phoneNumber`: string, `pepper`: string | undefined): *[AccountAuthResponseSuccess](../interfaces/_dappkit_.accountauthresponsesuccess.md)*

*Defined in [dappkit.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`phoneNumber` | string |
`pepper` | string &#124; undefined |

**Returns:** *[AccountAuthResponseSuccess](../interfaces/_dappkit_.accountauthresponsesuccess.md)*

___

### `Const` SignTxRequest

▸ **SignTxRequest**(`txs`: [TxToSignParam](../interfaces/_dappkit_.txtosignparam.md)[], `meta`: [DappKitRequestMeta](../interfaces/_dappkit_.dappkitrequestmeta.md)): *[SignTxRequest](../interfaces/_dappkit_.signtxrequest.md)*

*Defined in [dappkit.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`txs` | [TxToSignParam](../interfaces/_dappkit_.txtosignparam.md)[] |
`meta` | [DappKitRequestMeta](../interfaces/_dappkit_.dappkitrequestmeta.md) |

**Returns:** *[SignTxRequest](../interfaces/_dappkit_.signtxrequest.md)*

___

### `Const` SignTxResponseSuccess

▸ **SignTxResponseSuccess**(`rawTxs`: string[]): *[SignTxResponseSuccess](../interfaces/_dappkit_.signtxresponsesuccess.md)*

*Defined in [dappkit.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTxs` | string[] |

**Returns:** *[SignTxResponseSuccess](../interfaces/_dappkit_.signtxresponsesuccess.md)*

___

###  parseDappKitRequestDeeplink

▸ **parseDappKitRequestDeeplink**(`url`: string): *[DappKitRequest](_dappkit_.md#dappkitrequest)*

*Defined in [dappkit.ts:236](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L236)*

**Parameters:**

Name | Type |
------ | ------ |
`url` | string |

**Returns:** *[DappKitRequest](_dappkit_.md#dappkitrequest)*

___

###  parseDappkitResponseDeeplink

▸ **parseDappkitResponseDeeplink**(`url`: string): *[DappKitResponse](_dappkit_.md#dappkitresponse) & object*

*Defined in [dappkit.ts:179](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L179)*

**Parameters:**

Name | Type |
------ | ------ |
`url` | string |

**Returns:** *[DappKitResponse](_dappkit_.md#dappkitresponse) & object*

___

###  produceResponseDeeplink

▸ **produceResponseDeeplink**(`request`: [DappKitRequest](_dappkit_.md#dappkitrequest), `response`: [DappKitResponse](_dappkit_.md#dappkitresponse)): *string*

*Defined in [dappkit.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`request` | [DappKitRequest](_dappkit_.md#dappkitrequest) |
`response` | [DappKitResponse](_dappkit_.md#dappkitresponse) |

**Returns:** *string*

___

###  serializeDappKitRequestDeeplink

▸ **serializeDappKitRequestDeeplink**(`request`: [DappKitRequest](_dappkit_.md#dappkitrequest)): *string*

*Defined in [dappkit.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/dappkit.ts#L148)*

**Parameters:**

Name | Type |
------ | ------ |
`request` | [DappKitRequest](_dappkit_.md#dappkitrequest) |

**Returns:** *string*
