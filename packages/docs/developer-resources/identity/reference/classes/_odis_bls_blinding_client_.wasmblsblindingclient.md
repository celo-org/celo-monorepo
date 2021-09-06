# Class: WasmBlsBlindingClient

## Hierarchy

* **WasmBlsBlindingClient**

## Implements

* [BlsBlindingClient](../interfaces/_odis_bls_blinding_client_.blsblindingclient.md)

## Index

### Constructors

* [constructor](_odis_bls_blinding_client_.wasmblsblindingclient.md#constructor)

### Methods

* [blindMessage](_odis_bls_blinding_client_.wasmblsblindingclient.md#blindmessage)
* [unblindAndVerifyMessage](_odis_bls_blinding_client_.wasmblsblindingclient.md#unblindandverifymessage)

## Constructors

###  constructor

\+ **new WasmBlsBlindingClient**(`odisPubKey`: string): *[WasmBlsBlindingClient](_odis_bls_blinding_client_.wasmblsblindingclient.md)*

*Defined in [packages/sdk/identity/src/odis/bls-blinding-client.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/bls-blinding-client.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`odisPubKey` | string |

**Returns:** *[WasmBlsBlindingClient](_odis_bls_blinding_client_.wasmblsblindingclient.md)*

## Methods

###  blindMessage

▸ **blindMessage**(`base64PhoneNumber`: string, `seed?`: Buffer): *Promise‹string›*

*Defined in [packages/sdk/identity/src/odis/bls-blinding-client.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/bls-blinding-client.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`base64PhoneNumber` | string |
`seed?` | Buffer |

**Returns:** *Promise‹string›*

___

###  unblindAndVerifyMessage

▸ **unblindAndVerifyMessage**(`base64BlindSig`: string): *Promise‹string›*

*Defined in [packages/sdk/identity/src/odis/bls-blinding-client.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/bls-blinding-client.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`base64BlindSig` | string |

**Returns:** *Promise‹string›*
