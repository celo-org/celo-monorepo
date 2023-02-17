[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/Attestations"](_wrappers_attestations_.md)

# Module: "wrappers/Attestations"

## Index

### Enumerations

* [AttestationServiceStatusState](../enums/_wrappers_attestations_.attestationservicestatusstate.md)
* [AttestationState](../enums/_wrappers_attestations_.attestationstate.md)

### Classes

* [AttestationsWrapper](../classes/_wrappers_attestations_.attestationswrapper.md)

### Interfaces

* [ActionableAttestation](../interfaces/_wrappers_attestations_.actionableattestation.md)
* [AttestationServiceStatusResponse](../interfaces/_wrappers_attestations_.attestationservicestatusresponse.md)
* [AttestationStat](../interfaces/_wrappers_attestations_.attestationstat.md)
* [AttestationStateForIssuer](../interfaces/_wrappers_attestations_.attestationstateforissuer.md)
* [AttestationsConfig](../interfaces/_wrappers_attestations_.attestationsconfig.md)
* [AttestationsToken](../interfaces/_wrappers_attestations_.attestationstoken.md)
* [UnselectedRequest](../interfaces/_wrappers_attestations_.unselectedrequest.md)

### Type aliases

* [AttestationsWrapperType](_wrappers_attestations_.md#attestationswrappertype)
* [IdentifierLookupResult](_wrappers_attestations_.md#identifierlookupresult)

### Functions

* [getSecurityCodePrefix](_wrappers_attestations_.md#getsecuritycodeprefix)

## Type aliases

###  AttestationsWrapperType

Ƭ **AttestationsWrapperType**: *[AttestationsWrapper](../classes/_wrappers_attestations_.attestationswrapper.md)*

*Defined in [packages/sdk/contractkit/src/wrappers/Attestations.ts:900](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L900)*

___

###  IdentifierLookupResult

Ƭ **IdentifierLookupResult**: *Record‹string, Record‹Address, [AttestationStat](../interfaces/_wrappers_attestations_.attestationstat.md) | undefined› | undefined›*

*Defined in [packages/sdk/contractkit/src/wrappers/Attestations.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L100)*

## Functions

###  getSecurityCodePrefix

▸ **getSecurityCodePrefix**(`issuerAddress`: Address): *string*

*Defined in [packages/sdk/contractkit/src/wrappers/Attestations.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`issuerAddress` | Address |

**Returns:** *string*
