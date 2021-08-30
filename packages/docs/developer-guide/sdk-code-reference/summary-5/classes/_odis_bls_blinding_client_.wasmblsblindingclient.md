# WasmBlsBlindingClient

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

### constructor

+ **new WasmBlsBlindingClient**\(`odisPubKey`: string\): [_WasmBlsBlindingClient_](_odis_bls_blinding_client_.wasmblsblindingclient.md)

_Defined in_ [_packages/sdk/identity/src/odis/bls-blinding-client.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/bls-blinding-client.ts#L25)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `odisPubKey` | string |

**Returns:** [_WasmBlsBlindingClient_](_odis_bls_blinding_client_.wasmblsblindingclient.md)

## Methods

### blindMessage

▸ **blindMessage**\(`base64PhoneNumber`: string, `seed?`: Buffer\): _Promise‹string›_

_Defined in_ [_packages/sdk/identity/src/odis/bls-blinding-client.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/bls-blinding-client.ts#L39)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `base64PhoneNumber` | string |
| `seed?` | Buffer |

**Returns:** _Promise‹string›_

### unblindAndVerifyMessage

▸ **unblindAndVerifyMessage**\(`base64BlindSig`: string\): _Promise‹string›_

_Defined in_ [_packages/sdk/identity/src/odis/bls-blinding-client.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/bls-blinding-client.ts#L52)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `base64BlindSig` | string |

**Returns:** _Promise‹string›_

