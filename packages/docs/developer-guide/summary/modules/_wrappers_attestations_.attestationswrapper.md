# AttestationsWrapper

## Hierarchy

* [BaseWrapper]()‹Attestations›

  ↳ **AttestationsWrapper**

## Index

### Constructors

* [constructor]()

### Properties

* [approveTransfer]()
* [attestationExpiryBlocks]()
* [attestationRequestFees]()
* [eventTypes]()
* [events]()
* [getAttestationIssuers]()
* [getAttestationStat]()
* [getAttestationState]()
* [getUnselectedRequest]()
* [lookupAccountsForIdentifier]()
* [methodIds]()
* [selectIssuersWaitBlocks]()

### Accessors

* [address]()

### Methods

* [approveAttestationFee]()
* [complete]()
* [findMatchingIssuer]()
* [getActionableAttestations]()
* [getAttestationFeeRequired]()
* [getAttestationForSecurityCode]()
* [getAttestationServiceStatus]()
* [getConfig]()
* [getHumanReadableConfig]()
* [getNonCompliantIssuers]()
* [getPastEvents]()
* [getRevealStatus]()
* [getVerifiedStatus]()
* [isAttestationExpired]()
* [lookupIdentifiers]()
* [request]()
* [revealPhoneNumberToIssuer]()
* [revoke]()
* [selectIssuers]()
* [selectIssuersAfterWait]()
* [validateAttestationCode]()
* [waitForSelectingIssuers]()

## Constructors

### constructor

+ **new AttestationsWrapper**\(`kit`: [ContractKit](), `contract`: Attestations\): [_AttestationsWrapper_]()

_Inherited from_ [_BaseWrapper_]()_._[_constructor_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Attestations |

**Returns:** [_AttestationsWrapper_]()

## Properties

### approveTransfer

• **approveTransfer**: _function_ = proxySend\(this.kit, this.contract.methods.approveTransfer\)

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:500_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L500)

Updates sender's approval status on whether to allow an attestation identifier mapping to be transfered from one address to another.

**`param`** The identifier for this attestation.

**`param`** The index of the account in the accounts array.

**`param`** The current attestation address to which the identifier is mapped.

**`param`** The new address to map to identifier.

**`param`** The approval status

#### Type declaration:

▸ \(...`args`: InputArgs\): [_CeloTransactionObject_]()_‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### attestationExpiryBlocks

• **attestationExpiryBlocks**: _function_ = proxyCall\( this.contract.methods.attestationExpiryBlocks, undefined, valueToInt \)

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:106_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L106)

Returns the time an attestation can be completable before it is considered expired

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### attestationRequestFees

• **attestationRequestFees**: _function_ = proxyCall\( this.contract.methods.attestationRequestFees, undefined, valueToBigNumber \)

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L117)

Returns the attestation request fee in a given currency.

**`param`** Token address.

**`returns`** The fee as big number.

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Inherited from_ [_BaseWrapper_]()_._[_eventTypes_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:42_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L42)

### events

• **events**: _Attestations\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L40)

### getAttestationIssuers

• **getAttestationIssuers**: _function_ = proxyCall\(this.contract.methods.getAttestationIssuers\)

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:190_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L190)

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

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:212_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L212)

Returns the attestation stats of a identifer/account pair

**`param`** Attestation identifier \(e.g. phone hash\)

**`param`** Address of the account

#### Type declaration:

