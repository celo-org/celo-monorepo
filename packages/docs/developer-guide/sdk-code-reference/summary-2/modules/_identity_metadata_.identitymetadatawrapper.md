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

_Defined in_ [_contractkit/src/identity/metadata.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L128)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | [IdentityMetadata](_identity_metadata_.md#identitymetadata) |

**Returns:** [_IdentityMetadataWrapper_]()

## Properties

### data

• **data**: [_IdentityMetadata_](_identity_metadata_.md#identitymetadata)

_Defined in_ [_contractkit/src/identity/metadata.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L29)

## Accessors

### claims

• **get claims**\(\): _object \| object \| object \| object \| object \| object\[\]_

_Defined in_ [_contractkit/src/identity/metadata.ts:134_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L134)

**Returns:** _object \| object \| object \| object \| object \| object\[\]_

## Methods

### addClaim

▸ **addClaim**\(`claim`: [Claim](_identity_claims_claim_.md#claim), `signer`: Signer\): _Promise‹object \| object \| object \| object \| object \| object›_

_Defined in_ [_contractkit/src/identity/metadata.ts:149_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L149)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `claim` | [Claim](_identity_claims_claim_.md#claim) |
| `signer` | Signer |

**Returns:** _Promise‹object \| object \| object \| object \| object \| object›_

### filterClaims

▸ **filterClaims**&lt;**K**&gt;\(`type`: K\): _Array‹_[_ClaimPayload_](_identity_claims_claim_.md#claimpayload)_‹K››_

_Defined in_ [_contractkit/src/identity/metadata.ts:189_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L189)

**Type parameters:**

▪ **K**: [_ClaimTypes_](_identity_metadata_.md#claimtypes)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | K |

**Returns:** _Array‹_[_ClaimPayload_](_identity_claims_claim_.md#claimpayload)_‹K››_

### findClaim

▸ **findClaim**&lt;**K**&gt;\(`type`: K\): [_ClaimPayload_](_identity_claims_claim_.md#claimpayload)_‹K› \| undefined_

_Defined in_ [_contractkit/src/identity/metadata.ts:185_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L185)

**Type parameters:**

▪ **K**: [_ClaimTypes_](_identity_metadata_.md#claimtypes)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | K |

**Returns:** [_ClaimPayload_](_identity_claims_claim_.md#claimpayload)_‹K› \| undefined_

### hashOfClaims

▸ **hashOfClaims**\(\): _string_

_Defined in_ [_contractkit/src/identity/metadata.ts:138_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L138)

**Returns:** _string_

### toString

▸ **toString**\(\): _string_

_Defined in_ [_contractkit/src/identity/metadata.ts:142_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L142)

**Returns:** _string_

### `Static` fetchFromURL

▸ **fetchFromURL**\(`kit`: [ContractKit](), `url`: string, `tries`: number\): _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L41)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `kit` | [ContractKit]() | - |
| `url` | string | - |
| `tries` | number | 3 |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

### `Static` fromEmpty

▸ **fromEmpty**\(`address`: Address\): [_IdentityMetadataWrapper_]()_‹›_

_Defined in_ [_contractkit/src/identity/metadata.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L31)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |

**Returns:** [_IdentityMetadataWrapper_]()_‹›_

### `Static` fromFile

▸ **fromFile**\(`kit`: [ContractKit](), `path`: string\): _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L56)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `path` | string |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

### `Static` fromRawString

▸ **fromRawString**\(`kit`: [ContractKit](), `rawData`: string\): _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

_Defined in_ [_contractkit/src/identity/metadata.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L87)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `rawData` | string |

**Returns:** _Promise‹_[_IdentityMetadataWrapper_]()_‹››_

### `Static` verifySigner

▸ **verifySigner**\(`kit`: [ContractKit](), `hash`: any, `signature`: any, `metadata`: any\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/identity/metadata.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L60)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `hash` | any |
| `signature` | any |
| `metadata` | any |

**Returns:** _Promise‹boolean›_

### `Static` verifySignerForAddress

▸ **verifySignerForAddress**\(`kit`: [ContractKit](), `hash`: any, `signature`: any, `address`: Address\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/identity/metadata.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/metadata.ts#L64)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `hash` | any |
| `signature` | any |
| `address` | Address |

**Returns:** _Promise‹boolean›_

