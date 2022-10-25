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

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L152)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata) |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)*

## Properties

###  data

• **data**: *[IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata)*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L32)*

## Accessors

###  claims

• **get claims**(): *object | object | object | object | object | object[]*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:158](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L158)*

**Returns:** *object | object | object | object | object | object[]*

## Methods

###  addClaim

▸ **addClaim**(`claim`: [Claim](../modules/_identity_claims_claim_.md#claim), `signer`: Signer): *Promise‹[Claim](../modules/_identity_claims_claim_.md#claim)›*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L173)*

**Parameters:**

Name | Type |
------ | ------ |
`claim` | [Claim](../modules/_identity_claims_claim_.md#claim) |
`signer` | Signer |

**Returns:** *Promise‹[Claim](../modules/_identity_claims_claim_.md#claim)›*

___

###  filterClaims

▸ **filterClaims**<**K**>(`type`: K): *Array‹[ClaimPayload](../modules/_identity_claims_claim_.md#claimpayload)‹K››*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:213](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L213)*

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

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:209](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L209)*

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

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:162](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L162)*

**Returns:** *string*

___

###  toString

▸ **toString**(): *string*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:166](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L166)*

**Returns:** *string*

___

### `Static` fetchFromURL

▸ **fetchFromURL**(`contractKitOrAccountsWrapper`: KitOrAccountsWrapper, `url`: string, `tries`: number): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L44)*

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

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹›*

___

### `Static` fromFile

▸ **fromFile**(`contractKitOrAccountsWrapper`: KitOrAccountsWrapper, `path`: string): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`contractKitOrAccountsWrapper` | KitOrAccountsWrapper |
`path` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` fromRawString

▸ **fromRawString**(`contractKitOrAccountsWrapper`: KitOrAccountsWrapper, `rawData`: string): *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L111)*

**Parameters:**

Name | Type |
------ | ------ |
`contractKitOrAccountsWrapper` | KitOrAccountsWrapper |
`rawData` | string |

**Returns:** *Promise‹[IdentityMetadataWrapper](_identity_metadata_.identitymetadatawrapper.md)‹››*

___

### `Static` verifySigner

▸ **verifySigner**(`contractKitOrAccountsWrapper`: KitOrAccountsWrapper, `hash`: any, `signature`: any, `metadata`: any): *Promise‹boolean›*

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L74)*

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

*Defined in [packages/sdk/contractkit/src/identity/metadata.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`contractKitOrAccountsWrapper` | KitOrAccountsWrapper |
`hash` | any |
`signature` | any |
`address` | Address |

**Returns:** *Promise‹boolean›*
