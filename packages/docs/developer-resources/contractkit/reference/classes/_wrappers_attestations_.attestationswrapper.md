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
* [attestationFeeRequired](_wrappers_attestations_.attestationswrapper.md#attestationfeerequired)
* [complete](_wrappers_attestations_.attestationswrapper.md#complete)
* [findMatchingIssuer](_wrappers_attestations_.attestationswrapper.md#findmatchingissuer)
* [getActionableAttestations](_wrappers_attestations_.attestationswrapper.md#getactionableattestations)
* [getConfig](_wrappers_attestations_.attestationswrapper.md#getconfig)
* [getNonCompliantIssuers](_wrappers_attestations_.attestationswrapper.md#getnoncompliantissuers)
* [lookupPhoneNumbers](_wrappers_attestations_.attestationswrapper.md#lookupphonenumbers)
* [request](_wrappers_attestations_.attestationswrapper.md#request)
* [revealPhoneNumberToIssuer](_wrappers_attestations_.attestationswrapper.md#revealphonenumbertoissuer)
* [selectIssuers](_wrappers_attestations_.attestationswrapper.md#selectissuers)
* [validateAttestationCode](_wrappers_attestations_.attestationswrapper.md#validateattestationcode)
* [waitForSelectingIssuers](_wrappers_attestations_.attestationswrapper.md#waitforselectingissuers)

## Constructors

###  constructor

\+ **new AttestationsWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: Attestations): *[AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L82)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:93](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L93)*

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

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

___

###  getAttestationIssuers

• **getAttestationIssuers**: *function* = proxyCall(
    this.contract.methods.getAttestationIssuers,
    tupleParser(PhoneNumberUtils.getPhoneHash, (x: string) => x)
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:149](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L149)*

Returns the issuers of attestations for a phoneNumber/account combo

**`param`** Phone Number

**`param`** Account

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
    tupleParser(PhoneNumberUtils.getPhoneHash, stringIdentity),
    (stat) => ({ completed: valueToInt(stat[0]), total: valueToInt(stat[1]) })
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:174](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L174)*

Returns the attestation stats of a phone number/account pair

**`param`** Phone Number

**`param`** Account

#### Type declaration:

▸ (`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address)): *Promise‹[AttestationStat](../interfaces/_wrappers_attestations_.attestationstat.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`account` | [Address](../modules/_base_.md#address) |

___

###  getAttestationState

• **getAttestationState**: *function* = proxyCall(
    this.contract.methods.getAttestationState,
    tupleParser(PhoneNumberUtils.getPhoneHash, stringIdentity, stringIdentity),
    (state) => ({ attestationState: parseInt(state[0], 10) })
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:159](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L159)*

Returns the attestation state of a phone number/account/issuer tuple

**`param`** Phone Number

**`param`** Account

#### Type declaration:

▸ (`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address)): *Promise‹[AttestationStateForIssuer](../interfaces/_wrappers_attestations_.attestationstateforissuer.md)›*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`account` | [Address](../modules/_base_.md#address) |
`issuer` | [Address](../modules/_base_.md#address) |

___

###  getUnselectedRequest

• **getUnselectedRequest**: *function* = proxyCall(
    this.contract.methods.getUnselectedRequest,
    tupleParser(PhoneNumberUtils.getPhoneHash, (x: string) => x),
    (res) => ({
      blockNumber: valueToInt(res[0]),
      attestationsRequested: valueToInt(res[1]),
      attestationRequestFeeToken: res[2],
    })
  )

*Defined in [contractkit/src/wrappers/Attestations.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L110)*

**`notice`** Returns the unselected attestation request for an identifier/account pair, if any.

**`param`** Hash of the identifier.

**`param`** Address of the account.

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

*Defined in [contractkit/src/wrappers/Attestations.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L99)*

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

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*

## Methods

###  approveAttestationFee

▸ **approveAttestationFee**(`attestationsRequested`: number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

*Defined in [contractkit/src/wrappers/Attestations.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L197)*

Approves the necessary amount of StableToken to request Attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  attestationFeeRequired

▸ **attestationFeeRequired**(`attestationsRequested`: number): *Promise‹BigNumber‹››*

*Defined in [contractkit/src/wrappers/Attestations.ts:187](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L187)*

Calculates the amount of StableToken required to request Attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹BigNumber‹››*

___

###  complete

▸ **complete**(`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address), `code`: string): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:283](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L283)*

Completes an attestation with the corresponding code

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`phoneNumber` | string | The phone number of the attestation |
`account` | [Address](../modules/_base_.md#address) | The account of the attestation |
`issuer` | [Address](../modules/_base_.md#address) | The issuer of the attestation |
`code` | string | The code received by the validator  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  findMatchingIssuer

▸ **findMatchingIssuer**(`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address), `code`: string, `issuers`: string[]): *Promise‹string | null›*

*Defined in [contractkit/src/wrappers/Attestations.ts:302](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L302)*

Given a list of issuers, finds the matching issuer for a given code

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`phoneNumber` | string | The phone number of the attestation |
`account` | [Address](../modules/_base_.md#address) | The account of the attestation |
`code` | string | The code received by the validator |
`issuers` | string[] | The list of potential issuers  |

**Returns:** *Promise‹string | null›*

___

###  getActionableAttestations

▸ **getActionableAttestations**(`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address)): *Promise‹[ActionableAttestation](../interfaces/_wrappers_attestations_.actionableattestation.md)[]›*

*Defined in [contractkit/src/wrappers/Attestations.ts:209](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L209)*

Returns an array of attestations that can be completed, along with the issuers' attestation
service urls

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`phoneNumber` | string | - |
`account` | [Address](../modules/_base_.md#address) |   |

**Returns:** *Promise‹[ActionableAttestation](../interfaces/_wrappers_attestations_.actionableattestation.md)[]›*

___

###  getConfig

▸ **getConfig**(`tokens`: string[]): *Promise‹[AttestationsConfig](../interfaces/_wrappers_attestations_.attestationsconfig.md)›*

*Defined in [contractkit/src/wrappers/Attestations.ts:331](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L331)*

Returns the current configuration parameters for the contract.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tokens` | string[] | List of tokens used for attestation fees.  |

**Returns:** *Promise‹[AttestationsConfig](../interfaces/_wrappers_attestations_.attestationsconfig.md)›*

___

###  getNonCompliantIssuers

▸ **getNonCompliantIssuers**(`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address)): *Promise‹[Address](../modules/_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/Attestations.ts:231](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L231)*

Returns an array of issuer addresses that were found to not run the attestation service

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`phoneNumber` | string | - |
`account` | [Address](../modules/_base_.md#address) |   |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)[]›*

___

###  lookupPhoneNumbers

▸ **lookupPhoneNumbers**(`phoneNumberHashes`: string[]): *Promise‹Record‹string, Record‹string, [AttestationStat](../interfaces/_wrappers_attestations_.attestationstat.md)›››*

*Defined in [contractkit/src/wrappers/Attestations.ts:348](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L348)*

Lookup mapped walleet addresses for a given list of hashes of phone numbers

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`phoneNumberHashes` | string[] | The hashes of phone numbers to lookup  |

**Returns:** *Promise‹Record‹string, Record‹string, [AttestationStat](../interfaces/_wrappers_attestations_.attestationstat.md)›››*

___

###  request

▸ **request**(`phoneNumber`: string, `attestationsRequested`: number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:391](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L391)*

Requests attestations for a phone number

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`phoneNumber` | string | The phone number for which to request attestations for |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  revealPhoneNumberToIssuer

▸ **revealPhoneNumberToIssuer**(`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address), `serviceURL`: string): *Promise‹Response›*

*Defined in [contractkit/src/wrappers/Attestations.ts:409](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L409)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`account` | [Address](../modules/_base_.md#address) |
`issuer` | [Address](../modules/_base_.md#address) |
`serviceURL` | string |

**Returns:** *Promise‹Response›*

___

###  selectIssuers

▸ **selectIssuers**(`phoneNumber`: string): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

*Defined in [contractkit/src/wrappers/Attestations.ts:404](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L404)*

Selects the issuers for previously requested attestations for a phone number

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`phoneNumber` | string | The phone number for which to request attestations for  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  validateAttestationCode

▸ **validateAttestationCode**(`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address), `code`: string): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Attestations.ts:435](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L435)*

Validates a given code by the issuer on-chain

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`phoneNumber` | string | The phone number which requested attestation |
`account` | [Address](../modules/_base_.md#address) | The account which requested attestation |
`issuer` | [Address](../modules/_base_.md#address) | The address of the issuer of the attestation |
`code` | string | The code send by the issuer  |

**Returns:** *Promise‹boolean›*

___

###  waitForSelectingIssuers

▸ **waitForSelectingIssuers**(`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address), `timeoutSeconds`: number, `pollDurationSeconds`: number): *Promise‹void›*

*Defined in [contractkit/src/wrappers/Attestations.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L120)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`phoneNumber` | string | - |
`account` | [Address](../modules/_base_.md#address) | - |
`timeoutSeconds` | number | 120 |
`pollDurationSeconds` | number | 1 |

**Returns:** *Promise‹void›*