▸ \(`identifier`: string, `account`: [Address](_base_.md#address)\): _Promise‹_[_AttestationStat_]()_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifier` | string |
| `account` | [Address](_base_.md#address) |

### getAttestationState

• **getAttestationState**: _function_ = proxyCall\( this.contract.methods.getAttestationState, undefined, \(state\) =&gt; \({ attestationState: valueToInt\(state\[0\]\) }\) \)

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:197_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L197)

Returns the attestation state of a phone number/account/issuer tuple

**`param`** Attestation identifier \(e.g. phone hash\)

**`param`** Address of the account

#### Type declaration:

▸ \(`identifier`: string, `account`: [Address](_base_.md#address), `issuer`: [Address](_base_.md#address)\): _Promise‹_[_AttestationStateForIssuer_]()_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifier` | string |
| `account` | [Address](_base_.md#address) |
| `issuer` | [Address](_base_.md#address) |

### getUnselectedRequest

• **getUnselectedRequest**: _function_ = proxyCall\( this.contract.methods.getUnselectedRequest, undefined, \(res\) =&gt; \({ blockNumber: valueToInt\(res\[0\]\), attestationsRequested: valueToInt\(res\[1\]\), attestationRequestFeeToken: res\[2\], }\) \)

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:134_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L134)

**`notice`** Returns the unselected attestation request for an identifier/account pair, if any.

**`param`** Attestation identifier \(e.g. phone hash\)

**`param`** Address of the account

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### lookupAccountsForIdentifier

• **lookupAccountsForIdentifier**: _function_ = proxyCall\(this.contract.methods.lookupAccountsForIdentifier\)

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:436_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L436)

Returns the list of accounts associated with an identifier.

**`param`** Attestation identifier \(e.g. phone hash\)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### methodIds

• **methodIds**: _Record‹keyof T\["methods"\], string›_ = Object.keys\(this.contract.methods\).reduce, string&gt;&gt;\( \(acc, method: Methods\) =&gt; { const methodABI = this.contract.options.jsonInterface.find\(\(item\) =&gt; item.name === method\)

```text
  acc[method] =
    methodABI === undefined ? '0x' : this.kit.web3.eth.abi.encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L47)

### selectIssuersWaitBlocks

• **selectIssuersWaitBlocks**: _function_ = proxyCall\( this.contract.methods.selectIssuersWaitBlocks, undefined, valueToInt \)

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:123_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L123)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### approveAttestationFee

▸ **approveAttestationFee**\(`attestationsRequested`: number\): _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:259_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L259)

Approves the necessary amount of StableToken to request Attestations

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `attestationsRequested` | number | The number of attestations to request |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹boolean››_

### complete

▸ **complete**\(`identifier`: string, `account`: [Address](_base_.md#address), `issuer`: [Address](_base_.md#address), `code`: string\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:356_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L356)

Completes an attestation with the corresponding code

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](_base_.md#address) | Address of the account |
| `issuer` | [Address](_base_.md#address) | The issuer of the attestation |
| `code` | string | The code received by the validator |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

### findMatchingIssuer

▸ **findMatchingIssuer**\(`identifier`: string, `account`: [Address](_base_.md#address), `code`: string, `issuers`: string\[\]\): _Promise‹string \| null›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:378_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L378)

Given a list of issuers, finds the matching issuer for a given code

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](_base_.md#address) | Address of the account |
| `code` | string | The code received by the validator |
| `issuers` | string\[\] | The list of potential issuers |

**Returns:** _Promise‹string \| null›_

### getActionableAttestations

▸ **getActionableAttestations**\(`identifier`: string, `account`: [Address](_base_.md#address), `tries`: number\): _Promise‹_[_ActionableAttestation_]()_\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:271_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L271)

Returns an array of attestations that can be completed, along with the issuers' attestation service urls

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `identifier` | string | - | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](_base_.md#address) | - | Address of the account |
| `tries` | number | 3 | - |

**Returns:** _Promise‹_[_ActionableAttestation_]()_\[\]›_

### getAttestationFeeRequired

▸ **getAttestationFeeRequired**\(`attestationsRequested`: number\): _Promise‹BigNumber‹››_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:249_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L249)

Calculates the amount of StableToken required to request Attestations

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `attestationsRequested` | number | The number of attestations to request |

**Returns:** _Promise‹BigNumber‹››_

### getAttestationForSecurityCode

▸ **getAttestationForSecurityCode**\(`serviceURL`: string, `requestBody`: GetAttestationRequest\): _Promise‹Response›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:572_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L572)

Returns attestation code for provided security code from validator's attestation service

**Parameters:**

| Name | Type |
| :--- | :--- |
| `serviceURL` | string |
| `requestBody` | GetAttestationRequest |

**Returns:** _Promise‹Response›_

### getAttestationServiceStatus

▸ **getAttestationServiceStatus**\(`validator`: [Validator]()\): _Promise‹_[_AttestationServiceStatusResponse_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:624_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L624)

Gets the relevant attestation service status for a validator

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validator` | [Validator]() | Validator to get the attestation service status for |

**Returns:** _Promise‹_[_AttestationServiceStatusResponse_]()_›_

### getConfig

▸ **getConfig**\(`tokens`: string\[\]\): _Promise‹_[_AttestationsConfig_]()_›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:407_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L407)

Returns the current configuration parameters for the contract.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tokens` | string\[\] | List of tokens used for attestation fees. |

**Returns:** _Promise‹_[_AttestationsConfig_]()_›_

AttestationsConfig object

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(`tokens`: string\[\]\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:424_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L424)

**`dev`** Returns human readable configuration of the attestations contract

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tokens` | string\[\] |

**Returns:** _Promise‹object›_

AttestationsConfig object

### getNonCompliantIssuers

▸ **getNonCompliantIssuers**\(`identifier`: string, `account`: [Address](_base_.md#address), `tries`: number\): _Promise‹_[_Address_](_base_.md#address)_\[\]›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:294_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L294)

Returns an array of issuer addresses that were found to not run the attestation service

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `identifier` | string | - | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](_base_.md#address) | - | Address of the account |
| `tries` | number | 3 | - |

**Returns:** _Promise‹_[_Address_](_base_.md#address)_\[\]›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Attestations›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_packages/contractkit/src/wrappers/BaseWrapper.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L36)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Attestations› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getRevealStatus

▸ **getRevealStatus**\(`phoneNumber`: string, `account`: [Address](_base_.md#address), `issuer`: [Address](_base_.md#address), `serviceURL`: string, `pepper?`: undefined \| string\): _Promise‹Response›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:548_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L548)

Returns reveal status from validator's attestation service

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumber` | string |
| `account` | [Address](_base_.md#address) |
| `issuer` | [Address](_base_.md#address) |
| `serviceURL` | string |
| `pepper?` | undefined \| string |

**Returns:** _Promise‹Response›_

### getVerifiedStatus

▸ **getVerifiedStatus**\(`identifier`: string, `account`: [Address](_base_.md#address), `numAttestationsRequired?`: undefined \| number, `attestationThreshold?`: undefined \| number\): _Promise‹AttestationsStatus›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:231_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L231)

Returns the verified status of an identifier/account pair indicating whether the attestation stats for a given pair are completed beyond a certain threshold of confidence \(aka "verified"\)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](_base_.md#address) | Address of the account |
| `numAttestationsRequired?` | undefined \| number | Optional number of attestations required.  Will default to  hardcoded value if absent. |
| `attestationThreshold?` | undefined \| number | Optional threshold for fraction attestations completed. Will  default to hardcoded value if absent. |

**Returns:** _Promise‹AttestationsStatus›_

### isAttestationExpired

▸ **isAttestationExpired**\(`attestationRequestBlockNumber`: number\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:148_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L148)

**`notice`** Checks if attestation request is expired.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `attestationRequestBlockNumber` | number | Attestation Request Block Number to be checked |

**Returns:** _Promise‹boolean›_

### lookupIdentifiers

▸ **lookupIdentifiers**\(`identifiers`: string\[\]\): _Promise‹_[_IdentifierLookupResult_](_wrappers_attestations_.md#identifierlookupresult)_›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:442_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L442)

Lookup mapped wallet addresses for a given list of identifiers

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifiers` | string\[\] | Attestation identifiers \(e.g. phone hashes\) |

**Returns:** _Promise‹_[_IdentifierLookupResult_](_wrappers_attestations_.md#identifierlookupresult)_›_

### request

▸ **request**\(`identifier`: string, `attestationsRequested`: number\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:483_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L483)

Requests a new attestation

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `attestationsRequested` | number | The number of attestations to request |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

### revealPhoneNumberToIssuer

▸ **revealPhoneNumberToIssuer**\(`serviceURL`: string, `requestBody`: AttestationRequest\): _Promise‹Response›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:530_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L530)

Reveal phone number to issuer

**Parameters:**

| Name | Type |
| :--- | :--- |
| `serviceURL` | string |
| `requestBody` | AttestationRequest |

**Returns:** _Promise‹Response›_

### revoke

▸ **revoke**\(`identifer`: string, `account`: [Address](_base_.md#address)\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:736_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L736)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifer` | string |
| `account` | [Address](_base_.md#address) |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

### selectIssuers

▸ **selectIssuers**\(`identifier`: string\): [_CeloTransactionObject_]()_‹void›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:506_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L506)

Selects the issuers for previously requested attestations for a phone number

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |

**Returns:** [_CeloTransactionObject_]()_‹void›_

### selectIssuersAfterWait

▸ **selectIssuersAfterWait**\(`identifier`: string, `account`: string, `timeoutSeconds?`: undefined \| number, `pollDurationSeconds?`: undefined \| number\): _Promise‹_[_CeloTransactionObject_]()_‹void››_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:515_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L515)

Waits appropriate number of blocks, then selects issuers for previously requested phone number attestations

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | string | Address of the account |
| `timeoutSeconds?` | undefined \| number | - |
| `pollDurationSeconds?` | undefined \| number | - |

**Returns:** _Promise‹_[_CeloTransactionObject_]()_‹void››_

### validateAttestationCode

▸ **validateAttestationCode**\(`identifier`: string, `account`: [Address](_base_.md#address), `issuer`: [Address](_base_.md#address), `code`: string\): _Promise‹boolean›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:597_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L597)

Validates a given code by the issuer on-chain

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](_base_.md#address) | The address of the account which requested attestation |
| `issuer` | [Address](_base_.md#address) | The address of the issuer of the attestation |
| `code` | string | The code send by the issuer |

**Returns:** _Promise‹boolean›_

### waitForSelectingIssuers

▸ **waitForSelectingIssuers**\(`identifier`: string, `account`: [Address](_base_.md#address), `timeoutSeconds`: number, `pollDurationSeconds`: number\): _Promise‹void›_

_Defined in_ [_packages/contractkit/src/wrappers/Attestations.ts:160_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/Attestations.ts#L160)

**`notice`** Waits for appropriate block numbers for before issuer can be selected

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `identifier` | string | - | Attestation identifier \(e.g. phone hash\) |
| `account` | [Address](_base_.md#address) | - | Address of the account |
| `timeoutSeconds` | number | 120 | - |
| `pollDurationSeconds` | number | 1 | - |

**Returns:** _Promise‹void›_

