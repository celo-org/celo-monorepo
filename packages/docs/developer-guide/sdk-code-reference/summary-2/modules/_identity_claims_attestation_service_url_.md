# identity/claims/attestation-service-url

## Index

### Type aliases

* [AttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim)

### Variables

* [AttestationServiceURLClaimType](_identity_claims_attestation_service_url_.md#const-attestationserviceurlclaimtype)

### Functions

* [createAttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#const-createattestationserviceurlclaim)
* [validateAttestationServiceUrl](_identity_claims_attestation_service_url_.md#validateattestationserviceurl)

## Type aliases

### AttestationServiceURLClaim

Ƭ **AttestationServiceURLClaim**: _t.TypeOf‹typeof AttestationServiceURLClaimType›_

_Defined in_ [_contractkit/src/identity/claims/attestation-service-url.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/attestation-service-url.ts#L20)

## Variables

### `Const` AttestationServiceURLClaimType

• **AttestationServiceURLClaimType**: _TypeC‹object›_ = t.type\({ type: t.literal\(ClaimTypes.ATTESTATION\_SERVICE\_URL\), timestamp: TimestampType, url: UrlType, }\)

_Defined in_ [_contractkit/src/identity/claims/attestation-service-url.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/attestation-service-url.ts#L14)

## Functions

### `Const` createAttestationServiceURLClaim

▸ **createAttestationServiceURLClaim**\(`url`: string\): [_AttestationServiceURLClaim_](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim)

_Defined in_ [_contractkit/src/identity/claims/attestation-service-url.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/attestation-service-url.ts#L22)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `url` | string |

**Returns:** [_AttestationServiceURLClaim_](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim)

### validateAttestationServiceUrl

▸ **validateAttestationServiceUrl**\(`kit`: [ContractKit](), `claim`: [AttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim), `address`: Address\): _Promise‹string \| undefined›_

_Defined in_ [_contractkit/src/identity/claims/attestation-service-url.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/identity/claims/attestation-service-url.ts#L28)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `claim` | [AttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim) |
| `address` | Address |

**Returns:** _Promise‹string \| undefined›_

