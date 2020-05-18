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

* [args](_governance_proposals_.proposaltransactionjson.md#args)
* [contract](_governance_proposals_.proposaltransactionjson.md#contract)
* [function](_governance_proposals_.proposaltransactionjson.md#function)
* [params](_governance_proposals_.proposaltransactionjson.md#optional-params)
* [value](_governance_proposals_.proposaltransactionjson.md#value)

## Properties

### args

• **args**: _any\[\]_

_Defined in_ [_contractkit/src/governance/proposals.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L39)

### contract

• **contract**: [_CeloContract_](../enums/_base_.celocontract.md)

_Defined in_ [_contractkit/src/governance/proposals.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L37)

### function

• **function**: _string_

_Defined in_ [_contractkit/src/governance/proposals.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L38)

### `Optional` params

• **params**? : _Record‹string, any›_

_Defined in_ [_contractkit/src/governance/proposals.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L40)

### value

• **value**: _string_

_Defined in_ [_contractkit/src/governance/proposals.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L41)

