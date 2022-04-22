[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["address-registry"](../modules/_address_registry_.md) › [AddressRegistry](_address_registry_.addressregistry.md)

# Class: AddressRegistry

Celo Core Contract's Address Registry

**`param`** – an instance of @celo/connect {@link Connection}

## Hierarchy

* **AddressRegistry**

## Index

### Constructors

* [constructor](_address_registry_.addressregistry.md#constructor)

### Properties

* [connection](_address_registry_.addressregistry.md#readonly-connection)

### Methods

* [addressFor](_address_registry_.addressregistry.md#addressfor)
* [addressMapping](_address_registry_.addressregistry.md#addressmapping)

## Constructors

###  constructor

\+ **new AddressRegistry**(`connection`: Connection): *[AddressRegistry](_address_registry_.addressregistry.md)*

*Defined in [packages/sdk/contractkit/src/address-registry.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |

**Returns:** *[AddressRegistry](_address_registry_.addressregistry.md)*

## Properties

### `Readonly` connection

• **connection**: *Connection*

*Defined in [packages/sdk/contractkit/src/address-registry.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L27)*

## Methods

###  addressFor

▸ **addressFor**(`contract`: [CeloContract](../enums/_base_.celocontract.md)): *Promise‹Address›*

*Defined in [packages/sdk/contractkit/src/address-registry.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L35)*

Get the address for a `CeloContract`

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** *Promise‹Address›*

___

###  addressMapping

▸ **addressMapping**(): *Promise‹Map‹[CeloContract](../enums/_base_.celocontract.md), string››*

*Defined in [packages/sdk/contractkit/src/address-registry.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L53)*

Get the address mapping for known registered contracts

**Returns:** *Promise‹Map‹[CeloContract](../enums/_base_.celocontract.md), string››*
