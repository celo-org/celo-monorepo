# External module: "contractkit/src/identity/metadata"

## Index

### References

* [ClaimTypes](_contractkit_src_identity_metadata_.md#claimtypes)

### Classes

* [IdentityMetadataWrapper](../classes/_contractkit_src_identity_metadata_.identitymetadatawrapper.md)

### Type aliases

* [IdentityMetadata](_contractkit_src_identity_metadata_.md#identitymetadata)

### Variables

* [IdentityMetadataType](_contractkit_src_identity_metadata_.md#const-identitymetadatatype)

## References

###  ClaimTypes

• **ClaimTypes**:

## Type aliases

###  IdentityMetadata

Ƭ **IdentityMetadata**: *t.TypeOf‹typeof IdentityMetadataType›*

*Defined in [contractkit/src/identity/metadata.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L24)*

## Variables

### `Const` IdentityMetadataType

• **IdentityMetadataType**: *TypeC‹object›* = t.type({
  claims: t.array(ClaimType),
  meta: MetaType,
})

*Defined in [contractkit/src/identity/metadata.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/metadata.ts#L20)*
