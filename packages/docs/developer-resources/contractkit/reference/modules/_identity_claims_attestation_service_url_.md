# External module: "identity/claims/attestation-service-url"

## Index

### Type aliases

* [AttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim)

### Variables

* [AttestationServiceURLClaimType](_identity_claims_attestation_service_url_.md#const-attestationserviceurlclaimtype)

### Functions

* [createAttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#const-createattestationserviceurlclaim)
* [validateAttestationServiceUrl](_identity_claims_attestation_service_url_.md#validateattestationserviceurl)

## Type aliases

###  AttestationServiceURLClaim

Ƭ **AttestationServiceURLClaim**: *t.TypeOf‹typeof AttestationServiceURLClaimType›*

*Defined in [contractkit/src/identity/claims/attestation-service-url.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/attestation-service-url.ts#L19)*

## Variables

### `Const` AttestationServiceURLClaimType

• **AttestationServiceURLClaimType**: *TypeC‹object›* = t.type({
  type: t.literal(ClaimTypes.ATTESTATION_SERVICE_URL),
  timestamp: TimestampType,
  url: UrlType,
})

*Defined in [contractkit/src/identity/claims/attestation-service-url.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/attestation-service-url.ts#L13)*

## Functions

### `Const` createAttestationServiceURLClaim

▸ **createAttestationServiceURLClaim**(`url`: string): *[AttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim)*

*Defined in [contractkit/src/identity/claims/attestation-service-url.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/attestation-service-url.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`url` | string |

**Returns:** *[AttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim)*

___

###  validateAttestationServiceUrl

▸ **validateAttestationServiceUrl**(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `claim`: [AttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim), `address`: [Address](_base_.md#address)): *Promise‹string | undefined›*

*Defined in [contractkit/src/identity/claims/attestation-service-url.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/claims/attestation-service-url.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |
`claim` | [AttestationServiceURLClaim](_identity_claims_attestation_service_url_.md#attestationserviceurlclaim) |
`address` | [Address](_base_.md#address) |

**Returns:** *Promise‹string | undefined›*
