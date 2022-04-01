[@celo/encrypted-backup](../README.md) › ["poprf"](../modules/_poprf_.md) › [PoprfServer](_poprf_.poprfserver.md)

# Class: PoprfServer

## Hierarchy

* **PoprfServer**

## Index

### Constructors

* [constructor](_poprf_.poprfserver.md#constructor)

### Properties

* [privateKey](_poprf_.poprfserver.md#readonly-privatekey)

### Methods

* [blindEval](_poprf_.poprfserver.md#blindeval)

## Constructors

###  constructor

\+ **new PoprfServer**(`privateKey`: Uint8Array): *[PoprfServer](_poprf_.poprfserver.md)*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | Uint8Array |

**Returns:** *[PoprfServer](_poprf_.poprfserver.md)*

## Properties

### `Readonly` privateKey

• **privateKey**: *Uint8Array*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L134)*

## Methods

###  blindEval

▸ **blindEval**(`tag`: Uint8Array, `blindedMessage`: Uint8Array): *Buffer*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:143](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L143)*

Evaluates the POPRF function over the tag and blinded message with the (complete) private key

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tag` | Uint8Array | plaintext tag buffer to be combined with the blinded message in the POPRF.  |
`blindedMessage` | Uint8Array | - |

**Returns:** *Buffer*

a serialized blinded evaluation response.
