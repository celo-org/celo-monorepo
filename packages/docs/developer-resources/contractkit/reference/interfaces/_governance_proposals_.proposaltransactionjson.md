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

* [args](_governance_proposals_.proposaltransactionjson.md#args)
* [contract](_governance_proposals_.proposaltransactionjson.md#contract)
* [function](_governance_proposals_.proposaltransactionjson.md#function)
* [params](_governance_proposals_.proposaltransactionjson.md#optional-params)
* [value](_governance_proposals_.proposaltransactionjson.md#value)

## Properties

###  args

• **args**: *any[]*

*Defined in [packages/contractkit/src/governance/proposals.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L49)*

___

###  contract

• **contract**: *[CeloContract](../enums/_base_.celocontract.md)*

*Defined in [packages/contractkit/src/governance/proposals.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L47)*

___

###  function

• **function**: *string*

*Defined in [packages/contractkit/src/governance/proposals.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L48)*

___

### `Optional` params

• **params**? : *Record‹string, any›*

*Defined in [packages/contractkit/src/governance/proposals.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L50)*

___

###  value

• **value**: *string*

*Defined in [packages/contractkit/src/governance/proposals.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L51)*
