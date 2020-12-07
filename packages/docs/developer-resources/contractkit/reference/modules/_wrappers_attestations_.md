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

* [IdentifierLookupResult](_wrappers_attestations_.md#identifierlookupresult)

### Functions

* [getSecurityCodePrefix](_wrappers_attestations_.md#getsecuritycodeprefix)

## Type aliases

###  IdentifierLookupResult

Ƭ **IdentifierLookupResult**: *Record‹string, Record‹[Address](_base_.md#address), [AttestationStat](../interfaces/_wrappers_attestations_.attestationstat.md) | undefined› | undefined›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L78)*

## Functions

###  getSecurityCodePrefix

▸ **getSecurityCodePrefix**(`issuerAddress`: [Address](_base_.md#address)): *string*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`issuerAddress` | [Address](_base_.md#address) |

**Returns:** *string*
