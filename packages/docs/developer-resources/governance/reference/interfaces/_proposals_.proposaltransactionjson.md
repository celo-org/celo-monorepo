# Interface: ProposalTransactionJSON

JSON encoding of a proposal transaction.

Example:
```json
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

* [args](_proposals_.proposaltransactionjson.md#args)
* [contract](_proposals_.proposaltransactionjson.md#contract)
* [function](_proposals_.proposaltransactionjson.md#function)
* [params](_proposals_.proposaltransactionjson.md#optional-params)
* [value](_proposals_.proposaltransactionjson.md#value)

## Properties

###  args

• **args**: *any[]*

*Defined in [proposals.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L62)*

___

###  contract

• **contract**: *CeloContract*

*Defined in [proposals.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L60)*

___

###  function

• **function**: *string*

*Defined in [proposals.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L61)*

___

### `Optional` params

• **params**? : *Record‹string, any›*

*Defined in [proposals.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L63)*

___

###  value

• **value**: *string*

*Defined in [proposals.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L64)*
