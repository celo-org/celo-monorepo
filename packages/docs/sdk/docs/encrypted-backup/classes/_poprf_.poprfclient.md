[@celo/encrypted-backup](../README.md) › ["poprf"](../modules/_poprf_.md) › [PoprfClient](_poprf_.poprfclient.md)

# Class: PoprfClient

## Hierarchy

* **PoprfClient**

  ↳ [ThresholdPoprfClient](_poprf_.thresholdpoprfclient.md)

## Index

### Constructors

* [constructor](_poprf_.poprfclient.md#constructor)

### Properties

* [blindedMessage](_poprf_.poprfclient.md#readonly-blindedmessage)
* [message](_poprf_.poprfclient.md#readonly-message)
* [publicKey](_poprf_.poprfclient.md#readonly-publickey)
* [seed](_poprf_.poprfclient.md#optional-readonly-seed)
* [tag](_poprf_.poprfclient.md#readonly-tag)

### Methods

* [unblindResponse](_poprf_.poprfclient.md#unblindresponse)

## Constructors

###  constructor

\+ **new PoprfClient**(`publicKey`: Uint8Array, `tag`: Uint8Array, `message`: Uint8Array, `seed?`: Uint8Array): *[PoprfClient](_poprf_.poprfclient.md)*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L11)*

Constructs POPRF client state, blinding the given message and saving the public key, blinding
factor, and tag for use in verification and unbinding of the response.

Note that this client represents the client-side of a single protocol exchange.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`publicKey` | Uint8Array | Public key for the POPRF service for use in verification. |
`tag` | Uint8Array | A plaintext tag which will be sent to the service along with the message. |
`message` | Uint8Array | A plaintext message which you want to blind and send to the POPRF service. |
`seed?` | Uint8Array | Seed for the blinding factor. Provided if deterministic blinding is needed.   Note that, by design, if the same seed and message is used twice, the blinded message will be   the same. This allows for linking between the two blinded messages and so only should be used   if this is intended (e.g. to provide for retries of requests without consuming quota).  |

**Returns:** *[PoprfClient](_poprf_.poprfclient.md)*

## Properties

### `Readonly` blindedMessage

• **blindedMessage**: *Buffer*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L11)*

Blinded message to be sent to the POPRF service for evaluation

___

### `Readonly` message

• **message**: *Uint8Array*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L30)*

A plaintext message which you want to blind and send to the POPRF service.

___

### `Readonly` publicKey

• **publicKey**: *Uint8Array*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L28)*

Public key for the POPRF service for use in verification.

___

### `Optional` `Readonly` seed

• **seed**? : *Uint8Array*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L31)*

Seed for the blinding factor. Provided if deterministic blinding is needed.
  Note that, by design, if the same seed and message is used twice, the blinded message will be
  the same. This allows for linking between the two blinded messages and so only should be used
  if this is intended (e.g. to provide for retries of requests without consuming quota).

___

### `Readonly` tag

• **tag**: *Uint8Array*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L29)*

A plaintext tag which will be sent to the service along with the message.

## Methods

###  unblindResponse

▸ **unblindResponse**(`response`: Uint8Array): *Buffer*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L49)*

Given a blinded evaluation response, unblind and verify the evaluation, returning the result.

**`throws`** If the given response is invalid or cannot be verified against the public key, tag, and
blinding state present in this client.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`response` | Uint8Array | A blinded evaluation response. |

**Returns:** *Buffer*

a buffer with the final POPRF output.
