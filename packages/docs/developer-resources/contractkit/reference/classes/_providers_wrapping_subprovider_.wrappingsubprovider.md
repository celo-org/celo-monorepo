# Class: WrappingSubprovider

## Hierarchy

* Subprovider

  ↳ **WrappingSubprovider**

## Index

### Constructors

* [constructor](_providers_wrapping_subprovider_.wrappingsubprovider.md#constructor)

### Properties

* [provider](_providers_wrapping_subprovider_.wrappingsubprovider.md#provider)

### Methods

* [emitPayloadAsync](_providers_wrapping_subprovider_.wrappingsubprovider.md#emitpayloadasync)
* [handleRequest](_providers_wrapping_subprovider_.wrappingsubprovider.md#handlerequest)
* [setEngine](_providers_wrapping_subprovider_.wrappingsubprovider.md#setengine)

## Constructors

###  constructor

\+ **new WrappingSubprovider**(`provider`: Provider): *[WrappingSubprovider](_providers_wrapping_subprovider_.wrappingsubprovider.md)*

*Defined in [packages/contractkit/src/providers/wrapping-subprovider.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/wrapping-subprovider.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`provider` | Provider |

**Returns:** *[WrappingSubprovider](_providers_wrapping_subprovider_.wrappingsubprovider.md)*

## Properties

###  provider

• **provider**: *Provider*

*Defined in [packages/contractkit/src/providers/wrapping-subprovider.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/wrapping-subprovider.ts#L8)*

## Methods

###  emitPayloadAsync

▸ **emitPayloadAsync**(`payload`: Partial‹JSONRPCRequestPayloadWithMethod›): *Promise‹JSONRPCResponsePayload›*

*Inherited from [CeloPrivateKeysWalletProvider](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md).[emitPayloadAsync](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#emitpayloadasync)*

Defined in node_modules/@0x/subproviders/lib/src/subproviders/subprovider.d.ts:25

Emits a JSON RPC payload that will then be handled by the ProviderEngine instance
this subprovider is a part of. The payload will cascade down the subprovider middleware
stack until finding the responsible entity for handling the request.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`payload` | Partial‹JSONRPCRequestPayloadWithMethod› | JSON RPC payload |

**Returns:** *Promise‹JSONRPCResponsePayload›*

JSON RPC response payload

___

###  handleRequest

▸ **handleRequest**(`payload`: JSONRPCRequestPayload, `_next`: Callback, `end`: ErrorCallback): *Promise‹void›*

*Overrides void*

*Defined in [packages/contractkit/src/providers/wrapping-subprovider.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/wrapping-subprovider.ts#L16)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`payload` | JSONRPCRequestPayload | JSON RPC request payload |
`_next` | Callback | - |
`end` | ErrorCallback | A callback called once the subprovider is done handling the request  |

**Returns:** *Promise‹void›*

___

###  setEngine

▸ **setEngine**(`engine`: Web3ProviderEngine): *void*

*Inherited from [CeloPrivateKeysWalletProvider](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md).[setEngine](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#setengine)*

Defined in node_modules/@0x/subproviders/lib/src/subproviders/subprovider.d.ts:32

Set's the subprovider's engine to the ProviderEngine it is added to.
This is only called within the ProviderEngine source code, do not call
directly.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`engine` | Web3ProviderEngine | The ProviderEngine this subprovider is added to  |

**Returns:** *void*
