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

*Defined in [packages/contractkit/src/identity/metadata.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L128)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata) |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)*

## Properties

###  data

• **data**: *[IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata)*

*Defined in [packages/contractkit/src/identity/metadata.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L29)*

## Accessors

###  claims

• **get claims**(): *object | object | object | object | object | object[]*

*Defined in [packages/contractkit/src/identity/metadata.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L134)*

**Returns:** *object | object | object | object | object | object[]*

## Methods

###  addClaim

▸ **addClaim**(`claim`: [Claim](../modules/_identity_claims_claim_.md#claim), `signer`: Signer): *Promise‹object | object | object | object | object | object›*

*Defined in [packages/contractkit/src/identity/metadata.ts:149](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L149)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](../modules/_identity_claims_claim_.md#claim) |
`signer` | Signer |

**Returns:** *Promise‹object | object | object | object | object | object›*

___

###  filterClaims

▸ **filterClaims**<**K**>(`type`: K): *Array‹[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K››*

*Defined in [packages/contractkit/src/identity/metadata.ts:189](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L189)*

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

*Defined in [packages/contractkit/src/identity/metadata.ts:185](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L185)*

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

*Defined in [packages/contractkit/src/identity/metadata.ts:138](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L138)*

**Returns:** *string*

___

###  toString

▸ **toString**(): *string*

*Defined in [packages/contractkit/src/identity/metadata.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L142)*

**Returns:** *string*

___

### `Static` fetchFromURL

▸ **fetchFromURL**(`kit`: [ContractKit](_kit_.contractkit.md), `url`: string, `tries`: number): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/contractkit/src/identity/metadata.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L41)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) | - |
`url` | string | - |
`tries` | number | 3 |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromEmpty

▸ **fromEmpty**(`address`: [Address](../modules/_base_.md#address)): *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

*Defined in [packages/contractkit/src/identity/metadata.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

___

### `Static` fromFile

▸ **fromFile**(`kit`: [ContractKit](_kit_.contractkit.md), `path`: string): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/contractkit/src/identity/metadata.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`path` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromRawString

▸ **fromRawString**(`kit`: [ContractKit](_kit_.contractkit.md), `rawData`: string): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/contractkit/src/identity/metadata.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`rawData` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` verifySigner

▸ **verifySigner**(`kit`: [ContractKit](_kit_.contractkit.md), `hash`: any, `signature`: any, `metadata`: any): *Promise‹boolean›*

*Defined in [packages/contractkit/src/identity/metadata.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L60)*

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

▸ **verifySignerForAddress**(`kit`: [ContractKit](_kit_.contractkit.md), `hash`: any, `signature`: any, `address`: [Address](../modules/_base_.md#address)): *Promise‹boolean›*

*Defined in [packages/contractkit/src/identity/metadata.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`hash` | any |
`signature` | any |
`address` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹boolean›*
