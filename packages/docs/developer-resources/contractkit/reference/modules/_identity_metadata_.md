# External module: "identity/metadata"

## Index

### References

* [ClaimTypes](_identity_metadata_.md#claimtypes)

### Classes

* [IdentityMetadataWrapper](../classes/_identity_metadata_.identitymetadatawrapper.md)

### Type aliases

* [IdentityMetadata](_identity_metadata_.md#identitymetadata)

### Variables

* [IdentityMetadataType](_identity_metadata_.md#const-identitymetadatatype)

## References

###  ClaimTypes

• **ClaimTypes**:

## Type aliases

###  IdentityMetadata

Ƭ **IdentityMetadata**: *t.TypeOf‹typeof IdentityMetadataType›*

*Defined in [contractkit/src/identity/metadata.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L25)*

## Variables

### `Const` IdentityMetadataType

• **IdentityMetadataType**: *TypeC‹object›* = t.type({
  claims: t.array(ClaimType),
  meta: MetaType,
})

*Defined in [contractkit/src/identity/metadata.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L21)*
