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
* [verifySigner](_identity_metadata_.identitymetadatawrapper.md#static-verifysigner)

## Constructors

###  constructor

\+ **new IdentityMetadataWrapper**(`data`: [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata)): *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)*

*Defined in [contractkit/src/identity/metadata.ts:108](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata) |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)*

## Properties

###  data

• **data**: *[IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata)*

*Defined in [contractkit/src/identity/metadata.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L26)*

## Accessors

###  claims

• **get claims**(): *object | object | object | object | object[]*

*Defined in [contractkit/src/identity/metadata.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L114)*

**Returns:** *object | object | object | object | object[]*

## Methods

###  addClaim

▸ **addClaim**(`claim`: [Claim](../modules/_identity_claims_claim_.md#claim), `signer`: Signer): *Promise‹void›*

*Defined in [contractkit/src/identity/metadata.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L129)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](../modules/_identity_claims_claim_.md#claim) |
`signer` | Signer |

**Returns:** *Promise‹void›*

___

###  filterClaims

▸ **filterClaims**<**K**>(`type`: K): *Array‹[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K››*

*Defined in [contractkit/src/identity/metadata.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L156)*

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

*Defined in [contractkit/src/identity/metadata.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L152)*

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

*Defined in [contractkit/src/identity/metadata.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L118)*

**Returns:** *string*

___

###  toString

▸ **toString**(): *string*

*Defined in [contractkit/src/identity/metadata.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L122)*

**Returns:** *string*

___

### `Static` fetchFromURL

▸ **fetchFromURL**(`url`: string, `kit`: [ContractKit](_kit_.contractkit.md)): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [contractkit/src/identity/metadata.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`url` | string |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromEmpty

▸ **fromEmpty**(`address`: string): *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

*Defined in [contractkit/src/identity/metadata.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

___

### `Static` fromFile

▸ **fromFile**(`path`: string, `kit`: [ContractKit](_kit_.contractkit.md)): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [contractkit/src/identity/metadata.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`path` | string |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromRawString

▸ **fromRawString**(`rawData`: string, `kit`: [ContractKit](_kit_.contractkit.md)): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [contractkit/src/identity/metadata.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`rawData` | string |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` verifySigner

▸ **verifySigner**(`kit`: [ContractKit](_kit_.contractkit.md), `hash`: any, `signature`: any, `metadata`: any): *Promise‹boolean›*

*Defined in [contractkit/src/identity/metadata.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`hash` | any |
`signature` | any |
`metadata` | any |

**Returns:** *Promise‹boolean›*
