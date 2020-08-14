# Class: AddressRegistry

Celo Core Contract's Address Registry

## Hierarchy

* **AddressRegistry**

## Index

### Constructors

* [constructor](_address_registry_.addressregistry.md#constructor)

### Methods

* [addressFor](_address_registry_.addressregistry.md#addressfor)
* [allAddresses](_address_registry_.addressregistry.md#alladdresses)

## Constructors

###  constructor

\+ **new AddressRegistry**(`kit`: [ContractKit](_kit_.contractkit.md)): *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [contractkit/src/address-registry.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/address-registry.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[AddressRegistry](_address_registry_.addressregistry.md)*

## Methods

###  addressFor

▸ **addressFor**(`contract`: [CeloContract](../enums/_base_.celocontract.md)): *Promise‹[Address](../modules/_base_.md#address)›*

*Defined in [contractkit/src/address-registry.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/address-registry.ts#L27)*

Get the address for a `CeloContract`

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)›*

___

###  allAddresses

▸ **allAddresses**(): *Promise‹Record‹[CeloContract](../enums/_base_.celocontract.md), [Address](../modules/_base_.md#address)››*

*Defined in [contractkit/src/address-registry.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/address-registry.ts#L48)*

Get the address for all possible `CeloContract`

**Returns:** *Promise‹Record‹[CeloContract](../enums/_base_.celocontract.md), [Address](../modules/_base_.md#address)››*
