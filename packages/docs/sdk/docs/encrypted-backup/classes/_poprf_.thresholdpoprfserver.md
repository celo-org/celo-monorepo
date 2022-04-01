[@celo/encrypted-backup](../README.md) › ["poprf"](../modules/_poprf_.md) › [ThresholdPoprfServer](_poprf_.thresholdpoprfserver.md)

# Class: ThresholdPoprfServer

## Hierarchy

* **ThresholdPoprfServer**

## Index

### Constructors

* [constructor](_poprf_.thresholdpoprfserver.md#constructor)

### Properties

* [privateKeyShare](_poprf_.thresholdpoprfserver.md#readonly-privatekeyshare)

### Methods

* [blindPartialEval](_poprf_.thresholdpoprfserver.md#blindpartialeval)

## Constructors

###  constructor

\+ **new ThresholdPoprfServer**(`privateKeyShare`: Uint8Array): *[ThresholdPoprfServer](_poprf_.thresholdpoprfserver.md)*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L148)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKeyShare` | Uint8Array |

**Returns:** *[ThresholdPoprfServer](_poprf_.thresholdpoprfserver.md)*

## Properties

### `Readonly` privateKeyShare

• **privateKeyShare**: *Uint8Array*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:149](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L149)*

## Methods

###  blindPartialEval

▸ **blindPartialEval**(`tag`: Uint8Array, `blindedMessage`: Uint8Array): *Buffer*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L158)*

Evaluates the POPRF function over the tag and blinded message with the private key share.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tag` | Uint8Array | plaintext tag buffer to be combined with the blinded message in the POPRF.  |
`blindedMessage` | Uint8Array | - |

**Returns:** *Buffer*

a serialized blinded partial evaluation response.
