[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["identity/metadata"](../modules/_identity_metadata_.md) › [IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)

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

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:146](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L146)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata) |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)*

## Properties

###  data

• **data**: *[IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata)*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L33)*

## Accessors

###  claims

• **get claims**(): *object | object | object | object | object | object[]*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L152)*

**Returns:** *object | object | object | object | object | object[]*

## Methods

###  addClaim

▸ **addClaim**(`claim`: [Claim](../modules/_identity_claims_claim_.md#claim), `signer`: Signer): *Promise‹[Claim](../modules/_identity_claims_claim_.md#claim)›*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L167)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](../modules/_identity_claims_claim_.md#claim) |
`signer` | Signer |

**Returns:** *Promise‹[Claim](../modules/_identity_claims_claim_.md#claim)›*

___

###  filterClaims

▸ **filterClaims**<**K**>(`type`: K): *Array‹[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K››*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:207](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L207)*

**Type parameters:**

▪ **K**: *[ClaimTypes](../modules/_identity_metadata_.md#claimtypes)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | K |

**Returns:** *Array‹[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K››*

___

###  findClaim

▸ **findClaim**<**K**>(`type`: K): *[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K› | undefined*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:203](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L203)*

**Type parameters:**

▪ **K**: *[ClaimTypes](../modules/_identity_metadata_.md#claimtypes)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | K |

**Returns:** *[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K› | undefined*

___

###  hashOfClaims

▸ **hashOfClaims**(): *string*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L156)*

**Returns:** *string*

___

###  toString

▸ **toString**(): *string*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L160)*

**Returns:** *string*

___

### `Static` fetchFromURL

▸ **fetchFromURL**(`contractKitOrAccountsWrapper`: KitOrAccountsWrapper, `url`: string, `tries`: number): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L45)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`contractKitOrAccountsWrapper` | KitOrAccountsWrapper | - |
`url` | string | - |
`tries` | number | 3 |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromEmpty

▸ **fromEmpty**(`address`: Address): *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

___

### `Static` fromFile

▸ **fromFile**(`contractKitOrAccountsWrapper`: KitOrAccountsWrapper, `path`: string): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`contractKitOrAccountsWrapper` | KitOrAccountsWrapper |
`path` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromRawString

▸ **fromRawString**(`contractKitOrAccountsWrapper`: KitOrAccountsWrapper, `rawData`: string): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`contractKitOrAccountsWrapper` | KitOrAccountsWrapper |
`rawData` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` verifySigner

▸ **verifySigner**(`contractKitOrAccountsWrapper`: KitOrAccountsWrapper, `hash`: any, `signature`: any, `metadata`: any): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`contractKitOrAccountsWrapper` | KitOrAccountsWrapper |
`hash` | any |
`signature` | any |
`metadata` | any |

**Returns:** *Promise‹boolean›*

___

### `Static` verifySignerForAddress

▸ **verifySignerForAddress**(`contractKitOrAccountsWrapper`: KitOrAccountsWrapper, `hash`: any, `signature`: any, `address`: Address): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`contractKitOrAccountsWrapper` | KitOrAccountsWrapper |
`hash` | any |
`signature` | any |
`address` | Address |

**Returns:** *Promise‹boolean›*
