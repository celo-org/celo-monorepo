# ProposalTransactionJSON

JSON encoding of a proposal transaction.

Example:

```javascript
{
  "contract": "Election",
  "function": "setElectableValidators",
  "args": [ "1", "120" ],
  "value": "0"
}
```

## Hierarchy

* **ProposalTransactionJSON**

## Index

### Properties

* [args]()
* [contract]()
* [function]()
* [params]()
* [value]()

## Properties

### args

• **args**: _any\[\]_

_Defined in_ [_proposals.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L62)

### contract

• **contract**: _CeloContract_

_Defined in_ [_proposals.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L60)

### function

• **function**: _string_

_Defined in_ [_proposals.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L61)

### `Optional` params

• **params**? : _Record‹string, any›_

_Defined in_ [_proposals.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L63)

### value

• **value**: _string_

_Defined in_ [_proposals.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L64)

