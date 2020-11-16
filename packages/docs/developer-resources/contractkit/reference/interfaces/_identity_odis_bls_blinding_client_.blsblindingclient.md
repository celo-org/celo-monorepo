# Interface: BlsBlindingClient

## Hierarchy

* **BlsBlindingClient**

## Implemented by

* [WasmBlsBlindingClient](../classes/_identity_odis_bls_blinding_client_.wasmblsblindingclient.md)

## Index

### Properties

* [blindMessage](_identity_odis_bls_blinding_client_.blsblindingclient.md#blindmessage)
* [unblindAndVerifyMessage](_identity_odis_bls_blinding_client_.blsblindingclient.md#unblindandverifymessage)

## Properties

###  blindMessage

• **blindMessage**: *function*

*Defined in [contractkit/src/identity/odis/bls-blinding-client.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/bls-blinding-client.ts#L4)*

#### Type declaration:

▸ (`base64PhoneNumber`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`base64PhoneNumber` | string |

___

###  unblindAndVerifyMessage

• **unblindAndVerifyMessage**: *function*

*Defined in [contractkit/src/identity/odis/bls-blinding-client.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/bls-blinding-client.ts#L5)*

#### Type declaration:

▸ (`blindedMessage`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`blindedMessage` | string |
