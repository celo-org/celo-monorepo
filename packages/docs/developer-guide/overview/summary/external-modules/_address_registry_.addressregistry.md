# AddressRegistry

Celo Core Contract's Address Registry

## Hierarchy

* **AddressRegistry**

## Index

### Constructors

* [constructor]()

### Methods

* [addressFor]()
* [allAddresses]()

## Constructors

### constructor

+ **new AddressRegistry**\(`kit`: [ContractKit]()\): [_AddressRegistry_]()

_Defined in_ [_contractkit/src/address-registry.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/address-registry.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |

**Returns:** [_AddressRegistry_]()

## Methods

### addressFor

▸ **addressFor**\(`contract`: [CeloContract]()\): _Promise‹_[_Address_](_base_.md#address)_›_

_Defined in_ [_contractkit/src/address-registry.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/address-registry.ts#L27)

Get the address for a `CeloContract`

**Parameters:**

| Name | Type |
| :--- | :--- |
| `contract` | [CeloContract]() |

**Returns:** _Promise‹_[_Address_](_base_.md#address)_›_

### allAddresses

▸ **allAddresses**\(\): _Promise‹Record‹_[_CeloContract_]()_,_ [_Address_](_base_.md#address)_››_

_Defined in_ [_contractkit/src/address-registry.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/address-registry.ts#L48)

Get the address for all possible `CeloContract`

**Returns:** _Promise‹Record‹_[_CeloContract_]()_,_ [_Address_](_base_.md#address)_››_

