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

+ **new IdentityMetadataWrapper**\(`data`: [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata)\): [_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)

_Defined in_ [_contractkit/src/identity/metadata.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L128)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | [IdentityMetadata](../modules/_identity_metadata_.md#identitymetadata) |

**Returns:** [_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)

## Properties

### data

• **data**: [_IdentityMetadata_](../modules/_identity_metadata_.md#identitymetadata)

_Defined in_ [_contractkit/src/identity/metadata.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L29)

## Accessors

### claims

• **get claims**\(\): _object \| object \| object \| object \| object \| object\[\]_

_Defined in_ [_contractkit/src/identity/metadata.ts:134_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L134)

**Returns:** _object \| object \| object \| object \| object \| object\[\]_

## Methods

### addClaim

▸ **addClaim**\(`claim`: [Claim](../modules/_identity_claims_claim_.md#claim), `signer`: Signer\): _Promise‹object \| object \| object \| object \| object \| object›_

_Defined in_ [_contractkit/src/identity/metadata.ts:149_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L149)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `claim` | [Claim](../modules/_identity_claims_claim_.md#claim) |
| `signer` | Signer |

**Returns:** _Promise‹object \| object \| object \| object \| object \| object›_

### filterClaims

▸ **filterClaims**&lt;**K**&gt;\(`type`: K\): _Array‹_[_ClaimPayload_](../modules/_identity_claims_claim_.md#claimpayload)_‹K››_

_Defined in_ [_contractkit/src/identity/metadata.ts:189_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L189)

**Type parameters:**

▪ **K**: [_ClaimTypes_](../modules/_identity_metadata_.md#claimtypes)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | K |

**Returns:** _Array‹_[_ClaimPayload_](../modules/_identity_claims_claim_.md#claimpayload)_‹K››_

### findClaim

▸ **findClaim**&lt;**K**&gt;\(`type`: K\): [_ClaimPayload_](../modules/_identity_claims_claim_.md#claimpayload)_‹K› \| undefined_

_Defined in_ [_contractkit/src/identity/metadata.ts:185_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L185)

**Type parameters:**

▪ **K**: [_ClaimTypes_](../modules/_identity_metadata_.md#claimtypes)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | K |

**Returns:** [_ClaimPayload_](../modules/_identity_claims_claim_.md#claimpayload)_‹K› \| undefined_

### hashOfClaims

▸ **hashOfClaims**\(\): _string_

_Defined in_ [_contractkit/src/identity/metadata.ts:138_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L138)

**Returns:** _string_

### toString

▸ **toString**\(\): _string_

_Defined in_ [_contractkit/src/identity/metadata.ts:142_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L142)

**Returns:** _string_

### `Static` fetchFromURL

▸ **fetchFromURL**\(`kit`: [ContractKit](_kit_.contractkit.md), `url`: string, `tries`: number\): _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L41)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) | - |
| `url` | string | - |
| `tries` | number | 3 |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

### `Static` fromEmpty

▸ **fromEmpty**\(`address`: Address\): [_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹›_

_Defined in_ [_contractkit/src/identity/metadata.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L31)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |

**Returns:** [_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹›_

### `Static` fromFile

▸ **fromFile**\(`kit`: [ContractKit](_kit_.contractkit.md), `path`: string\): _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L56)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `path` | string |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

### `Static` fromRawString

▸ **fromRawString**\(`kit`: [ContractKit](_kit_.contractkit.md), `rawData`: string\): _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L87)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `rawData` | string |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_](_identity_metadata_.identitymetadatawrapper.md)_‹››_

### `Static` verifySigner

▸ **verifySigner**\(`kit`: [ContractKit](_kit_.contractkit.md), `hash`: any, `signature`: any, `metadata`: any\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/identity/metadata.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L60)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `hash` | any |
| `signature` | any |
| `metadata` | any |

**Returns:** _Promise‹boolean›_

### `Static` verifySignerForAddress

▸ **verifySignerForAddress**\(`kit`: [ContractKit](_kit_.contractkit.md), `hash`: any, `signature`: any, `address`: Address\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/identity/metadata.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L64)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `hash` | any |
| `signature` | any |
| `address` | Address |

**Returns:** _Promise‹boolean›_

