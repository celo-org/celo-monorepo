[@celo/utils](../README.md) › ["typed-data-constructors"](_typed_data_constructors_.md)

# Module: "typed-data-constructors"

## Index

### Functions

* [attestationSecurityCode](_typed_data_constructors_.md#attestationsecuritycode)
* [authorizeSigner](_typed_data_constructors_.md#const-authorizesigner)

## Functions

###  attestationSecurityCode

▸ **attestationSecurityCode**(`code`: string): *[EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md)*

*Defined in [typed-data-constructors.ts:3](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/typed-data-constructors.ts#L3)*

**Parameters:**

Name | Type |
------ | ------ |
`code` | string |

**Returns:** *[EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md)*

___

### `Const` authorizeSigner

▸ **authorizeSigner**(`__namedParameters`: object): *[EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md)*

*Defined in [typed-data-constructors.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/typed-data-constructors.ts#L23)*

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`account` | string |
`accountsContractAddress` | string |
`chainId` | number |
`role` | string |
`signer` | string |

**Returns:** *[EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md)*
