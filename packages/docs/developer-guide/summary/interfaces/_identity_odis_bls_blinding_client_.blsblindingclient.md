# BlsBlindingClient

## Hierarchy

* **BlsBlindingClient**

## Implemented by

* [WasmBlsBlindingClient](../classes/_identity_odis_bls_blinding_client_.wasmblsblindingclient.md)

## Index

### Properties

* [blindMessage](_identity_odis_bls_blinding_client_.blsblindingclient.md#blindmessage)
* [unblindAndVerifyMessage](_identity_odis_bls_blinding_client_.blsblindingclient.md#unblindandverifymessage)

## Properties

### blindMessage

• **blindMessage**: _function_

_Defined in_ [_packages/contractkit/src/identity/odis/bls-blinding-client.ts:4_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/bls-blinding-client.ts#L4)

#### Type declaration:

▸ \(`base64PhoneNumber`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `base64PhoneNumber` | string |

### unblindAndVerifyMessage

• **unblindAndVerifyMessage**: _function_

_Defined in_ [_packages/contractkit/src/identity/odis/bls-blinding-client.ts:5_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/bls-blinding-client.ts#L5)

#### Type declaration:

▸ \(`blindedMessage`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blindedMessage` | string |

