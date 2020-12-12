# BlsBlindingClient

## Hierarchy

* **BlsBlindingClient**

## Implemented by

* [WasmBlsBlindingClient]()

## Index

### Properties

* [blindMessage]()
* [unblindAndVerifyMessage]()

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

