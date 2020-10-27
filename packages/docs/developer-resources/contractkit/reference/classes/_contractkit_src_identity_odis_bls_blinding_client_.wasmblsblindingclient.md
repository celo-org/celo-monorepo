# Class: WasmBlsBlindingClient

## Hierarchy

* **WasmBlsBlindingClient**

## Implements

* [BlsBlindingClient](../interfaces/_contractkit_src_identity_odis_bls_blinding_client_.blsblindingclient.md)

## Index

### Constructors

* [constructor](_contractkit_src_identity_odis_bls_blinding_client_.wasmblsblindingclient.md#constructor)

### Methods

* [blindMessage](_contractkit_src_identity_odis_bls_blinding_client_.wasmblsblindingclient.md#blindmessage)
* [unblindAndVerifyMessage](_contractkit_src_identity_odis_bls_blinding_client_.wasmblsblindingclient.md#unblindandverifymessage)

## Constructors

###  constructor

\+ **new WasmBlsBlindingClient**(`odisPubKey`: string): *[WasmBlsBlindingClient](_contractkit_src_identity_odis_bls_blinding_client_.wasmblsblindingclient.md)*

*Defined in [packages/contractkit/src/identity/odis/bls-blinding-client.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/bls-blinding-client.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`odisPubKey` | string |

**Returns:** *[WasmBlsBlindingClient](_contractkit_src_identity_odis_bls_blinding_client_.wasmblsblindingclient.md)*

## Methods

###  blindMessage

▸ **blindMessage**(`base64PhoneNumber`: string): *Promise‹string›*

*Defined in [packages/contractkit/src/identity/odis/bls-blinding-client.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/bls-blinding-client.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`base64PhoneNumber` | string |

**Returns:** *Promise‹string›*

___

###  unblindAndVerifyMessage

▸ **unblindAndVerifyMessage**(`base64BlindSig`: string): *Promise‹string›*

*Defined in [packages/contractkit/src/identity/odis/bls-blinding-client.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/bls-blinding-client.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`base64BlindSig` | string |

**Returns:** *Promise‹string›*
