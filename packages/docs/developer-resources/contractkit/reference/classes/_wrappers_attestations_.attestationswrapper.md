# Class: AttestationsWrapper

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Attestations›

  ↳ **AttestationsWrapper**

## Index

### Constructors

* [constructor](_wrappers_attestations_.attestationswrapper.md#constructor)

### Properties

* [attestationExpiryBlocks](_wrappers_attestations_.attestationswrapper.md#attestationexpiryblocks)
* [attestationRequestFees](_wrappers_attestations_.attestationswrapper.md#attestationrequestfees)
* [eventTypes](_wrappers_attestations_.attestationswrapper.md#eventtypes)
* [events](_wrappers_attestations_.attestationswrapper.md#events)
* [getAttestationIssuers](_wrappers_attestations_.attestationswrapper.md#getattestationissuers)
* [getAttestationStat](_wrappers_attestations_.attestationswrapper.md#getattestationstat)
* [getAttestationState](_wrappers_attestations_.attestationswrapper.md#getattestationstate)
* [getUnselectedRequest](_wrappers_attestations_.attestationswrapper.md#getunselectedrequest)
* [methodIds](_wrappers_attestations_.attestationswrapper.md#methodids)
* [selectIssuersWaitBlocks](_wrappers_attestations_.attestationswrapper.md#selectissuerswaitblocks)

### Accessors

* [address](_wrappers_attestations_.attestationswrapper.md#address)

### Methods

* [approveAttestationFee](_wrappers_attestations_.attestationswrapper.md#approveattestationfee)
* [complete](_wrappers_attestations_.attestationswrapper.md#complete)
* [findMatchingIssuer](_wrappers_attestations_.attestationswrapper.md#findmatchingissuer)
* [getActionableAttestations](_wrappers_attestations_.attestationswrapper.md#getactionableattestations)
* [getAttestationFeeRequired](_wrappers_attestations_.attestationswrapper.md#getattestationfeerequired)
* [getAttestationServiceStatus](_wrappers_attestations_.attestationswrapper.md#getattestationservicestatus)
* [getConfig](_wrappers_attestations_.attestationswrapper.md#getconfig)
* [getHumanReadableConfig](_wrappers_attestations_.attestationswrapper.md#gethumanreadableconfig)
* [getNonCompliantIssuers](_wrappers_attestations_.attestationswrapper.md#getnoncompliantissuers)
* [getPastEvents](_wrappers_attestations_.attestationswrapper.md#getpastevents)
* [getRevealStatus](_wrappers_attestations_.attestationswrapper.md#getrevealstatus)
* [getVerifiedStatus](_wrappers_attestations_.attestationswrapper.md#getverifiedstatus)
* [isAttestationExpired](_wrappers_attestations_.attestationswrapper.md#isattestationexpired)
* [lookupIdentifiers](_wrappers_attestations_.attestationswrapper.md#lookupidentifiers)
* [request](_wrappers_attestations_.attestationswrapper.md#request)
* [revealPhoneNumberToIssuer](_wrappers_attestations_.attestationswrapper.md#revealphonenumbertoissuer)
* [revoke](_wrappers_attestations_.attestationswrapper.md#revoke)
* [selectIssuers](_wrappers_attestations_.attestationswrapper.md#selectissuers)
* [selectIssuersAfterWait](_wrappers_attestations_.attestationswrapper.md#selectissuersafterwait)
* [validateAttestationCode](_wrappers_attestations_.attestationswrapper.md#validateattestationcode)
* [waitForSelectingIssuers](_wrappers_attestations_.attestationswrapper.md#waitforselectingissuers)

## Constructors

###  constructor

\+ **new AttestationsWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Attestations): *[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Attestations |

**Returns:** *[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)*

## Properties

###  attestationExpiryBlocks

• **attestationExpiryBlocks**: *function* = proxyCall(
    this.contract.methods.attestationExpiryBlocks,
    undefined,
    valueToInt
  )

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L106)*

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

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L117)*

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

###  eventTypes

• **eventTypes**: *object* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)*

#### Type declaration:

___

###  events

• **events**: *Attestations["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)*

___

###  getAttestationIssuers

• **getAttestationIssuers**: *function* = proxyCall(this.contract.methods.getAttestationIssuers)

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:190](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L190)*

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

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:212](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L212)*

Returns the attestation stats of a identifer/account pair

**`param`** Attestation identifier (e.g. phone hash)

**`param`** Address of the account

#### Type declaration:

▸ (`identifier`: string, `account`: [Address](../modules/_base_.md#address)): *Promise‹[AttestationStat](../interfaces/_wrappers_attestations_.attestationstat.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`account` | [Address](../modules/_base_.md#address) |

___

###  getAttestationState

• **getAttestationState**: *function* = proxyCall(
    this.contract.methods.getAttestationState,
    undefined,
    (state) => ({ attestationState: valueToInt(state[0]) })
  )

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L197)*

Returns the attestation state of a phone number/account/issuer tuple

**`param`** Attestation identifier (e.g. phone hash)

**`param`** Address of the account

#### Type declaration:

▸ (`identifier`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address)): *Promise‹[AttestationStateForIssuer](../interfaces/_wrappers_attestations_.attestationstateforissuer.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`account` | [Address](../modules/_base_.md#address) |
`issuer` | [Address](../modules/_base_.md#address) |

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

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L134)*

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

###  methodIds

• **methodIds**: *object* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)*

#### Type declaration:

___

###  selectIssuersWaitBlocks

• **selectIssuersWaitBlocks**: *function* = proxyCall(
    this.contract.methods.selectIssuersWaitBlocks,
    undefined,
    valueToInt
  )

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L123)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)*

Contract address

**Returns:** *string*

## Methods

###  approveAttestationFee

▸ **approveAttestationFee**(`attestationsRequested`: number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:259](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L259)*

Approves the necessary amount of StableToken to request Attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  complete

▸ **complete**(`identifier`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address), `code`: string): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:345](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L345)*

Completes an attestation with the corresponding code

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_base_.md#address) | Address of the account |
`issuer` | [Address](../modules/_base_.md#address) | The issuer of the attestation |
`code` | string | The code received by the validator  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  findMatchingIssuer

▸ **findMatchingIssuer**(`identifier`: string, `account`: [Address](../modules/_base_.md#address), `code`: string, `issuers`: string[]): *Promise‹string | null›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:367](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L367)*

Given a list of issuers, finds the matching issuer for a given code

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_base_.md#address) | Address of the account |
`code` | string | The code received by the validator |
`issuers` | string[] | The list of potential issuers  |

**Returns:** *Promise‹string | null›*

___

###  getActionableAttestations

▸ **getActionableAttestations**(`identifier`: string, `account`: [Address](../modules/_base_.md#address)): *Promise‹[ActionableAttestation](../interfaces/_wrappers_attestations_.actionableattestation.md)[]›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:271](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L271)*

Returns an array of attestations that can be completed, along with the issuers' attestation
service urls

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_base_.md#address) | Address of the account  |

**Returns:** *Promise‹[ActionableAttestation](../interfaces/_wrappers_attestations_.actionableattestation.md)[]›*

___

###  getAttestationFeeRequired

▸ **getAttestationFeeRequired**(`attestationsRequested`: number): *Promise‹BigNumber‹››*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:249](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L249)*

Calculates the amount of StableToken required to request Attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹BigNumber‹››*

___

###  getAttestationServiceStatus

▸ **getAttestationServiceStatus**(`validator`: [Validator](../interfaces/_wrappers_validators_.validator.md)): *Promise‹[AttestationServiceStatusResponse](../interfaces/_wrappers_attestations_.attestationservicestatusresponse.md)›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:591](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L591)*

Gets the relevant attestation service status for a validator

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validator` | [Validator](../interfaces/_wrappers_validators_.validator.md) | Validator to get the attestation service status for  |

**Returns:** *Promise‹[AttestationServiceStatusResponse](../interfaces/_wrappers_attestations_.attestationservicestatusresponse.md)›*

___

###  getConfig

▸ **getConfig**(`tokens`: string[]): *Promise‹[AttestationsConfig](../interfaces/_wrappers_attestations_.attestationsconfig.md)›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:396](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L396)*

Returns the current configuration parameters for the contract.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tokens` | string[] | List of tokens used for attestation fees. |

**Returns:** *Promise‹[AttestationsConfig](../interfaces/_wrappers_attestations_.attestationsconfig.md)›*

AttestationsConfig object

___

###  getHumanReadableConfig

▸ **getHumanReadableConfig**(`tokens`: string[]): *Promise‹object›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:413](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L413)*

**`dev`** Returns human readable configuration of the attestations contract

**Parameters:**

Name | Type |
------ | ------ |
`tokens` | string[] |

**Returns:** *Promise‹object›*

AttestationsConfig object

___

###  getNonCompliantIssuers

▸ **getNonCompliantIssuers**(`identifier`: string, `account`: [Address](../modules/_base_.md#address)): *Promise‹[Address](../modules/_base_.md#address)[]›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:293](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L293)*

Returns an array of issuer addresses that were found to not run the attestation service

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_base_.md#address) | Address of the account  |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)[]›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Attestations›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Attestations› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getRevealStatus

▸ **getRevealStatus**(`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address), `serviceURL`: string, `pepper?`: undefined | string): *Promise‹Response›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:538](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L538)*

Returns reveal status from validator's attestation service

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`account` | [Address](../modules/_base_.md#address) |
`issuer` | [Address](../modules/_base_.md#address) |
`serviceURL` | string |
`pepper?` | undefined &#124; string |

**Returns:** *Promise‹Response›*

___

###  getVerifiedStatus

▸ **getVerifiedStatus**(`identifier`: string, `account`: [Address](../modules/_base_.md#address), `numAttestationsRequired?`: undefined | number, `attestationThreshold?`: undefined | number): *Promise‹AttestationsStatus›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:231](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L231)*

Returns the verified status of an identifier/account pair indicating whether the attestation
stats for a given pair are completed beyond a certain threshold of confidence (aka "verified")

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_base_.md#address) | Address of the account |
`numAttestationsRequired?` | undefined &#124; number | Optional number of attestations required.  Will default to  hardcoded value if absent. |
`attestationThreshold?` | undefined &#124; number | Optional threshold for fraction attestations completed. Will  default to hardcoded value if absent.  |

**Returns:** *Promise‹AttestationsStatus›*

___

###  isAttestationExpired

▸ **isAttestationExpired**(`attestationRequestBlockNumber`: number): *Promise‹boolean›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L148)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationRequestBlockNumber` | number | Attestation Request Block Number to be checked  |

**Returns:** *Promise‹boolean›*

___

###  lookupIdentifiers

▸ **lookupIdentifiers**(`identifiers`: string[]): *Promise‹[IdentifierLookupResult](../modules/_wrappers_attestations_.md#identifierlookupresult)›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:425](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L425)*

Lookup mapped wallet addresses for a given list of identifiers

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifiers` | string[] | Attestation identifiers (e.g. phone hashes)  |

**Returns:** *Promise‹[IdentifierLookupResult](../modules/_wrappers_attestations_.md#identifierlookupresult)›*

___

###  request

▸ **request**(`identifier`: string, `attestationsRequested`: number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:466](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L466)*

Requests a new attestation

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  revealPhoneNumberToIssuer

▸ **revealPhoneNumberToIssuer**(`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address), `serviceURL`: string, `pepper?`: undefined | string, `smsRetrieverAppSig?`: undefined | string): *Promise‹Response›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:506](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L506)*

Reveal phone number to issuer

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`account` | [Address](../modules/_base_.md#address) |
`issuer` | [Address](../modules/_base_.md#address) |
`serviceURL` | string |
`pepper?` | undefined &#124; string |
`smsRetrieverAppSig?` | undefined &#124; string |

**Returns:** *Promise‹Response›*

___

###  revoke

▸ **revoke**(`identifer`: string, `account`: [Address](../modules/_base_.md#address)): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:703](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L703)*

**Parameters:**

Name | Type |
------ | ------ |
`identifer` | string |
`account` | [Address](../modules/_base_.md#address) |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  selectIssuers

▸ **selectIssuers**(`identifier`: string): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:478](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L478)*

Selects the issuers for previously requested attestations for a phone number

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash)  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  selectIssuersAfterWait

▸ **selectIssuersAfterWait**(`identifier`: string, `account`: string, `timeoutSeconds?`: undefined | number, `pollDurationSeconds?`: undefined | number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:487](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L487)*

Waits appropriate number of blocks, then selects issuers for previously requested phone number attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | string | Address of the account  |
`timeoutSeconds?` | undefined &#124; number | - |
`pollDurationSeconds?` | undefined &#124; number | - |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  validateAttestationCode

▸ **validateAttestationCode**(`identifier`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address), `code`: string): *Promise‹boolean›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:564](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L564)*

Validates a given code by the issuer on-chain

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_base_.md#address) | The address of the account which requested attestation |
`issuer` | [Address](../modules/_base_.md#address) | The address of the issuer of the attestation |
`code` | string | The code send by the issuer  |

**Returns:** *Promise‹boolean›*

___

###  waitForSelectingIssuers

▸ **waitForSelectingIssuers**(`identifier`: string, `account`: [Address](../modules/_base_.md#address), `timeoutSeconds`: number, `pollDurationSeconds`: number): *Promise‹void›*

*Defined in [packages/contractkit/src/wrappers/Attestations.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L160)*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`identifier` | string | - | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_base_.md#address) | - | Address of the account  |
`timeoutSeconds` | number | 120 | - |
`pollDurationSeconds` | number | 1 | - |

**Returns:** *Promise‹void›*
