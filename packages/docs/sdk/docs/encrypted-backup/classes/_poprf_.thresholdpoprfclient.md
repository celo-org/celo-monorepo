[@celo/encrypted-backup](../README.md) › ["poprf"](../modules/_poprf_.md) › [ThresholdPoprfClient](_poprf_.thresholdpoprfclient.md)

# Class: ThresholdPoprfClient

## Hierarchy

* [PoprfClient](_poprf_.poprfclient.md)

  ↳ **ThresholdPoprfClient**

## Index

### Constructors

* [constructor](_poprf_.thresholdpoprfclient.md#constructor)

### Properties

* [blindedMessage](_poprf_.thresholdpoprfclient.md#readonly-blindedmessage)
* [message](_poprf_.thresholdpoprfclient.md#readonly-message)
* [polynomial](_poprf_.thresholdpoprfclient.md#readonly-polynomial)
* [publicKey](_poprf_.thresholdpoprfclient.md#readonly-publickey)
* [seed](_poprf_.thresholdpoprfclient.md#optional-readonly-seed)
* [tag](_poprf_.thresholdpoprfclient.md#readonly-tag)

### Methods

* [unblindPartialResponse](_poprf_.thresholdpoprfclient.md#unblindpartialresponse)
* [unblindResponse](_poprf_.thresholdpoprfclient.md#unblindresponse)

## Constructors

###  constructor

\+ **new ThresholdPoprfClient**(`publicKey`: Uint8Array, `polynomial`: Uint8Array, `tag`: Uint8Array, `message`: Uint8Array, `seed?`: Uint8Array): *[ThresholdPoprfClient](_poprf_.thresholdpoprfclient.md)*

*Overrides [PoprfClient](_poprf_.poprfclient.md).[constructor](_poprf_.poprfclient.md#constructor)*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L91)*

Constructs POPRF client state, blinding the given message and saving the public keys, blinding
factor, and tag for use in verification and unbinding of the response.

Note that this client represents the client-side of a single protocol exchange.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`publicKey` | Uint8Array | Public key for the POPRF service for use in verification. |
`polynomial` | Uint8Array | Public key polynomial for the individual POPRF servers for use in verification. |
`tag` | Uint8Array | A plaintext tag which will be sent to the service along with the message. |
`message` | Uint8Array | A plaintext message which you want to blind and send to the POPRF service. |
`seed?` | Uint8Array | Seed for the blinding factor. Provided if deterministic blinding is needed.   Note that, by design, if the same seed and message is used twice, the blinded message will be   the same. This allows for linking between the two blinded messages and so only should be used   if this is intended (e.g. to provide for retries of requests without consuming quota).  |

**Returns:** *[ThresholdPoprfClient](_poprf_.thresholdpoprfclient.md)*

## Properties

### `Readonly` blindedMessage

• **blindedMessage**: *Buffer*

*Inherited from [PoprfClient](_poprf_.poprfclient.md).[blindedMessage](_poprf_.poprfclient.md#readonly-blindedmessage)*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L11)*

Blinded message to be sent to the POPRF service for evaluation

___

### `Readonly` message

• **message**: *Uint8Array*

*Overrides [PoprfClient](_poprf_.poprfclient.md).[message](_poprf_.poprfclient.md#readonly-message)*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L111)*

A plaintext message which you want to blind and send to the POPRF service.

___

### `Readonly` polynomial

• **polynomial**: *Uint8Array*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L109)*

Public key polynomial for the individual POPRF servers for use in verification.

___

### `Readonly` publicKey

• **publicKey**: *Uint8Array*

*Overrides [PoprfClient](_poprf_.poprfclient.md).[publicKey](_poprf_.poprfclient.md#readonly-publickey)*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:108](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L108)*

Public key for the POPRF service for use in verification.

___

### `Optional` `Readonly` seed

• **seed**? : *Uint8Array*

*Overrides [PoprfClient](_poprf_.poprfclient.md).[seed](_poprf_.poprfclient.md#optional-readonly-seed)*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L112)*

Seed for the blinding factor. Provided if deterministic blinding is needed.
  Note that, by design, if the same seed and message is used twice, the blinded message will be
  the same. This allows for linking between the two blinded messages and so only should be used
  if this is intended (e.g. to provide for retries of requests without consuming quota).

___

### `Readonly` tag

• **tag**: *Uint8Array*

*Overrides [PoprfClient](_poprf_.poprfclient.md).[tag](_poprf_.poprfclient.md#readonly-tag)*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L110)*

A plaintext tag which will be sent to the service along with the message.

## Methods

###  unblindPartialResponse

▸ **unblindPartialResponse**(`response`: Uint8Array): *Buffer*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L126)*

Given a blinded partial evaluation response, unblind and verify the evaluation share, returning the result.

**`throws`** If the given response is invalid or cannot be verified against the public key, tag, and
blinding state present in this client.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`response` | Uint8Array | A blinded partial evaluation response. |

**Returns:** *Buffer*

a buffer with unblinded partial evaluation.

___

###  unblindResponse

▸ **unblindResponse**(`response`: Uint8Array): *Buffer*

*Inherited from [PoprfClient](_poprf_.poprfclient.md).[unblindResponse](_poprf_.poprfclient.md#unblindresponse)*

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
