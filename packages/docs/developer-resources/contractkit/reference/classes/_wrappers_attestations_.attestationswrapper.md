# Class: AttestationsWrapper

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹Attestations›

  ↳ **AttestationsWrapper**

## Index

### Constructors

* [constructor](_wrappers_attestations_.attestationswrapper.md#constructor)

### Properties

* [approveTransfer](_wrappers_attestations_.attestationswrapper.md#approvetransfer)
* [attestationExpiryBlocks](_wrappers_attestations_.attestationswrapper.md#attestationexpiryblocks)
* [attestationRequestFees](_wrappers_attestations_.attestationswrapper.md#attestationrequestfees)
* [eventTypes](_wrappers_attestations_.attestationswrapper.md#eventtypes)
* [events](_wrappers_attestations_.attestationswrapper.md#events)
* [getAttestationIssuers](_wrappers_attestations_.attestationswrapper.md#getattestationissuers)
* [getAttestationStat](_wrappers_attestations_.attestationswrapper.md#getattestationstat)
* [getAttestationState](_wrappers_attestations_.attestationswrapper.md#getattestationstate)
* [getPendingWithdrawals](_wrappers_attestations_.attestationswrapper.md#getpendingwithdrawals)
* [getUnselectedRequest](_wrappers_attestations_.attestationswrapper.md#getunselectedrequest)
* [lookupAccountsForIdentifier](_wrappers_attestations_.attestationswrapper.md#lookupaccountsforidentifier)
* [methodIds](_wrappers_attestations_.attestationswrapper.md#methodids)
* [selectIssuersWaitBlocks](_wrappers_attestations_.attestationswrapper.md#selectissuerswaitblocks)
* [withdraw](_wrappers_attestations_.attestationswrapper.md#withdraw)

### Accessors

* [address](_wrappers_attestations_.attestationswrapper.md#address)

### Methods

* [approveAttestationFee](_wrappers_attestations_.attestationswrapper.md#approveattestationfee)
* [complete](_wrappers_attestations_.attestationswrapper.md#complete)
* [findMatchingIssuer](_wrappers_attestations_.attestationswrapper.md#findmatchingissuer)
* [getActionableAttestations](_wrappers_attestations_.attestationswrapper.md#getactionableattestations)
* [getAttestationFeeRequired](_wrappers_attestations_.attestationswrapper.md#getattestationfeerequired)
* [getAttestationForSecurityCode](_wrappers_attestations_.attestationswrapper.md#getattestationforsecuritycode)
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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | Attestations |

**Returns:** *[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)*

## Properties

###  approveTransfer

• **approveTransfer**: *function* = proxySend(this.kit, this.contract.methods.approveTransfer)

*Defined in [contractkit/src/wrappers/Attestations.ts:536](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L536)*

Updates sender's approval status on whether to allow an attestation identifier
mapping to be transfered from one address to another.

**`param`** The identifier for this attestation.

**`param`** The index of the account in the accounts array.

**`param`** The current attestation address to which the identifier is mapped.

**`param`** The new address to map to identifier.

**`param`** The approval status

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  attestationExpiryBlocks

• **attestationExpiryBlocks**: *function* = proxyCall(
    this.contract.methods.attestationExpiryBlocks,
    undefined,
    valueToInt
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:108](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L108)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:119](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L119)*

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

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

___

###  events

• **events**: *Attestations["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)*

___

###  getAttestationIssuers

• **getAttestationIssuers**: *function* = proxyCall(this.contract.methods.getAttestationIssuers)

*Defined in [contractkit/src/wrappers/Attestations.ts:192](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L192)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:214](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L214)*

Returns the attestation stats of a identifer/account pair

**`param`** Attestation identifier (e.g. phone hash)

**`param`** Address of the account

#### Type declaration:

▸ (`identifier`: string, `account`: Address): *Promise‹[AttestationStat](../interfaces/_wrappers_attestations_.attestationstat.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`account` | Address |

___

###  getAttestationState

• **getAttestationState**: *function* = proxyCall(
    this.contract.methods.getAttestationState,
    undefined,
    (state) => ({ attestationState: valueToInt(state[0]) })
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:199](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L199)*

Returns the attestation state of a phone number/account/issuer tuple

**`param`** Attestation identifier (e.g. phone hash)

**`param`** Address of the account

#### Type declaration:

▸ (`identifier`: string, `account`: Address, `issuer`: Address): *Promise‹[AttestationStateForIssuer](../interfaces/_wrappers_attestations_.attestationstateforissuer.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`account` | Address |
`issuer` | Address |

___

###  getPendingWithdrawals

• **getPendingWithdrawals**: *function* = proxyCall(
    this.contract.methods.pendingWithdrawals,
    undefined,
    valueToBigNumber
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:395](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L395)*

Returns the attestation signer for the specified account.

**`param`** The address of token rewards are accumulated in.

**`param`** The address of the account.

**`returns`** The reward amount.

#### Type declaration:

▸ (`token`: string, `account`: string): *Promise‹BigNumber›*

**Parameters:**

Name | Type |
------ | ------ |
`token` | string |
`account` | string |

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

*Defined in [contractkit/src/wrappers/Attestations.ts:136](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L136)*

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

###  lookupAccountsForIdentifier

• **lookupAccountsForIdentifier**: *function* = proxyCall(this.contract.methods.lookupAccountsForIdentifier)

*Defined in [contractkit/src/wrappers/Attestations.ts:472](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L472)*

Returns the list of accounts associated with an identifier.

**`param`** Attestation identifier (e.g. phone hash)

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  methodIds

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)*

___

###  selectIssuersWaitBlocks

• **selectIssuersWaitBlocks**: *function* = proxyCall(
    this.contract.methods.selectIssuersWaitBlocks,
    undefined,
    valueToInt
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L125)*

#### Type declaration:

▸ (...`args`: InputArgs): *Promise‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

___

###  withdraw

• **withdraw**: *function* = proxySend(this.kit, this.contract.methods.withdraw)

*Defined in [contractkit/src/wrappers/Attestations.ts:405](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L405)*

Allows issuers to withdraw accumulated attestation rewards

**`param`** The address of the token that will be withdrawn

#### Type declaration:

▸ (...`args`: InputArgs): *CeloTransactionObject‹Output›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | InputArgs |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)*

Contract address

**Returns:** *string*

## Methods

###  approveAttestationFee

▸ **approveAttestationFee**(`attestationsRequested`: number): *Promise‹CeloTransactionObject‹boolean››*

*Defined in [contractkit/src/wrappers/Attestations.ts:261](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L261)*

Approves the necessary amount of StableToken to request Attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹CeloTransactionObject‹boolean››*

___

###  complete

▸ **complete**(`identifier`: string, `account`: Address, `issuer`: Address, `code`: string): *Promise‹CeloTransactionObject‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:371](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L371)*

Completes an attestation with the corresponding code

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | Address | Address of the account |
`issuer` | Address | The issuer of the attestation |
`code` | string | The code received by the validator  |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  findMatchingIssuer

▸ **findMatchingIssuer**(`identifier`: string, `account`: Address, `code`: string, `issuers`: string[]): *Promise‹string | null›*

*Defined in [contractkit/src/wrappers/Attestations.ts:414](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L414)*

Given a list of issuers, finds the matching issuer for a given code

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | Address | Address of the account |
`code` | string | The code received by the validator |
`issuers` | string[] | The list of potential issuers  |

**Returns:** *Promise‹string | null›*

___

###  getActionableAttestations

▸ **getActionableAttestations**(`identifier`: string, `account`: Address, `tries`: number): *Promise‹[ActionableAttestation](../interfaces/_wrappers_attestations_.actionableattestation.md)[]›*

*Defined in [contractkit/src/wrappers/Attestations.ts:273](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L273)*

Returns an array of attestations that can be completed, along with the issuers' attestation
service urls

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`identifier` | string | - | Attestation identifier (e.g. phone hash) |
`account` | Address | - | Address of the account  |
`tries` | number | 3 | - |

**Returns:** *Promise‹[ActionableAttestation](../interfaces/_wrappers_attestations_.actionableattestation.md)[]›*

___

###  getAttestationFeeRequired

▸ **getAttestationFeeRequired**(`attestationsRequested`: number): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Attestations.ts:251](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L251)*

Calculates the amount of StableToken required to request Attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹BigNumber‹››*

___

###  getAttestationForSecurityCode

▸ **getAttestationForSecurityCode**(`serviceURL`: string, `requestBody`: GetAttestationRequest, `signer`: Address): *Promise‹string›*

*Defined in [contractkit/src/wrappers/Attestations.ts:608](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L608)*

Returns attestation code for provided security code from validator's attestation service

**Parameters:**

Name | Type |
------ | ------ |
`serviceURL` | string |
`requestBody` | GetAttestationRequest |
`signer` | Address |

**Returns:** *Promise‹string›*

___

###  getAttestationServiceStatus

▸ **getAttestationServiceStatus**(`validator`: [Validator](../interfaces/_wrappers_validators_.validator.md)): *Promise‹[AttestationServiceStatusResponse](../interfaces/_wrappers_attestations_.attestationservicestatusresponse.md)›*

*Defined in [contractkit/src/wrappers/Attestations.ts:685](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L685)*

Gets the relevant attestation service status for a validator

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validator` | [Validator](../interfaces/_wrappers_validators_.validator.md) | Validator to get the attestation service status for  |

**Returns:** *Promise‹[AttestationServiceStatusResponse](../interfaces/_wrappers_attestations_.attestationservicestatusresponse.md)›*

___

###  getConfig

▸ **getConfig**(`tokens`: string[]): *Promise‹[AttestationsConfig](../interfaces/_wrappers_attestations_.attestationsconfig.md)›*

*Defined in [contractkit/src/wrappers/Attestations.ts:443](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L443)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:460](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L460)*

**`dev`** Returns human readable configuration of the attestations contract

**Parameters:**

Name | Type |
------ | ------ |
`tokens` | string[] |

**Returns:** *Promise‹object›*

AttestationsConfig object

___

###  getNonCompliantIssuers

▸ **getNonCompliantIssuers**(`identifier`: string, `account`: Address, `tries`: number): *Promise‹Address[]›*

*Defined in [contractkit/src/wrappers/Attestations.ts:296](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L296)*

Returns an array of issuer addresses that were found to not run the attestation service

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`identifier` | string | - | Attestation identifier (e.g. phone hash) |
`account` | Address | - | Address of the account  |
`tries` | number | 3 | - |

**Returns:** *Promise‹Address[]›*

___

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹Attestations›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹Attestations› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  getRevealStatus

▸ **getRevealStatus**(`phoneNumber`: string, `account`: Address, `issuer`: Address, `serviceURL`: string, `pepper?`: undefined | string): *Promise‹Response›*

*Defined in [contractkit/src/wrappers/Attestations.ts:584](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L584)*

Returns reveal status from validator's attestation service

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`account` | Address |
`issuer` | Address |
`serviceURL` | string |
`pepper?` | undefined &#124; string |

**Returns:** *Promise‹Response›*

___

###  getVerifiedStatus

▸ **getVerifiedStatus**(`identifier`: string, `account`: Address, `numAttestationsRequired?`: undefined | number, `attestationThreshold?`: undefined | number): *Promise‹AttestationsStatus›*

*Defined in [contractkit/src/wrappers/Attestations.ts:233](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L233)*

Returns the verified status of an identifier/account pair indicating whether the attestation
stats for a given pair are completed beyond a certain threshold of confidence (aka "verified")

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | Address | Address of the account |
`numAttestationsRequired?` | undefined &#124; number | Optional number of attestations required.  Will default to  hardcoded value if absent. |
`attestationThreshold?` | undefined &#124; number | Optional threshold for fraction attestations completed. Will  default to hardcoded value if absent.  |

**Returns:** *Promise‹AttestationsStatus›*

___

###  isAttestationExpired

▸ **isAttestationExpired**(`attestationRequestBlockNumber`: number): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Attestations.ts:150](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L150)*

**`notice`** Checks if attestation request is expired.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationRequestBlockNumber` | number | Attestation Request Block Number to be checked  |

**Returns:** *Promise‹boolean›*

___

###  lookupIdentifiers

▸ **lookupIdentifiers**(`identifiers`: string[]): *Promise‹[IdentifierLookupResult](../modules/_wrappers_attestations_.md#identifierlookupresult)›*

*Defined in [contractkit/src/wrappers/Attestations.ts:478](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L478)*

Lookup mapped wallet addresses for a given list of identifiers

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifiers` | string[] | Attestation identifiers (e.g. phone hashes)  |

**Returns:** *Promise‹[IdentifierLookupResult](../modules/_wrappers_attestations_.md#identifierlookupresult)›*

___

###  request

▸ **request**(`identifier`: string, `attestationsRequested`: number): *Promise‹CeloTransactionObject‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:519](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L519)*

Requests a new attestation

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  revealPhoneNumberToIssuer

▸ **revealPhoneNumberToIssuer**(`serviceURL`: string, `requestBody`: AttestationRequest): *Promise‹Response›*

*Defined in [contractkit/src/wrappers/Attestations.ts:566](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L566)*

Reveal phone number to issuer

**Parameters:**

Name | Type |
------ | ------ |
`serviceURL` | string |
`requestBody` | AttestationRequest |

**Returns:** *Promise‹Response›*

___

###  revoke

▸ **revoke**(`identifer`: string, `account`: Address): *Promise‹CeloTransactionObject‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:803](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L803)*

**Parameters:**

Name | Type |
------ | ------ |
`identifer` | string |
`account` | Address |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  selectIssuers

▸ **selectIssuers**(`identifier`: string): *CeloTransactionObject‹void›*

*Defined in [contractkit/src/wrappers/Attestations.ts:542](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L542)*

Selects the issuers for previously requested attestations for a phone number

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash)  |

**Returns:** *CeloTransactionObject‹void›*

___

###  selectIssuersAfterWait

▸ **selectIssuersAfterWait**(`identifier`: string, `account`: string, `timeoutSeconds?`: undefined | number, `pollDurationSeconds?`: undefined | number): *Promise‹CeloTransactionObject‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:551](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L551)*

Waits appropriate number of blocks, then selects issuers for previously requested phone number attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | string | Address of the account  |
`timeoutSeconds?` | undefined &#124; number | - |
`pollDurationSeconds?` | undefined &#124; number | - |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  validateAttestationCode

▸ **validateAttestationCode**(`identifier`: string, `account`: Address, `issuer`: Address, `code`: string): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Attestations.ts:658](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L658)*

Validates a given code by the issuer on-chain

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | Address | The address of the account which requested attestation |
`issuer` | Address | The address of the issuer of the attestation |
`code` | string | The code send by the issuer  |

**Returns:** *Promise‹boolean›*

___

###  waitForSelectingIssuers

▸ **waitForSelectingIssuers**(`identifier`: string, `account`: Address, `timeoutSeconds`: number, `pollDurationSeconds`: number): *Promise‹void›*

*Defined in [contractkit/src/wrappers/Attestations.ts:162](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L162)*

**`notice`** Waits for appropriate block numbers for before issuer can be selected

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`identifier` | string | - | Attestation identifier (e.g. phone hash) |
`account` | Address | - | Address of the account  |
`timeoutSeconds` | number | 120 | - |
`pollDurationSeconds` | number | 1 | - |

**Returns:** *Promise‹void›*
