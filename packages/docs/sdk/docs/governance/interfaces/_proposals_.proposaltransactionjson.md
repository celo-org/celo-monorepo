[@celo/governance](../README.md) › ["proposals"](../modules/_proposals_.md) › [ProposalTransactionJSON](_proposals_.proposaltransactionjson.md)

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

*Defined in [proposals.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L72)*

___

###  contract

• **contract**: *CeloContract*

*Defined in [proposals.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L70)*

___

###  function

• **function**: *string*

*Defined in [proposals.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L71)*

___

### `Optional` params

• **params**? : *Record‹string, any›*

*Defined in [proposals.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L73)*

___

###  value

• **value**: *string*

*Defined in [proposals.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/governance/src/proposals.ts#L74)*
