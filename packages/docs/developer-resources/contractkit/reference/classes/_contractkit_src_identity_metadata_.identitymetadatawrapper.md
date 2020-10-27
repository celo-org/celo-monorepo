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
* [verifySignerForAddress](_contractkit_src_identity_metadata_.identitymetadatawrapper.md#static-verifysignerforaddress)

## Constructors

###  constructor

\+ **new IdentityMetadataWrapper**(`data`: [IdentityMetadata](../modules/_contractkit_src_identity_metadata_.md#identitymetadata)): *[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)*

*Defined in [packages/contractkit/src/identity/metadata.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [IdentityMetadata](../modules/_contractkit_src_identity_metadata_.md#identitymetadata) |

**Returns:** *[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)*

## Properties

###  data

• **data**: *[IdentityMetadata](../modules/_contractkit_src_identity_metadata_.md#identitymetadata)*

*Defined in [packages/contractkit/src/identity/metadata.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L28)*

## Accessors

###  claims

• **get claims**(): *object | object | object | object | object | object[]*

*Defined in [packages/contractkit/src/identity/metadata.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L126)*

**Returns:** *object | object | object | object | object | object[]*

## Methods

###  addClaim

▸ **addClaim**(`claim`: [Claim](../modules/_contractkit_src_identity_claims_claim_.md#claim), `signer`: Signer): *Promise‹object | object | object | object | object | object›*

*Defined in [packages/contractkit/src/identity/metadata.ts:141](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L141)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](../modules/_contractkit_src_identity_claims_claim_.md#claim) |
`signer` | Signer |

**Returns:** *Promise‹object | object | object | object | object | object›*

___

###  filterClaims

▸ **filterClaims**<**K**>(`type`: K): *Array‹[ClaimPayload](../modules/_contractkit_src_identity_claims_claim_.md#claimpayload)‹K››*

*Defined in [packages/contractkit/src/identity/metadata.ts:181](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L181)*

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

*Defined in [packages/contractkit/src/identity/metadata.ts:177](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L177)*

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

*Defined in [packages/contractkit/src/identity/metadata.ts:130](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L130)*

**Returns:** *string*

___

###  toString

▸ **toString**(): *string*

*Defined in [packages/contractkit/src/identity/metadata.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L134)*

**Returns:** *string*

___

### `Static` fetchFromURL

▸ **fetchFromURL**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `url`: string): *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/contractkit/src/identity/metadata.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`url` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromEmpty

▸ **fromEmpty**(`address`: [Address](../modules/_contractkit_src_base_.md#address)): *[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹›*

*Defined in [packages/contractkit/src/identity/metadata.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹›*

___

### `Static` fromFile

▸ **fromFile**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `path`: string): *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/contractkit/src/identity/metadata.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`path` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromRawString

▸ **fromRawString**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `rawData`: string): *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/contractkit/src/identity/metadata.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`rawData` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_contractkit_src_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` verifySigner

▸ **verifySigner**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `hash`: any, `signature`: any, `metadata`: any): *Promise‹boolean›*

*Defined in [packages/contractkit/src/identity/metadata.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`hash` | any |
`signature` | any |
`metadata` | any |

**Returns:** *Promise‹boolean›*

___

### `Static` verifySignerForAddress

▸ **verifySignerForAddress**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `hash`: any, `signature`: any, `address`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹boolean›*

*Defined in [packages/contractkit/src/identity/metadata.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`hash` | any |
`signature` | any |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹boolean›*
