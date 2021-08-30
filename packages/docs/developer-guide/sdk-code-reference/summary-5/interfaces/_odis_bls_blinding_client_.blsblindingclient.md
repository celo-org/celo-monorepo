# BlsBlindingClient

## Hierarchy

* **BlsBlindingClient**

## Implemented by

* [WasmBlsBlindingClient](../classes/_odis_bls_blinding_client_.wasmblsblindingclient.md)

## Index

### Properties

* [blindMessage](_odis_bls_blinding_client_.blsblindingclient.md#blindmessage)
* [unblindAndVerifyMessage](_odis_bls_blinding_client_.blsblindingclient.md#unblindandverifymessage)

## Properties

### blindMessage

• **blindMessage**: _function_

_Defined in_ [_packages/sdk/identity/src/odis/bls-blinding-client.ts:4_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/bls-blinding-client.ts#L4)

#### Type declaration:

▸ \(`base64PhoneNumber`: string, `seed?`: Buffer\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `base64PhoneNumber` | string |
| `seed?` | Buffer |

### unblindAndVerifyMessage

• **unblindAndVerifyMessage**: _function_

_Defined in_ [_packages/sdk/identity/src/odis/bls-blinding-client.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/bls-blinding-client.ts#L5)

#### Type declaration:

▸ \(`blindedMessage`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blindedMessage` | string |

