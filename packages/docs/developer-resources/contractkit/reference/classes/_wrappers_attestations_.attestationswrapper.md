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

*Defined in [contractkit/src/wrappers/Attestations.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L96)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L107)*

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

• **getAttestationIssuers**: *function* = proxyCall(this.contract.methods.getAttestationIssuers)

*Defined in [contractkit/src/wrappers/Attestations.ts:163](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L163)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:185](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L185)*

Returns the attestation stats of a phone number/account pair

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

*Defined in [contractkit/src/wrappers/Attestations.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L170)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:119](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L119)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L113)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:208](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L208)*

Approves the necessary amount of StableToken to request Attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹boolean››*

___

###  complete

▸ **complete**(`identifier`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address), `code`: string): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:294](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L294)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:316](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L316)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:220](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L220)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:198](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L198)*

Calculates the amount of StableToken required to request Attestations

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹BigNumber‹››*

___

###  getConfig

▸ **getConfig**(`tokens`: string[]): *Promise‹[AttestationsConfig](../interfaces/_wrappers_attestations_.attestationsconfig.md)›*

*Defined in [contractkit/src/wrappers/Attestations.ts:344](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L344)*

Returns the current configuration parameters for the contract.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tokens` | string[] | List of tokens used for attestation fees.  |

**Returns:** *Promise‹[AttestationsConfig](../interfaces/_wrappers_attestations_.attestationsconfig.md)›*

___

###  getNonCompliantIssuers

▸ **getNonCompliantIssuers**(`identifier`: string, `account`: [Address](../modules/_base_.md#address)): *Promise‹[Address](../modules/_base_.md#address)[]›*

*Defined in [contractkit/src/wrappers/Attestations.ts:242](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L242)*

Returns an array of issuer addresses that were found to not run the attestation service

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_base_.md#address) | Address of the account  |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)[]›*

___

###  lookupIdentifiers

▸ **lookupIdentifiers**(`identifiers`: string[]): *Promise‹[IdentifierLookupResult](../modules/_wrappers_attestations_.md#identifierlookupresult)›*

*Defined in [contractkit/src/wrappers/Attestations.ts:361](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L361)*

Lookup mapped wallet addresses for a given list of identifiers

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifiers` | string[] | Attestation identifiers (e.g. phone hashes)  |

**Returns:** *Promise‹[IdentifierLookupResult](../modules/_wrappers_attestations_.md#identifierlookupresult)›*

___

###  request

▸ **request**(`identifier`: string, `attestationsRequested`: number): *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

*Defined in [contractkit/src/wrappers/Attestations.ts:402](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L402)*

Requests a new attestation

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash) |
`attestationsRequested` | number | The number of attestations to request  |

**Returns:** *Promise‹[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void››*

___

###  revealPhoneNumberToIssuer

▸ **revealPhoneNumberToIssuer**(`phoneNumber`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address), `serviceURL`: string, `salt?`: undefined | string): *Promise‹Response›*

*Defined in [contractkit/src/wrappers/Attestations.ts:418](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L418)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`account` | [Address](../modules/_base_.md#address) |
`issuer` | [Address](../modules/_base_.md#address) |
`serviceURL` | string |
`salt?` | undefined &#124; string |

**Returns:** *Promise‹Response›*

___

###  selectIssuers

▸ **selectIssuers**(`identifier`: string): *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

*Defined in [contractkit/src/wrappers/Attestations.ts:414](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L414)*

Selects the issuers for previously requested attestations for a phone number

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Attestation identifier (e.g. phone hash)  |

**Returns:** *[CeloTransactionObject](_wrappers_basewrapper_.celotransactionobject.md)‹void›*

___

###  validateAttestationCode

▸ **validateAttestationCode**(`identifier`: string, `account`: [Address](../modules/_base_.md#address), `issuer`: [Address](../modules/_base_.md#address), `code`: string): *Promise‹boolean›*

*Defined in [contractkit/src/wrappers/Attestations.ts:449](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L449)*

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

*Defined in [contractkit/src/wrappers/Attestations.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L134)*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`identifier` | string | - | Attestation identifier (e.g. phone hash) |
`account` | [Address](../modules/_base_.md#address) | - | Address of the account  |
`timeoutSeconds` | number | 120 | - |
`pollDurationSeconds` | number | 1 | - |

**Returns:** *Promise‹void›*
