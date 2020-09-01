# Class: WasmBlsBlindingClient

## Hierarchy

* **WasmBlsBlindingClient**

## Implements

* [BlsBlindingClient](../interfaces/_identity_odis_bls_blinding_client_.blsblindingclient.md)

## Index

### Constructors

* [constructor](_identity_odis_bls_blinding_client_.wasmblsblindingclient.md#constructor)

### Methods

* [blindMessage](_identity_odis_bls_blinding_client_.wasmblsblindingclient.md#blindmessage)
* [unblindAndVerifyMessage](_identity_odis_bls_blinding_client_.wasmblsblindingclient.md#unblindandverifymessage)

## Constructors

###  constructor

\+ **new WasmBlsBlindingClient**(`odisPubKey`: string): *[WasmBlsBlindingClient](_identity_odis_bls_blinding_client_.wasmblsblindingclient.md)*

*Defined in [packages/contractkit/src/identity/odis/bls-blinding-client.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/bls-blinding-client.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`odisPubKey` | string |

**Returns:** *[WasmBlsBlindingClient](_identity_odis_bls_blinding_client_.wasmblsblindingclient.md)*

## Methods

###  blindMessage

▸ **blindMessage**(`base64PhoneNumber`: string): *Promise‹string›*

*Defined in [packages/contractkit/src/identity/odis/bls-blinding-client.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/bls-blinding-client.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`base64PhoneNumber` | string |

**Returns:** *Promise‹string›*

___

###  unblindAndVerifyMessage

▸ **unblindAndVerifyMessage**(`base64BlindSig`: string): *Promise‹string›*

*Defined in [packages/contractkit/src/identity/odis/bls-blinding-client.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/bls-blinding-client.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`base64BlindSig` | string |

**Returns:** *Promise‹string›*
