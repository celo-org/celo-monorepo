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

*Defined in [packages/contractkit/src/governance/proposals.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L42)*

___

###  contract

• **contract**: *[CeloContract](../enums/_base_.celocontract.md)*

*Defined in [packages/contractkit/src/governance/proposals.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L40)*

___

###  function

• **function**: *string*

*Defined in [packages/contractkit/src/governance/proposals.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L41)*

___

### `Optional` params

• **params**? : *Record‹string, any›*

*Defined in [packages/contractkit/src/governance/proposals.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L43)*

___

###  value

• **value**: *string*

*Defined in [packages/contractkit/src/governance/proposals.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proposals.ts#L44)*
