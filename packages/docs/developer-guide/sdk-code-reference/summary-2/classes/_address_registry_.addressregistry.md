# AddressRegistry

Celo Core Contract's Address Registry

## Hierarchy

* **AddressRegistry**

## Index

### Constructors

* [constructor](_address_registry_.addressregistry.md#constructor)

### Methods

* [addressFor](_address_registry_.addressregistry.md#addressfor)
* [addressMapping](_address_registry_.addressregistry.md#addressmapping)

## Constructors

### constructor

+ **new AddressRegistry**\(`kit`: [ContractKit](_kit_.contractkit.md)\): [_AddressRegistry_](_address_registry_.addressregistry.md)

_Defined in_ [_contractkit/src/address-registry.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L18)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** [_AddressRegistry_](_address_registry_.addressregistry.md)

## Methods

### addressFor

▸ **addressFor**\(`contract`: [CeloContract](../enums/_base_.celocontract.md)\): _Promise‹Address›_

_Defined in_ [_contractkit/src/address-registry.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L28)

Get the address for a `CeloContract`

**Parameters:**

| Name | Type |
| :--- | :--- |
| `contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** _Promise‹Address›_

### addressMapping

▸ **addressMapping**\(\): _Promise‹Map‹_[_CeloContract_](../enums/_base_.celocontract.md)_, string››_

_Defined in_ [_contractkit/src/address-registry.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L47)

Get the address mapping for known registered contracts

**Returns:** _Promise‹Map‹_[_CeloContract_](../enums/_base_.celocontract.md)_, string››_

