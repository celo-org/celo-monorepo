# IdentityMetadataWrapper

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

### constructor

+ **new IdentityMetadataWrapper**\(`data`: [IdentityMetadata](../external-modules/_identity_metadata_.md#identitymetadata)\): [_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)

_Defined in_ [_contractkit/src/identity/metadata.ts:119_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L119)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | [IdentityMetadata](../external-modules/_identity_metadata_.md#identitymetadata) |

**Returns:** [_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)

## Properties

### data

• **data**: [_IdentityMetadata_](../external-modules/_identity_metadata_.md#identitymetadata)

_Defined in_ [_contractkit/src/identity/metadata.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L27)

## Accessors

### claims

• **get claims**\(\): _object \| object \| object \| object \| object\[\]_

_Defined in_ [_contractkit/src/identity/metadata.ts:125_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L125)

**Returns:** _object \| object \| object \| object \| object\[\]_

## Methods

### addClaim

▸ **addClaim**\(`claim`: [Claim](../external-modules/_identity_claims_claim_.md#claim), `signer`: Signer\): _Promise‹object \| object \| object \| object \| object›_

_Defined in_ [_contractkit/src/identity/metadata.ts:140_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L140)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `claim` | [Claim](../external-modules/_identity_claims_claim_.md#claim) |
| `signer` | Signer |

**Returns:** _Promise‹object \| object \| object \| object \| object›_

### filterClaims

▸ **filterClaims**&lt;**K**&gt;\(`type`: K\): _Array‹_[_ClaimPayload_](../external-modules/_identity_claims_claim_.md#claimpayload)_‹K››_

_Defined in_ [_contractkit/src/identity/metadata.ts:180_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L180)

**Type parameters:**

▪ **K**: [_ClaimTypes_](../enums/_identity_claims_types_.claimtypes.md)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | K |

**Returns:** _Array‹_[_ClaimPayload_](../external-modules/_identity_claims_claim_.md#claimpayload)_‹K››_

### findClaim

▸ **findClaim**&lt;**K**&gt;\(`type`: K\): [_ClaimPayload_](../external-modules/_identity_claims_claim_.md#claimpayload)_‹K› \| undefined_

_Defined in_ [_contractkit/src/identity/metadata.ts:176_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L176)

**Type parameters:**

▪ **K**: [_ClaimTypes_](../enums/_identity_claims_types_.claimtypes.md)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | K |

**Returns:** [_ClaimPayload_](../external-modules/_identity_claims_claim_.md#claimpayload)_‹K› \| undefined_

### hashOfClaims

▸ **hashOfClaims**\(\): _string_

_Defined in_ [_contractkit/src/identity/metadata.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L129)

**Returns:** _string_

### toString

▸ **toString**\(\): _string_

_Defined in_ [_contractkit/src/identity/metadata.ts:133_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L133)

**Returns:** _string_

### `Static` fetchFromURL

▸ **fetchFromURL**\(`kit`: [ContractKit](_kit_.contractkit.md), `url`: string\): _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L39)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `url` | string |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

### `Static` fromEmpty

▸ **fromEmpty**\(`address`: string\): [_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹›_

_Defined in_ [_contractkit/src/identity/metadata.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L29)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** [_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹›_

### `Static` fromFile

▸ **fromFile**\(`kit`: [ContractKit](_kit_.contractkit.md), `path`: string\): _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L47)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `path` | string |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

### `Static` fromRawString

▸ **fromRawString**\(`kit`: [ContractKit](_kit_.contractkit.md), `rawData`: string\): _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L78)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `rawData` | string |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

### `Static` verifySigner

▸ **verifySigner**\(`kit`: [ContractKit](_kit_.contractkit.md), `hash`: any, `signature`: any, `metadata`: any\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/identity/metadata.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L51)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `hash` | any |
| `signature` | any |
| `metadata` | any |

**Returns:** _Promise‹boolean›_

### `Static` verifySignerForAddress

▸ **verifySignerForAddress**\(`kit`: [ContractKit](_kit_.contractkit.md), `hash`: any, `signature`: any, `address`: string\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/identity/metadata.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L55)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `hash` | any |
| `signature` | any |
| `address` | string |

**Returns:** _Promise‹boolean›_

