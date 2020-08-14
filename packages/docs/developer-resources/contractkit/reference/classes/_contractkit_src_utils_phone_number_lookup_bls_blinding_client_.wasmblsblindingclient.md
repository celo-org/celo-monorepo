# Class: WasmBlsBlindingClient

## Hierarchy

* **WasmBlsBlindingClient**

## Implements

* [BlsBlindingClient](../interfaces/_contractkit_src_utils_phone_number_lookup_bls_blinding_client_.blsblindingclient.md)

## Index

### Constructors

* [constructor](_contractkit_src_utils_phone_number_lookup_bls_blinding_client_.wasmblsblindingclient.md#constructor)

### Methods

* [blindMessage](_contractkit_src_utils_phone_number_lookup_bls_blinding_client_.wasmblsblindingclient.md#blindmessage)
* [unblindAndVerifyMessage](_contractkit_src_utils_phone_number_lookup_bls_blinding_client_.wasmblsblindingclient.md#unblindandverifymessage)

## Constructors

###  constructor

\+ **new WasmBlsBlindingClient**(`pgpnpPubKey`: string): *[WasmBlsBlindingClient](_contractkit_src_utils_phone_number_lookup_bls_blinding_client_.wasmblsblindingclient.md)*

*Defined in [contractkit/src/utils/phone-number-lookup/bls-blinding-client.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/phone-number-lookup/bls-blinding-client.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`pgpnpPubKey` | string |

**Returns:** *[WasmBlsBlindingClient](_contractkit_src_utils_phone_number_lookup_bls_blinding_client_.wasmblsblindingclient.md)*

## Methods

###  blindMessage

▸ **blindMessage**(`base64PhoneNumber`: string): *Promise‹string›*

*Defined in [contractkit/src/utils/phone-number-lookup/bls-blinding-client.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/phone-number-lookup/bls-blinding-client.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`base64PhoneNumber` | string |

**Returns:** *Promise‹string›*

___

###  unblindAndVerifyMessage

▸ **unblindAndVerifyMessage**(`base64BlindSig`: string): *Promise‹string›*

*Defined in [contractkit/src/utils/phone-number-lookup/bls-blinding-client.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/phone-number-lookup/bls-blinding-client.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`base64BlindSig` | string |

**Returns:** *Promise‹string›*
