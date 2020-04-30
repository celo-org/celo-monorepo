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
* [verifySignerForAddress](_identity_metadata_.identitymetadatawrapper.md#static-verifysignerforaddress)

## Constructors

###  constructor

\+ **new IdentityMetadataWrapper**(`data`: [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata)): *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)*

*Defined in [contractkit/src/identity/metadata.ts:119](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L119)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata) |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)*

## Properties

###  data

• **data**: *[IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata)*

*Defined in [contractkit/src/identity/metadata.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L27)*

## Accessors

###  claims

• **get claims**(): *object | object | object | object | object[]*

*Defined in [contractkit/src/identity/metadata.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L125)*

**Returns:** *object | object | object | object | object[]*

## Methods

###  addClaim

▸ **addClaim**(`claim`: [Claim](../modules/_identity_claims_claim_.md#claim), `signer`: Signer): *Promise‹object | object | object | object | object›*

*Defined in [contractkit/src/identity/metadata.ts:140](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L140)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](../modules/_identity_claims_claim_.md#claim) |
`signer` | Signer |

**Returns:** *Promise‹object | object | object | object | object›*

___

###  filterClaims

▸ **filterClaims**<**K**>(`type`: K): *Array‹[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K››*

*Defined in [contractkit/src/identity/metadata.ts:180](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L180)*

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

*Defined in [contractkit/src/identity/metadata.ts:176](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L176)*

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

*Defined in [contractkit/src/identity/metadata.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L129)*

**Returns:** *string*

___

###  toString

▸ **toString**(): *string*

*Defined in [contractkit/src/identity/metadata.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L133)*

**Returns:** *string*

___

### `Static` fetchFromURL

▸ **fetchFromURL**(`kit`: [ContractKit](_kit_.contractkit.md), `url`: string): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [contractkit/src/identity/metadata.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`url` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromEmpty

▸ **fromEmpty**(`address`: string): *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

*Defined in [contractkit/src/identity/metadata.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

___

### `Static` fromFile

▸ **fromFile**(`kit`: [ContractKit](_kit_.contractkit.md), `path`: string): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [contractkit/src/identity/metadata.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`path` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromRawString

▸ **fromRawString**(`kit`: [ContractKit](_kit_.contractkit.md), `rawData`: string): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [contractkit/src/identity/metadata.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`rawData` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` verifySigner

▸ **verifySigner**(`kit`: [ContractKit](_kit_.contractkit.md), `hash`: any, `signature`: any, `metadata`: any): *Promise‹boolean›*

*Defined in [contractkit/src/identity/metadata.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`hash` | any |
`signature` | any |
`metadata` | any |

**Returns:** *Promise‹boolean›*

___

### `Static` verifySignerForAddress

▸ **verifySignerForAddress**(`kit`: [ContractKit](_kit_.contractkit.md), `hash`: any, `signature`: any, `address`: string): *Promise‹boolean›*

*Defined in [contractkit/src/identity/metadata.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`hash` | any |
`signature` | any |
`address` | string |

**Returns:** *Promise‹boolean›*
