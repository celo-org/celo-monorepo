[@celo/utils](../README.md) › ["typed-data-constructors"](_typed_data_constructors_.md)

# Module: "typed-data-constructors"

## Index

### Functions

* [authorizeSigner](_typed_data_constructors_.md#const-authorizesigner)
* [registerAttestation](_typed_data_constructors_.md#const-registerattestation)

## Functions

### `Const` authorizeSigner

▸ **authorizeSigner**(`__namedParameters`: object): *[EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md)*

*Defined in [typed-data-constructors.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/typed-data-constructors.ts#L4)*

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

___

### `Const` registerAttestation

▸ **registerAttestation**(`chainId`: number, `contractAddress`: [Address](_address_.md#address), `message?`: AttestationDetails): *object*

*Defined in [typed-data-constructors.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/typed-data-constructors.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`chainId` | number |
`contractAddress` | [Address](_address_.md#address) |
`message?` | AttestationDetails |

**Returns:** *object*

* **message**: *AttestationDetails | object* = message ? message : {}

* **primaryType**: *string* = "OwnershipAttestation"

* ### **domain**: *object*

  * **chainId**: *number*

  * **name**: *string* = "FederatedAttestations"

  * **verifyingContract**: *string* = contractAddress

  * **version**: *string* = "1.0"

* ### **types**: *object*

  * **EIP712Domain**: *object[]* = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ]

  * **OwnershipAttestation**: *object[]* = [
        { name: 'identifier', type: 'bytes32' },
        { name: 'issuer', type: 'address' },
        { name: 'account', type: 'address' },
        { name: 'signer', type: 'address' },
        { name: 'issuedOn', type: 'uint64' },
      ]
