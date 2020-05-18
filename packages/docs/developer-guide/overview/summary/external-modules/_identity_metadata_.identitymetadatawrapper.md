# IdentityMetadataWrapper

## Hierarchy

* **IdentityMetadataWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [data]()

### Accessors

* [claims]()

### Methods

* [addClaim]()
* [filterClaims]()
* [findClaim]()
* [hashOfClaims]()
* [toString]()
* [fetchFromURL]()
* [fromEmpty]()
* [fromFile]()
* [fromRawString]()
* [verifySigner]()
* [verifySignerForAddress]()

## Constructors

### constructor

+ **new IdentityMetadataWrapper**\(`data`: [IdentityMetadata](_identity_metadata_.md#identitymetadata)\): [_IdentityMetadataWrapper_]()

_Defined in_ [_contractkit/src/identity/metadata.ts:119_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L119)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | [IdentityMetadata](_identity_metadata_.md#identitymetadata) |

**Returns:** [_IdentityMetadataWrapper_]()

## Properties

### data

• **data**: [_IdentityMetadata_](_identity_metadata_.md#identitymetadata)

_Defined in_ [_contractkit/src/identity/metadata.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L27)

## Accessors

### claims

• **get claims**\(\): _object \| object \| object \| object \| object\[\]_

_Defined in_ [_contractkit/src/identity/metadata.ts:125_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L125)

**Returns:** _object \| object \| object \| object \| object\[\]_

## Methods

### addClaim

▸ **addClaim**\(`claim`: [Claim](_identity_claims_claim_.md#claim), `signer`: Signer\): _Promise‹object \| object \| object \| object \| object›_

_Defined in_ [_contractkit/src/identity/metadata.ts:140_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L140)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `claim` | [Claim](_identity_claims_claim_.md#claim) |
| `signer` | Signer |

**Returns:** _Promise‹object \| object \| object \| object \| object›_

### filterClaims

▸ **filterClaims**&lt;**K**&gt;\(`type`: K\): _Array‹_[_ClaimPayload_](_identity_claims_claim_.md#claimpayload)_‹K››_

_Defined in_ [_contractkit/src/identity/metadata.ts:180_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L180)

**Type parameters:**

▪ **K**: [_ClaimTypes_]()

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | K |

**Returns:** _Array‹_[_ClaimPayload_](_identity_claims_claim_.md#claimpayload)_‹K››_

### findClaim

▸ **findClaim**&lt;**K**&gt;\(`type`: K\): [_ClaimPayload_](_identity_claims_claim_.md#claimpayload)_‹K› \| undefined_

_Defined in_ [_contractkit/src/identity/metadata.ts:176_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L176)

**Type parameters:**

▪ **K**: [_ClaimTypes_]()

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | K |

**Returns:** [_ClaimPayload_](_identity_claims_claim_.md#claimpayload)_‹K› \| undefined_

### hashOfClaims

▸ **hashOfClaims**\(\): _string_

_Defined in_ [_contractkit/src/identity/metadata.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L129)

**Returns:** _string_

### toString

▸ **toString**\(\): _string_

_Defined in_ [_contractkit/src/identity/metadata.ts:133_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L133)

**Returns:** _string_

### `Static` fetchFromURL

▸ **fetchFromURL**\(`kit`: [ContractKit](), `url`: string\): _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L39)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `url` | string |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

### `Static` fromEmpty

▸ **fromEmpty**\(`address`: string\): [_IdentityMetadataWrapper_]()_‹›_

_Defined in_ [_contractkit/src/identity/metadata.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L29)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** [_IdentityMetadataWrapper_]()_‹›_

### `Static` fromFile

▸ **fromFile**\(`kit`: [ContractKit](), `path`: string\): _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L47)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `path` | string |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

### `Static` fromRawString

▸ **fromRawString**\(`kit`: [ContractKit](), `rawData`: string\): _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L78)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `rawData` | string |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

### `Static` verifySigner

▸ **verifySigner**\(`kit`: [ContractKit](), `hash`: any, `signature`: any, `metadata`: any\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/identity/metadata.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L51)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `hash` | any |
| `signature` | any |
| `metadata` | any |

**Returns:** _Promise‹boolean›_

### `Static` verifySignerForAddress

▸ **verifySignerForAddress**\(`kit`: [ContractKit](), `hash`: any, `signature`: any, `address`: string\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/identity/metadata.ts:55_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L55)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `hash` | any |
| `signature` | any |
| `address` | string |

**Returns:** _Promise‹boolean›_

