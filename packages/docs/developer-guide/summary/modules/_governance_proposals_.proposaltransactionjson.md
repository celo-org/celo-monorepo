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

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L49)

### contract

• **contract**: [_CeloContract_]()

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L47)

### function

• **function**: _string_

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L48)

### `Optional` params

• **params**? : _Record‹string, any›_

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L50)

### value

• **value**: _string_

_Defined in_ [_packages/contractkit/src/governance/proposals.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L51)

