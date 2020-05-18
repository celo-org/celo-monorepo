# AttestationsWrapper

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Attestations›

  ↳ **AttestationsWrapper**

## Index

### Constructors

* [constructor](_wrappers_attestations_.attestationswrapper.md#constructor)

### Properties

* [attestationExpiryBlocks](_wrappers_attestations_.attestationswrapper.md#attestationexpiryblocks)
* [attestationRequestFees](_wrappers_attestations_.attestationswrapper.md#attestationrequestfees)
* [events](_wrappers_attestations_.attestationswrapper.md#events)
* [getAttestationIssuers](_wrappers_attestations_.attestationswrapper.md#getattestationissuers)
* [getAttestationStat](_wrappers_attestations_.attestationswrapper.md#getattestationstat)
* [getAttestationState](_wrappers_attestations_.attestationswrapper.md#getattestationstate)
* [getUnselectedRequest](_wrappers_attestations_.attestationswrapper.md#getunselectedrequest)
* [selectIssuersWaitBlocks](_wrappers_attestations_.attestationswrapper.md#selectissuerswaitblocks)

### Accessors

* [address](_wrappers_attestations_.attestationswrapper.md#address)

### Methods

* [approveAttestationFee](_wrappers_attestations_.attestationswrapper.md#approveattestationfee)
* [complete](_wrappers_attestations_.attestationswrapper.md#complete)
* [findMatchingIssuer](_wrappers_attestations_.attestationswrapper.md#findmatchingissuer)
* [getActionableAttestations](_wrappers_attestations_.attestationswrapper.md#getactionableattestations)
* [getAttestationFeeRequired](_wrappers_attestations_.attestationswrapper.md#getattestationfeerequired)
* [getConfig](_wrappers_attestations_.attestationswrapper.md#getconfig)
* [getNonCompliantIssuers](_wrappers_attestations_.attestationswrapper.md#getnoncompliantissuers)
* [lookupIdentifiers](_wrappers_attestations_.attestationswrapper.md#lookupidentifiers)
* [request](_wrappers_attestations_.attestationswrapper.md#request)
* [revealPhoneNumberToIssuer](_wrappers_attestations_.attestationswrapper.md#revealphonenumbertoissuer)
* [selectIssuers](_wrappers_attestations_.attestationswrapper.md#selectissuers)
* [validateAttestationCode](_wrappers_attestations_.attestationswrapper.md#validateattestationcode)
* [waitForSelectingIssuers](_wrappers_attestations_.attestationswrapper.md#waitforselectingissuers)

## Constructors

### constructor

+ **new AttestationsWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Attestations\): [_AttestationsWrapper_](_wrappers_attestations_.attestationswrapper.md)

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_constructor_](_wrappers_basewrapper_.basewrapper.md#constructor)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | Attestations |

**Returns:** [_AttestationsWrapper_](_wrappers_attestations_.attestationswrapper.md)

## Properties

### attestationExpiryBlocks

• **attestationExpiryBlocks**: _function_ = proxyCall\( this.contract.methods.attestationExpiryBlocks, undefined, valueToInt \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L100)

Returns the time an attestation can be completable before it is considered expired

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### attestationRequestFees

• **attestationRequestFees**: _function_ = proxyCall\( this.contract.methods.attestationRequestFees, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:111_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L111)

Returns the attestation request fee in a given currency.

**`param`** Token address.

**`returns`** The fee as big number.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### events

• **events**: _any_ = this.contract.events

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_events_](_wrappers_basewrapper_.basewrapper.md#events)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)

### getAttestationIssuers

• **getAttestationIssuers**: _function_ = proxyCall\(this.contract.methods.getAttestationIssuers\)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:172_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L172)

Returns the issuers of attestations for a phoneNumber/account combo

**`param`** Attestation identifier \(e.g. phone hash\)

**`param`** Address of the account

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### getAttestationStat

• **getAttestationStat**: _function_ = proxyCall\( this.contract.methods.getAttestationStats, undefined, \(stat\) =&gt; \({ completed: valueToInt\(stat\[0\]\), total: valueToInt\(stat\[1\]\) }\) \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:194_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L194)

Returns the attestation stats of a phone number/account pair

**`param`** Attestation identifier \(e.g. phone hash\)

**`param`** Address of the account

#### Type declaration:

▸ \(`identifier`: string, `account`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_AttestationStat_](../interfaces/_wrappers_attestations_.attestationstat.md)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifier` | string |
| `account` | [Address](../external-modules/_base_.md#address) |

### getAttestationState

• **getAttestationState**: _function_ = proxyCall\( this.contract.methods.getAttestationState, undefined, \(state\) =&gt; \({ attestationState: valueToInt\(state\[0\]\) }\) \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:179_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L179)

Returns the attestation state of a phone number/account/issuer tuple

**`param`** Attestation identifier \(e.g. phone hash\)

**`param`** Address of the account

#### Type declaration:

▸ \(`identifier`: string, `account`: [Address](../external-modules/_base_.md#address), `issuer`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_AttestationStateForIssuer_](../interfaces/_wrappers_attestations_.attestationstateforissuer.md)_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifier` | string |
| `account` | [Address](../external-modules/_base_.md#address) |
| `issuer` | [Address](../external-modules/_base_.md#address) |

### getUnselectedRequest

• **getUnselectedRequest**: _function_ = proxyCall\( this.contract.methods.getUnselectedRequest, undefined, \(res\) =&gt; \({ blockNumber: valueToInt\(res\[0\]\), attestationsRequested: valueToInt\(res\[1\]\), attestationRequestFeeToken: res\[2\], }\) \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L128)

**`notice`** Returns the unselected attestation request for an identifier/account pair, if any.

**`param`** Attestation identifier \(e.g. phone hash\)

**`param`** Address of the account

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### selectIssuersWaitBlocks

• **selectIssuersWaitBlocks**: _function_ = proxyCall\( this.contract.methods.selectIssuersWaitBlocks, undefined, valueToInt \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L117)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)_._[_address_](_wrappers_basewrapper_.basewrapper.md#address)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)

Contract address

**Returns:** _string_

## Methods

### approveAttestationFee

▸ **approveAttestationFee**\(`attestationsRequested`: number\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:217_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L217)

Approves the necessary amount of StableToken to request Attestations

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `attestationsRequested` | number | The number of attestations to request |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹boolean››_

### complete

▸ **complete**\(`identifier`: string, `account`: [Address](../external-modules/_base_.md#address), `issuer`: [Address](../external-modules/_base_.md#address), `code`: string\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:303_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L303)

Completes an attestation with the corresponding code

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](../external-modules/_base_.md#address) | Address of the account |
| `issuer` | [Address](../external-modules/_base_.md#address) | The issuer of the attestation |
| `code` | string | The code received by the validator |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

### findMatchingIssuer

▸ **findMatchingIssuer**\(`identifier`: string, `account`: [Address](../external-modules/_base_.md#address), `code`: string, `issuers`: string\[\]\): _Promise‹string \| null›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:325_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L325)

Given a list of issuers, finds the matching issuer for a given code

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](../external-modules/_base_.md#address) | Address of the account |
| `code` | string | The code received by the validator |
| `issuers` | string\[\] | The list of potential issuers |

**Returns:** _Promise‹string \| null›_

### getActionableAttestations

▸ **getActionableAttestations**\(`identifier`: string, `account`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_ActionableAttestation_](../interfaces/_wrappers_attestations_.actionableattestation.md)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:229_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L229)

Returns an array of attestations that can be completed, along with the issuers' attestation service urls

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](../external-modules/_base_.md#address) | Address of the account |

**Returns:** _Promise‹_[_ActionableAttestation_](../interfaces/_wrappers_attestations_.actionableattestation.md)_\[\]›_

### getAttestationFeeRequired

▸ **getAttestationFeeRequired**\(`attestationsRequested`: number\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:207_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L207)

Calculates the amount of StableToken required to request Attestations

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `attestationsRequested` | number | The number of attestations to request |

**Returns:** _Promise‹BigNumber‹››_

### getConfig

▸ **getConfig**\(`tokens`: string\[\]\): _Promise‹_[_AttestationsConfig_](../interfaces/_wrappers_attestations_.attestationsconfig.md)_›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:353_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L353)

Returns the current configuration parameters for the contract.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tokens` | string\[\] | List of tokens used for attestation fees. |

**Returns:** _Promise‹_[_AttestationsConfig_](../interfaces/_wrappers_attestations_.attestationsconfig.md)_›_

### getNonCompliantIssuers

▸ **getNonCompliantIssuers**\(`identifier`: string, `account`: [Address](../external-modules/_base_.md#address)\): _Promise‹_[_Address_](../external-modules/_base_.md#address)_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:251_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L251)

Returns an array of issuer addresses that were found to not run the attestation service

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](../external-modules/_base_.md#address) | Address of the account |

**Returns:** _Promise‹_[_Address_](../external-modules/_base_.md#address)_\[\]›_

### lookupIdentifiers

▸ **lookupIdentifiers**\(`identifiers`: string\[\]\): _Promise‹_[_IdentifierLookupResult_](../external-modules/_wrappers_attestations_.md#identifierlookupresult)_›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:370_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L370)

Lookup mapped wallet addresses for a given list of identifiers

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifiers` | string\[\] | Attestation identifiers \(e.g. phone hashes\) |

**Returns:** _Promise‹_[_IdentifierLookupResult_](../external-modules/_wrappers_attestations_.md#identifierlookupresult)_›_

### request

▸ **request**\(`identifier`: string, `attestationsRequested`: number\): _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:411_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L411)

Requests a new attestation

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `attestationsRequested` | number | The number of attestations to request |

**Returns:** _Promise‹_[_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void››_

### revealPhoneNumberToIssuer

▸ **revealPhoneNumberToIssuer**\(`phoneNumber`: string, `account`: [Address](../external-modules/_base_.md#address), `issuer`: [Address](../external-modules/_base_.md#address), `serviceURL`: string, `salt?`: undefined \| string, `smsRetrieverAppSig?`: undefined \| string\): _Promise‹Response›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:427_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L427)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumber` | string |
| `account` | [Address](../external-modules/_base_.md#address) |
| `issuer` | [Address](../external-modules/_base_.md#address) |
| `serviceURL` | string |
| `salt?` | undefined \| string |
| `smsRetrieverAppSig?` | undefined \| string |

**Returns:** _Promise‹Response›_

### selectIssuers

▸ **selectIssuers**\(`identifier`: string\): [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:423_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L423)

Selects the issuers for previously requested attestations for a phone number

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |

**Returns:** [_CeloTransactionObject_](_wrappers_basewrapper_.celotransactionobject.md)_‹void›_

### validateAttestationCode

▸ **validateAttestationCode**\(`identifier`: string, `account`: [Address](../external-modules/_base_.md#address), `issuer`: [Address](../external-modules/_base_.md#address), `code`: string\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:458_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L458)

Validates a given code by the issuer on-chain

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](../external-modules/_base_.md#address) | The address of the account which requested attestation |
| `issuer` | [Address](../external-modules/_base_.md#address) | The address of the issuer of the attestation |
| `code` | string | The code send by the issuer |

**Returns:** _Promise‹boolean›_

### waitForSelectingIssuers

▸ **waitForSelectingIssuers**\(`identifier`: string, `account`: [Address](../external-modules/_base_.md#address), `timeoutSeconds`: number, `pollDurationSeconds`: number\): _Promise‹void›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:143_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L143)

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `identifier` | string | - | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](../external-modules/_base_.md#address) | - | Address of the account |
| `timeoutSeconds` | number | 120 | - |
| `pollDurationSeconds` | number | 1 | - |

**Returns:** _Promise‹void›_

