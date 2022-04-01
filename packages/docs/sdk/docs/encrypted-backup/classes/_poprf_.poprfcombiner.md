[@celo/encrypted-backup](../README.md) › ["poprf"](../modules/_poprf_.md) › [PoprfCombiner](_poprf_.poprfcombiner.md)

# Class: PoprfCombiner

## Hierarchy

* **PoprfCombiner**

## Index

### Constructors

* [constructor](_poprf_.poprfcombiner.md#constructor)

### Properties

* [blindedResponses](_poprf_.poprfcombiner.md#readonly-blindedresponses)
* [threshold](_poprf_.poprfcombiner.md#readonly-threshold)

### Methods

* [addBlindedResponse](_poprf_.poprfcombiner.md#addblindedresponse)
* [blindAggregate](_poprf_.poprfcombiner.md#blindaggregate)

## Constructors

###  constructor

\+ **new PoprfCombiner**(`threshold`: number): *[PoprfCombiner](_poprf_.poprfcombiner.md)*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`threshold` | number |

**Returns:** *[PoprfCombiner](_poprf_.poprfcombiner.md)*

## Properties

### `Readonly` blindedResponses

• **blindedResponses**: *Buffer[]* = []

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L55)*

___

### `Readonly` threshold

• **threshold**: *number*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L57)*

## Methods

###  addBlindedResponse

▸ **addBlindedResponse**(...`responses`: Uint8Array[]): *void*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L66)*

Adds the given blinded partial response(s) to the array of responses held on this object.

**Parameters:**

Name | Type |
------ | ------ |
`...responses` | Uint8Array[] |

**Returns:** *void*

___

###  blindAggregate

▸ **blindAggregate**(): *Buffer | undefined*

*Defined in [packages/sdk/encrypted-backup/src/poprf.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/poprf.ts#L80)*

If there are enough responses added to this combiner instance, aggregates the current
collection of blind partial evaluations to a single blind threshold evaluation.

**`remarks`** This method does not verify any of the responses. Verification only occurs during
unblinding.

**Returns:** *Buffer | undefined*

A buffer with a blind aggregated POPRF evaluation response, or undefined if there are
less than the threshold number of responses available.
