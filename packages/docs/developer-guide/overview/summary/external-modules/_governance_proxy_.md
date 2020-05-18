# governance/proxy

## Index

### Variables

* [PROXY\_ABI](_governance_proxy_.md#const-proxy_abi)

### Functions

* [getImplementationOfProxy](_governance_proxy_.md#const-getimplementationofproxy)
* [setImplementationOnProxy](_governance_proxy_.md#const-setimplementationonproxy)

## Variables

### `Const` PROXY\_ABI

• **PROXY\_ABI**: _ABIDefinition\[\]_ = \[ { constant: true, inputs: \[\], name: '\_getImplementation', outputs: \[ { name: 'implementation', type: 'address', }, \], payable: false, stateMutability: 'view', type: 'function', signature: '0x42404e07', }, { constant: false, inputs: \[ { name: 'implementation', type: 'address', }, \], name: '\_setImplementation', outputs: \[\], payable: false, stateMutability: 'nonpayable', type: 'function', signature: '0xbb913f41', }, \]

_Defined in_ [_contractkit/src/governance/proxy.ts:4_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L4)

## Functions

### `Const` getImplementationOfProxy

▸ **getImplementationOfProxy**\(`web3`: Web3, `proxyContractAddress`: string\): _Promise‹string›_

_Defined in_ [_contractkit/src/governance/proxy.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L37)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `web3` | Web3 |
| `proxyContractAddress` | string |

**Returns:** _Promise‹string›_

### `Const` setImplementationOnProxy

▸ **setImplementationOnProxy**\(`address`: string\): _any_

_Defined in_ [_contractkit/src/governance/proxy.ts:45_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/governance/proxy.ts#L45)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _any_

