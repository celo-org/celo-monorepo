[@celo/contractkit](../README.md) › ["address-registry"](../modules/_address_registry_.md) › [AddressRegistry](_address_registry_.addressregistry.md)

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

*Defined in [packages/sdk/contractkit/src/address-registry.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[AddressRegistry](_address_registry_.addressregistry.md)*

## Methods

###  addressFor

▸ **addressFor**(`contract`: [CeloContract](../enums/_base_.celocontract.md)): *Promise‹Address›*

*Defined in [packages/sdk/contractkit/src/address-registry.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L33)*

Get the address for a `CeloContract`

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** *Promise‹Address›*

___

###  addressMapping

▸ **addressMapping**(): *Promise‹Map‹[CeloContract](../enums/_base_.celocontract.md), string››*

*Defined in [packages/sdk/contractkit/src/address-registry.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L51)*

Get the address mapping for known registered contracts

**Returns:** *Promise‹Map‹[CeloContract](../enums/_base_.celocontract.md), string››*
