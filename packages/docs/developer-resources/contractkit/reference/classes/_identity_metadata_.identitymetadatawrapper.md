# Class: IdentityMetadataWrapper

## Hierarchy

* **IdentityMetadataWrapper**

## Index

### Constructors

* [constructor](_identity_metadata_.identitymetadatawrapper.md#constructor)

### Properties

* [data](_identity_metadata_.identitymetadatawrapper.md#data)

### Accessors

* [claims](_identity_metadata_.identitymetadatawrapper.md#claims)

### Methods

* [addClaim](_identity_metadata_.identitymetadatawrapper.md#addclaim)
* [filterClaims](_identity_metadata_.identitymetadatawrapper.md#filterclaims)
* [findClaim](_identity_metadata_.identitymetadatawrapper.md#findclaim)
* [hashOfClaims](_identity_metadata_.identitymetadatawrapper.md#hashofclaims)
* [toString](_identity_metadata_.identitymetadatawrapper.md#tostring)
* [fetchFromURL](_identity_metadata_.identitymetadatawrapper.md#static-fetchfromurl)
* [fromEmpty](_identity_metadata_.identitymetadatawrapper.md#static-fromempty)
* [fromFile](_identity_metadata_.identitymetadatawrapper.md#static-fromfile)
* [fromRawString](_identity_metadata_.identitymetadatawrapper.md#static-fromrawstring)

## Constructors

###  constructor

\+ **new IdentityMetadataWrapper**(`data`: [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata)): *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)*

*Defined in [packages/contractkit/src/identity/metadata.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata) |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)*

## Properties

###  data

• **data**: *[IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata)*

*Defined in [packages/contractkit/src/identity/metadata.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L24)*

## Accessors

###  claims

• **get claims**(): *object | object | object | object | object[]*

*Defined in [packages/contractkit/src/identity/metadata.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L85)*

**Returns:** *object | object | object | object | object[]*

## Methods

###  addClaim

▸ **addClaim**(`claim`: [Claim](../modules/_identity_claims_claim_.md#claim), `signer`: Signer): *Promise‹void›*

*Defined in [packages/contractkit/src/identity/metadata.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](../modules/_identity_claims_claim_.md#claim) |
`signer` | Signer |

**Returns:** *Promise‹void›*

___

###  filterClaims

▸ **filterClaims**<**K**>(`type`: K): *Array‹[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K››*

*Defined in [packages/contractkit/src/identity/metadata.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L127)*

**Type parameters:**

▪ **K**: *[ClaimTypes](../enums/_identity_claims_types_.claimtypes.md)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | K |

**Returns:** *Array‹[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K››*

___

###  findClaim

▸ **findClaim**<**K**>(`type`: K): *[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K› | undefined*

*Defined in [packages/contractkit/src/identity/metadata.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L123)*

**Type parameters:**

▪ **K**: *[ClaimTypes](../enums/_identity_claims_types_.claimtypes.md)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | K |

**Returns:** *[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K› | undefined*

___

###  hashOfClaims

▸ **hashOfClaims**(): *string*

*Defined in [packages/contractkit/src/identity/metadata.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L89)*

**Returns:** *string*

___

###  toString

▸ **toString**(): *string*

*Defined in [packages/contractkit/src/identity/metadata.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L93)*

**Returns:** *string*

___

### `Static` fetchFromURL

▸ **fetchFromURL**(`url`: string): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/contractkit/src/identity/metadata.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`url` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromEmpty

▸ **fromEmpty**(`address`: string): *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

*Defined in [packages/contractkit/src/identity/metadata.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

___

### `Static` fromFile

▸ **fromFile**(`path`: string): *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

*Defined in [packages/contractkit/src/identity/metadata.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`path` | string |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

___

### `Static` fromRawString

▸ **fromRawString**(`rawData`: string): *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

*Defined in [packages/contractkit/src/identity/metadata.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`rawData` | string |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*
