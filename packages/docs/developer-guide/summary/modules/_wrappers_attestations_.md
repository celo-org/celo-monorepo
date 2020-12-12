# wrappers/Attestations

## Index

### Enumerations

* [AttestationServiceStatusState]()
* [AttestationState]()

### Classes

* [AttestationsWrapper]()

### Interfaces

* [ActionableAttestation]()
* [AttestationServiceStatusResponse]()
* [AttestationStat]()
* [AttestationStateForIssuer]()
* [AttestationsConfig]()
* [AttestationsToken]()
* [UnselectedRequest]()

### Type aliases

* [IdentifierLookupResult](_wrappers_attestations_.md#identifierlookupresult)

### Functions

* [getSecurityCodePrefix](_wrappers_attestations_.md#getsecuritycodeprefix)

## Type aliases

### IdentifierLookupResult

Ƭ **IdentifierLookupResult**: _Record‹string, Record‹_[_Address_](_base_.md#address)_,_ [_AttestationStat_]() _\| undefined› \| undefined›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L78)

## Functions

### getSecurityCodePrefix

▸ **getSecurityCodePrefix**\(`issuerAddress`: [Address](_base_.md#address)\): _string_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L28)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `issuerAddress` | [Address](_base_.md#address) |

**Returns:** _string_

