# Class: IdentityMetadataWrapper

## Hierarchy

* **IdentityMetadataWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#constructor)

### Properties

* [data](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#data)

### Accessors

* [claims](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#claims)

### Methods

* [addClaim](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#addclaim)
* [filterClaims](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#filterclaims)
* [findClaim](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#findclaim)
* [hashOfClaims](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#hashofclaims)
* [toString](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#tostring)
* [fetchFromURL](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#static-fetchfromurl)
* [fromEmpty](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#static-fromempty)
* [fromFile](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#static-fromfile)
* [fromRawString](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#static-fromrawstring)
* [verifySigner](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#static-verifysigner)

## Constructors

###  constructor

\+ **new IdentityMetadataWrapper**(`data`: [IdentityMetadata](../modules/_contractkit_src_identity_metadata_.md#identitymetadata)): *[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)*

*Defined in [contractkit/src/identity/metadata.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [IdentityMetadata](../modules/_contractkit_src_identity_metadata_.md#identitymetadata) |

**Returns:** *[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)*

## Properties

###  data

• **data**: *[IdentityMetadata](../modules/_contractkit_src_identity_metadata_.md#identitymetadata)*

*Defined in [contractkit/src/identity/metadata.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L26)*

## Accessors

###  claims

• **get claims**(): *object | object | object | object | object[]*

*Defined in [contractkit/src/identity/metadata.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L110)*

**Returns:** *object | object | object | object | object[]*

## Methods

###  addClaim

▸ **addClaim**(`claim`: [Claim](../modules/_contractkit_src_identity_claims_claim_.md#claim), `signer`: Signer): *Promise‹void›*

*Defined in [contractkit/src/identity/metadata.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L125)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](../modules/_contractkit_src_identity_claims_claim_.md#claim) |
`signer` | Signer |

**Returns:** *Promise‹void›*

___

###  filterClaims

▸ **filterClaims**<**K**>(`type`: K): *Array‹[ClaimPayload](../modules/_contractkit_src_identity_claims_claim_.md#claimpayload)‹K››*

*Defined in [contractkit/src/identity/metadata.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L152)*

**Type parameters:**

▪ **K**: *[ClaimTypes](../enums/_contractkit_src_identity_claims_types_.claimtypes.md)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | K |

**Returns:** *Array‹[ClaimPayload](../modules/_contractkit_src_identity_claims_claim_.md#claimpayload)‹K››*

___

###  findClaim

▸ **findClaim**<**K**>(`type`: K): *[ClaimPayload](../modules/_contractkit_src_identity_claims_claim_.md#claimpayload)‹K› | undefined*

*Defined in [contractkit/src/identity/metadata.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L148)*

**Type parameters:**

▪ **K**: *[ClaimTypes](../enums/_contractkit_src_identity_claims_types_.claimtypes.md)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | K |

**Returns:** *[ClaimPayload](../modules/_contractkit_src_identity_claims_claim_.md#claimpayload)‹K› | undefined*

___

###  hashOfClaims

▸ **hashOfClaims**(): *string*

*Defined in [contractkit/src/identity/metadata.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L114)*

**Returns:** *string*

___

###  toString

▸ **toString**(): *string*

*Defined in [contractkit/src/identity/metadata.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L118)*

**Returns:** *string*

___

### `Static` fetchFromURL

▸ **fetchFromURL**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `url`: string): *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [contractkit/src/identity/metadata.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`url` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromEmpty

▸ **fromEmpty**(`address`: string): *[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹›*

*Defined in [contractkit/src/identity/metadata.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹›*

___

### `Static` fromFile

▸ **fromFile**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `path`: string): *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [contractkit/src/identity/metadata.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`path` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromRawString

▸ **fromRawString**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `rawData`: string): *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [contractkit/src/identity/metadata.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`rawData` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` verifySigner

▸ **verifySigner**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `hash`: any, `signature`: any, `metadata`: any): *Promise‹boolean›*

*Defined in [contractkit/src/identity/metadata.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`hash` | any |
`signature` | any |
`metadata` | any |

**Returns:** *Promise‹boolean›*
