# Class: AttestationsWrapper

## Hierarchy

* [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)‹Attestations›

  ↳ **AttestationsWrapper**

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_attestations_.attestationswrapper.md#constructor)

### Properties

* [attestationExpiryBlocks](_contractkit_src_wrappers_attestations_.attestationswrapper.md#attestationexpiryblocks)
* [attestationRequestFees](_contractkit_src_wrappers_attestations_.attestationswrapper.md#attestationrequestfees)
* [events](_contractkit_src_wrappers_attestations_.attestationswrapper.md#events)
* [getAttestationIssuers](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getattestationissuers)
* [getAttestationStat](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getattestationstat)
* [getAttestationState](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getattestationstate)
* [getUnselectedRequest](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getunselectedrequest)
* [selectIssuersWaitBlocks](_contractkit_src_wrappers_attestations_.attestationswrapper.md#selectissuerswaitblocks)

### Accessors

* [address](_contractkit_src_wrappers_attestations_.attestationswrapper.md#address)

### Methods

* [approveAttestationFee](_contractkit_src_wrappers_attestations_.attestationswrapper.md#approveattestationfee)
* [complete](_contractkit_src_wrappers_attestations_.attestationswrapper.md#complete)
* [findMatchingIssuer](_contractkit_src_wrappers_attestations_.attestationswrapper.md#findmatchingissuer)
* [getActionableAttestations](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getactionableattestations)
* [getAttestationFeeRequired](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getattestationfeerequired)
* [getAttestationServiceStatus](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getattestationservicestatus)
* [getConfig](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getconfig)
* [getNonCompliantIssuers](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getnoncompliantissuers)
* [getPastEvents](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getpastevents)
* [getVerifiedStatus](_contractkit_src_wrappers_attestations_.attestationswrapper.md#getverifiedstatus)
* [isAttestationExpired](_contractkit_src_wrappers_attestations_.attestationswrapper.md#isattestationexpired)
* [lookupIdentifiers](_contractkit_src_wrappers_attestations_.attestationswrapper.md#lookupidentifiers)
* [request](_contractkit_src_wrappers_attestations_.attestationswrapper.md#request)
* [revealPhoneNumberToIssuer](_contractkit_src_wrappers_attestations_.attestationswrapper.md#revealphonenumbertoissuer)
* [revoke](_contractkit_src_wrappers_attestations_.attestationswrapper.md#revoke)
* [selectIssuers](_contractkit_src_wrappers_attestations_.attestationswrapper.md#selectissuers)
* [validateAttestationCode](_contractkit_src_wrappers_attestations_.attestationswrapper.md#validateattestationcode)
* [waitForSelectingIssuers](_contractkit_src_wrappers_attestations_.attestationswrapper.md#waitforselectingissuers)

## Constructors

###  constructor

\+ **new AttestationsWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: Attestations): *[AttestationsWrapper](_contractkit_src_wrappers_attestations_.attestationswrapper.md)*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | Attestations |

**Returns:** *[AttestationsWrapper](_contractkit_src_wrappers_attestations_.attestationswrapper.md)*

## Properties

###  attestationExpiryBlocks

• **attestationExpiryBlocks**: *function* = proxyCall(
    this.contract.methods.attestationExpiryBlocks,
    undefined,
    valueToInt
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:103](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L103)*

 Returns the time an attestation can be completable before it is considered expired

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  attestationRequestFees

• **attestationRequestFees**: *function* = proxyCall(
    this.contract.methods.attestationRequestFees,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L114)*

Returns the attestation request fee in a given currency.

**`param`** Token address.

**`returns`** The fee as big number.

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  events

• **events**: *any* = this.contract.events

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getAttestationIssuers

• **getAttestationIssuers**: *function* = proxyCall(this.contract.methods.getAttestationIssuers)

*Defined in [contractkit/src/wrappers/Attestations.ts:186](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L186)*

Returns the issuers of attestations for a phoneNumber/account combo

**`param`** Attestation identifier (e.g. phone hash)

**`param`** Address of the account

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  getAttestationStat

• **getAttestationStat**: *function* = proxyCall(
    this.contract.methods.getAttestationStats,
    undefined,
    (stat) => ({ completed: valueToInt(stat[0]), total: valueToInt(stat[1]) })
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:208](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L208)*

Returns the attestation stats of a identifer/account pair

**`param`** Attestation identifier (e.g. phone hash)

**`param`** Address of the account

#### Type declaration:

▸ (`identifier`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[AttestationStat](../interfaces/_contractkit_src_wrappers_attestations_.attestationstat.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  getAttestationState

• **getAttestationState**: *function* = proxyCall(
    this.contract.methods.getAttestationState,
    undefined,
    (state) => ({ attestationState: valueToInt(state[0]) })
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:193](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L193)*

Returns the attestation state of a phone number/account/issuer tuple

**`param`** Attestation identifier (e.g. phone hash)

**`param`** Address of the account

#### Type declaration:

▸ (`identifier`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address), `issuer`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[AttestationStateForIssuer](../interfaces/_contractkit_src_wrappers_attestations_.attestationstateforissuer.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`issuer` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  getUnselectedRequest

• **getUnselectedRequest**: *function* = proxyCall(
    this.contract.methods.getUnselectedRequest,
    undefined,
    (res) => ({
      blockNumber: valueToInt(res[0]),
      attestationsRequested: valueToInt(res[1]),
      attestationRequestFeeToken: res[2],
    })
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:131](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L131)*

**`notice`** Returns the unselected attestation request for an identifier/account pair, if any.

**`param`** Attestation identifier (e.g. phone hash)

**`param`** Address of the account

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  selectIssuersWaitBlocks

• **selectIssuersWaitBlocks**: *function* = proxyCall(
    this.contract.methods.selectIssuersWaitBlocks,
    undefined,
    valueToInt
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L120)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  approveAttestationFee

▸ **approveAttestationFee**(`attestationsRequested`: number): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Attestations.ts:255](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L255)*

Approves the necessary amount of StableToken to request Attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  complete

▸ **complete**(`identifier`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address), `issuer`: [Address](../modules/_contractkit_src_base_.md#address), `code`: string): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:341](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L341)*

Completes an attestation with the corresponding code

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the account |
`issuer` | [Address](../modules/_contractkit_src_base_.md#address) | The issuer of the attestation |
`code` | string | The code received by the validator  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  findMatchingIssuer

▸ **findMatchingIssuer**(`identifier`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address), `code`: string, `issuers`: string[]): *Promise‹string | null›*

*Defined in [contractkit/src/wrappers/Attestations.ts:363](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L363)*

Given a list of issuers, finds the matching issuer for a given code

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the account |
`code` | string | The code received by the validator |
`issuers` | string[] | The list of potential issuers  |

**Returns:** *Promise‹string | null›*

___

###  getActionableAttestations

▸ **getActionableAttestations**(`identifier`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[ActionableAttestation](../interfaces/_contractkit_src_wrappers_attestations_.actionableattestation.md)[]›*

*Defined in [contractkit/src/wrappers/Attestations.ts:267](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L267)*

Returns an array of attestations that can be completed, along with the issuers' attestation
service urls

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the account  |

**Returns:** *Promise‹[ActionableAttestation](../interfaces/_contractkit_src_wrappers_attestations_.actionableattestation.md)[]›*

___

###  getAttestationFeeRequired

▸ **getAttestationFeeRequired**(`attestationsRequested`: number): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Attestations.ts:245](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L245)*

Calculates the amount of StableToken required to request Attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹BigNumber‹››*

___

###  getAttestationServiceStatus

▸ **getAttestationServiceStatus**(`validator`: [Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md)): *Promise‹AttestationServiceStatusResponse›*

*Defined in [contractkit/src/wrappers/Attestations.ts:523](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L523)*

Gets the relevant attestation service status for a validator

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validator` | [Validator](../interfaces/_contractkit_src_wrappers_validators_.validator.md) | Validator to get the attestation service status for  |

**Returns:** *Promise‹AttestationServiceStatusResponse›*

___

###  getConfig

▸ **getConfig**(`tokens`: string[]): *Promise‹[AttestationsConfig](../interfaces/_contractkit_src_wrappers_attestations_.attestationsconfig.md)›*

*Defined in [contractkit/src/wrappers/Attestations.ts:391](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L391)*

Returns the current configuration parameters for the contract.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tokens` | string[] | List of tokens used for attestation fees.  |

**Returns:** *Promise‹[AttestationsConfig](../interfaces/_contractkit_src_wrappers_attestations_.attestationsconfig.md)›*

___

###  getNonCompliantIssuers

▸ **getNonCompliantIssuers**(`identifier`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/Attestations.ts:289](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L289)*

Returns an array of issuer addresses that were found to not run the attestation service

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the account  |

**Returns:** *Promise‹[Address](../modules/_contractkit_src_base_.md#address)[]›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: string, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_contractkit_src_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L29)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getVerifiedStatus

▸ **getVerifiedStatus**(`identifier`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address), `numAttestationsRequired?`: undefined | number, `attestationThreshold?`: undefined | number): *Promise‹AttestationsStatus›*

*Defined in [contractkit/src/wrappers/Attestations.ts:227](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L227)*

Returns the verified status of an identifier/account pair indicating whether the attestation
stats for a given pair are completed beyond a certain threshold of confidence (aka "verified")

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the account |
`numAttestationsRequired?` | undefined &#124; number | Optional number of attestations required.  Will default to  hardcoded value if absent. |
`attestationThreshold?` | undefined &#124; number | Optional threshold for fraction attestations completed. Will  default to hardcoded value if absent.  |

**Returns:** *Promise‹AttestationsStatus›*

___

###  isAttestationExpired

▸ **isAttestationExpired**(`attestationRequestBlockNumber`: number): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Attestations.ts:145](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L145)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationRequestBlockNumber` | number | Attestation Request Block Number to be checked  |

**Returns:** *Promise‹boolean›*

___

###  lookupIdentifiers

▸ **lookupIdentifiers**(`identifiers`: string[]): *Promise‹[IdentifierLookupResult](../modules/_contractkit_src_wrappers_attestations_.md#identifierlookupresult)›*

*Defined in [contractkit/src/wrappers/Attestations.ts:408](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L408)*

Lookup mapped wallet addresses for a given list of identifiers

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifiers` | string[] | Attestation identifiers (e.g. phone hashes)  |

**Returns:** *Promise‹[IdentifierLookupResult](../modules/_contractkit_src_wrappers_attestations_.md#identifierlookupresult)›*

___

###  request

▸ **request**(`identifier`: string, `attestationsRequested`: number): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:449](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L449)*

Requests a new attestation

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  revealPhoneNumberToIssuer

▸ **revealPhoneNumberToIssuer**(`phoneNumber`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address), `issuer`: [Address](../modules/_contractkit_src_base_.md#address), `serviceURL`: string, `salt?`: undefined | string, `smsRetrieverAppSig?`: undefined | string): *Promise‹Response›*

*Defined in [contractkit/src/wrappers/Attestations.ts:465](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L465)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |
`issuer` | [Address](../modules/_contractkit_src_base_.md#address) |
`serviceURL` | string |
`salt?` | undefined &#124; string |
`smsRetrieverAppSig?` | undefined &#124; string |

**Returns:** *Promise‹Response›*

___

###  revoke

▸ **revoke**(`identifer`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address)): *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:601](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L601)*

**Parameters:**

Name | Type |
------ | ------ |
`identifer` | string |
`account` | [Address](../modules/_contractkit_src_base_.md#address) |

**Returns:** *Promise‹[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  selectIssuers

▸ **selectIssuers**(`identifier`: string): *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

*Defined in [contractkit/src/wrappers/Attestations.ts:461](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L461)*

Selects the issuers for previously requested attestations for a phone number

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash)  |

**Returns:** *[CeloTransactionObject](_contractkit_src_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  validateAttestationCode

▸ **validateAttestationCode**(`identifier`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address), `issuer`: [Address](../modules/_contractkit_src_base_.md#address), `code`: string): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Attestations.ts:496](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L496)*

Validates a given code by the issuer on-chain

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the account which requested attestation |
`issuer` | [Address](../modules/_contractkit_src_base_.md#address) | The address of the issuer of the attestation |
`code` | string | The code send by the issuer  |

**Returns:** *Promise‹boolean›*

___

###  waitForSelectingIssuers

▸ **waitForSelectingIssuers**(`identifier`: string, `account`: [Address](../modules/_contractkit_src_base_.md#address), `timeoutSeconds`: number, `pollDurationSeconds`: number): *Promise‹void›*

*Defined in [contractkit/src/wrappers/Attestations.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L157)*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`identifier` | string | - | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_contractkit_src_base_.md#address) | - | Address of the account  |
`timeoutSeconds` | number | 120 | - |
`pollDurationSeconds` | number | 1 | - |

**Returns:** *Promise‹void›*
