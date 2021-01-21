# AddressRegistry

Celo Core Contract's Address Registry

## Hierarchy

* **AddressRegistry**

## Index

### Constructors

* [constructor]()

### Methods

* [addressFor]()
* [addressMapping]()

## Constructors

### constructor

+ **new AddressRegistry**\(`kit`: [ContractKit]()\): [_AddressRegistry_]()

_Defined in_ [_contractkit/src/address-registry.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L18)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |

**Returns:** [_AddressRegistry_]()

## Methods

### addressFor

▸ **addressFor**\(`contract`: [CeloContract]()\): _Promise‹Address›_

_Defined in_ [_contractkit/src/address-registry.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L28)

Get the address for a `CeloContract`

**Parameters:**

| Name | Type |
| :--- | :--- |
| `contract` | [CeloContract]() |

**Returns:** _Promise‹Address›_

### addressMapping

▸ **addressMapping**\(\): _Promise‹Map‹_[_CeloContract_]()_, string››_

_Defined in_ [_contractkit/src/address-registry.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/address-registry.ts#L47)

Get the address mapping for known registered contracts

**Returns:** _Promise‹Map‹_[_CeloContract_]()_, string››_

