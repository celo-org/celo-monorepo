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

_Defined in_ [_packages/contractkit/src/address-registry.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/address-registry.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |

**Returns:** [_AddressRegistry_]()

## Methods

### addressFor

▸ **addressFor**\(`contract`: [CeloContract]()\): _Promise‹_[_Address_]()_›_

_Defined in_ [_packages/contractkit/src/address-registry.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/address-registry.ts#L27)

Get the address for a `CeloContract`

**Parameters:**

| Name | Type |
| :--- | :--- |
| `contract` | [CeloContract]() |

**Returns:** _Promise‹_[_Address_]()_›_

### addressMapping

▸ **addressMapping**\(\): _Promise‹Map‹_[_CeloContract_]()_, string››_

_Defined in_ [_packages/contractkit/src/address-registry.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/address-registry.ts#L46)

Get the address mapping for known registered contracts

**Returns:** _Promise‹Map‹_[_CeloContract_]()_, string››_

