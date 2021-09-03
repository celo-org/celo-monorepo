# Class: AddressRegistry

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

###  constructor

\+ **new AddressRegistry**(`kit`: [ContractKit](_kit_.contractkit.md)): *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [contractkit/src/address-registry.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[AddressRegistry](_address_registry_.addressregistry.md)*

## Methods

###  addressFor

▸ **addressFor**(`contract`: [CeloContract](../enums/_base_.celocontract.md)): *Promise‹Address›*

*Defined in [contractkit/src/address-registry.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L28)*

Get the address for a `CeloContract`

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** *Promise‹Address›*

___

###  addressMapping

▸ **addressMapping**(): *Promise‹Map‹[CeloContract](../enums/_base_.celocontract.md), string››*

*Defined in [contractkit/src/address-registry.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L47)*

Get the address mapping for known registered contracts

**Returns:** *Promise‹Map‹[CeloContract](../enums/_base_.celocontract.md), string››*
