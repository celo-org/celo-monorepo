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
* [getPendingWithdrawals]()
* [getUnselectedRequest]()
* [lookupAccountsForIdentifier]()
* [methodIds]()
* [selectIssuersWaitBlocks]()
* [withdraw]()

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contract` | Attestations |

**Returns:** [_AttestationsWrapper_]()

## Properties

### approveTransfer

• **approveTransfer**: _function_ = proxySend\(this.kit, this.contract.methods.approveTransfer\)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:536_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L536)

Updates sender's approval status on whether to allow an attestation identifier mapping to be transfered from one address to another.

**`param`** The identifier for this attestation.

**`param`** The index of the account in the accounts array.

**`param`** The current attestation address to which the identifier is mapped.

**`param`** The new address to map to identifier.

**`param`** The approval status

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### attestationExpiryBlocks

• **attestationExpiryBlocks**: _function_ = proxyCall\( this.contract.methods.attestationExpiryBlocks, undefined, valueToInt \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:108_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L108)

Returns the time an attestation can be completable before it is considered expired

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### attestationRequestFees

• **attestationRequestFees**: _function_ = proxyCall\( this.contract.methods.attestationRequestFees, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:119_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L119)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _Attestations\["events"\]_ = this.contract.events

_Inherited from_ [_BaseWrapper_]()_._[_events_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

### getAttestationIssuers

• **getAttestationIssuers**: _function_ = proxyCall\(this.contract.methods.getAttestationIssuers\)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:192_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L192)

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

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:214_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L214)

Returns the attestation stats of a identifer/account pair

**`param`** Attestation identifier \(e.g. phone hash\)

**`param`** Address of the account

#### Type declaration:

▸ \(`identifier`: string, `account`: Address\): _Promise‹_[_AttestationStat_]()_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifier` | string |
| `account` | Address |

### getAttestationState

• **getAttestationState**: _function_ = proxyCall\( this.contract.methods.getAttestationState, undefined, \(state\) =&gt; \({ attestationState: valueToInt\(state\[0\]\) }\) \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:199_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L199)

Returns the attestation state of a phone number/account/issuer tuple

**`param`** Attestation identifier \(e.g. phone hash\)

**`param`** Address of the account

#### Type declaration:

▸ \(`identifier`: string, `account`: Address, `issuer`: Address\): _Promise‹_[_AttestationStateForIssuer_]()_›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifier` | string |
| `account` | Address |
| `issuer` | Address |

### getPendingWithdrawals

• **getPendingWithdrawals**: _function_ = proxyCall\( this.contract.methods.pendingWithdrawals, undefined, valueToBigNumber \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:395_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L395)

Returns the attestation signer for the specified account.

**`param`** The address of token rewards are accumulated in.

**`param`** The address of the account.

**`returns`** The reward amount.

#### Type declaration:

▸ \(`token`: string, `account`: string\): _Promise‹BigNumber›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `token` | string |
| `account` | string |

### getUnselectedRequest

• **getUnselectedRequest**: _function_ = proxyCall\( this.contract.methods.getUnselectedRequest, undefined, \(res\) =&gt; \({ blockNumber: valueToInt\(res\[0\]\), attestationsRequested: valueToInt\(res\[1\]\), attestationRequestFeeToken: res\[2\], }\) \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:136_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L136)

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

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:472_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L472)

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
    methodABI === undefined
      ? '0x'
      : this.kit.connection.getAbiCoder().encodeFunctionSignature(methodABI)

  return acc
},
{} as any
```

\)

_Inherited from_ [_BaseWrapper_]()_._[_methodIds_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

### selectIssuersWaitBlocks

• **selectIssuersWaitBlocks**: _function_ = proxyCall\( this.contract.methods.selectIssuersWaitBlocks, undefined, valueToInt \)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:125_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L125)

#### Type declaration:

▸ \(...`args`: InputArgs\): _Promise‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

### withdraw

• **withdraw**: _function_ = proxySend\(this.kit, this.contract.methods.withdraw\)

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:405_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L405)

Allows issuers to withdraw accumulated attestation rewards

**`param`** The address of the token that will be withdrawn

#### Type declaration:

▸ \(...`args`: InputArgs\): _CeloTransactionObject‹Output›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | InputArgs |

## Accessors

### address

• **get address**\(\): _string_

_Inherited from_ [_BaseWrapper_]()_._[_address_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### approveAttestationFee

▸ **approveAttestationFee**\(`attestationsRequested`: number\): _Promise‹CeloTransactionObject‹boolean››_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:261_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L261)

Approves the necessary amount of StableToken to request Attestations

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `attestationsRequested` | number | The number of attestations to request |

**Returns:** _Promise‹CeloTransactionObject‹boolean››_

### complete

▸ **complete**\(`identifier`: string, `account`: Address, `issuer`: Address, `code`: string\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:371_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L371)

Completes an attestation with the corresponding code

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | Address | Address of the account |
| `issuer` | Address | The issuer of the attestation |
| `code` | string | The code received by the validator |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### findMatchingIssuer

▸ **findMatchingIssuer**\(`identifier`: string, `account`: Address, `code`: string, `issuers`: string\[\]\): _Promise‹string \| null›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:414_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L414)

Given a list of issuers, finds the matching issuer for a given code

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | Address | Address of the account |
| `code` | string | The code received by the validator |
| `issuers` | string\[\] | The list of potential issuers |

**Returns:** _Promise‹string \| null›_

### getActionableAttestations

▸ **getActionableAttestations**\(`identifier`: string, `account`: Address, `tries`: number\): _Promise‹_[_ActionableAttestation_]()_\[\]›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:273_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L273)

Returns an array of attestations that can be completed, along with the issuers' attestation service urls

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `identifier` | string | - | Attestation identifier \(e.g. phone hash\) |
| `account` | Address | - | Address of the account |
| `tries` | number | 3 | - |

**Returns:** _Promise‹_[_ActionableAttestation_]()_\[\]›_

### getAttestationFeeRequired

▸ **getAttestationFeeRequired**\(`attestationsRequested`: number\): _Promise‹BigNumber‹››_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:251_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L251)

Calculates the amount of StableToken required to request Attestations

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `attestationsRequested` | number | The number of attestations to request |

**Returns:** _Promise‹BigNumber‹››_

### getAttestationForSecurityCode

▸ **getAttestationForSecurityCode**\(`serviceURL`: string, `requestBody`: GetAttestationRequest, `signer`: Address\): _Promise‹string›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:608_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L608)

Returns attestation code for provided security code from validator's attestation service

**Parameters:**

| Name | Type |
| :--- | :--- |
| `serviceURL` | string |
| `requestBody` | GetAttestationRequest |
| `signer` | Address |

**Returns:** _Promise‹string›_

### getAttestationServiceStatus

▸ **getAttestationServiceStatus**\(`validator`: [Validator]()\): _Promise‹_[_AttestationServiceStatusResponse_]()_›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:685_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L685)

Gets the relevant attestation service status for a validator

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `validator` | [Validator]() | Validator to get the attestation service status for |

**Returns:** _Promise‹_[_AttestationServiceStatusResponse_]()_›_

### getConfig

▸ **getConfig**\(`tokens`: string\[\]\): _Promise‹_[_AttestationsConfig_]()_›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:443_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L443)

Returns the current configuration parameters for the contract.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `tokens` | string\[\] | List of tokens used for attestation fees. |

**Returns:** _Promise‹_[_AttestationsConfig_]()_›_

AttestationsConfig object

### getHumanReadableConfig

▸ **getHumanReadableConfig**\(`tokens`: string\[\]\): _Promise‹object›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:460_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L460)

**`dev`** Returns human readable configuration of the attestations contract

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tokens` | string\[\] |

**Returns:** _Promise‹object›_

AttestationsConfig object

### getNonCompliantIssuers

▸ **getNonCompliantIssuers**\(`identifier`: string, `account`: Address, `tries`: number\): _Promise‹Address\[\]›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:296_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L296)

Returns an array of issuer addresses that were found to not run the attestation service

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `identifier` | string | - | Attestation identifier \(e.g. phone hash\) |
| `account` | Address | - | Address of the account |
| `tries` | number | 3 | - |

**Returns:** _Promise‹Address\[\]›_

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹Attestations›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Inherited from_ [_BaseWrapper_]()_._[_getPastEvents_]()

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹Attestations› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

### getRevealStatus

▸ **getRevealStatus**\(`phoneNumber`: string, `account`: Address, `issuer`: Address, `serviceURL`: string, `pepper?`: undefined \| string\): _Promise‹Response›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:584_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L584)

Returns reveal status from validator's attestation service

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumber` | string |
| `account` | Address |
| `issuer` | Address |
| `serviceURL` | string |
| `pepper?` | undefined \| string |

**Returns:** _Promise‹Response›_

### getVerifiedStatus

▸ **getVerifiedStatus**\(`identifier`: string, `account`: Address, `numAttestationsRequired?`: undefined \| number, `attestationThreshold?`: undefined \| number\): _Promise‹AttestationsStatus›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:233_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L233)

Returns the verified status of an identifier/account pair indicating whether the attestation stats for a given pair are completed beyond a certain threshold of confidence \(aka "verified"\)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | Address | Address of the account |
| `numAttestationsRequired?` | undefined \| number | Optional number of attestations required.  Will default to  hardcoded value if absent. |
| `attestationThreshold?` | undefined \| number | Optional threshold for fraction attestations completed. Will  default to hardcoded value if absent. |

**Returns:** _Promise‹AttestationsStatus›_

### isAttestationExpired

▸ **isAttestationExpired**\(`attestationRequestBlockNumber`: number\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:150_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L150)

**`notice`** Checks if attestation request is expired.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `attestationRequestBlockNumber` | number | Attestation Request Block Number to be checked |

**Returns:** _Promise‹boolean›_

### lookupIdentifiers

▸ **lookupIdentifiers**\(`identifiers`: string\[\]\): _Promise‹_[_IdentifierLookupResult_](_wrappers_attestations_.md#identifierlookupresult)_›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:478_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L478)

Lookup mapped wallet addresses for a given list of identifiers

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifiers` | string\[\] | Attestation identifiers \(e.g. phone hashes\) |

**Returns:** _Promise‹_[_IdentifierLookupResult_](_wrappers_attestations_.md#identifierlookupresult)_›_

### request

▸ **request**\(`identifier`: string, `attestationsRequested`: number\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:519_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L519)

Requests a new attestation

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `attestationsRequested` | number | The number of attestations to request |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### revealPhoneNumberToIssuer

▸ **revealPhoneNumberToIssuer**\(`serviceURL`: string, `requestBody`: AttestationRequest\): _Promise‹Response›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:566_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L566)

Reveal phone number to issuer

**Parameters:**

| Name | Type |
| :--- | :--- |
| `serviceURL` | string |
| `requestBody` | AttestationRequest |

**Returns:** _Promise‹Response›_

### revoke

▸ **revoke**\(`identifer`: string, `account`: Address\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:803_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L803)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifer` | string |
| `account` | Address |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### selectIssuers

▸ **selectIssuers**\(`identifier`: string\): _CeloTransactionObject‹void›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:542_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L542)

Selects the issuers for previously requested attestations for a phone number

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |

**Returns:** _CeloTransactionObject‹void›_

### selectIssuersAfterWait

▸ **selectIssuersAfterWait**\(`identifier`: string, `account`: string, `timeoutSeconds?`: undefined \| number, `pollDurationSeconds?`: undefined \| number\): _Promise‹CeloTransactionObject‹void››_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:551_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L551)

Waits appropriate number of blocks, then selects issuers for previously requested phone number attestations

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | string | Address of the account |
| `timeoutSeconds?` | undefined \| number | - |
| `pollDurationSeconds?` | undefined \| number | - |

**Returns:** _Promise‹CeloTransactionObject‹void››_

### validateAttestationCode

▸ **validateAttestationCode**\(`identifier`: string, `account`: Address, `issuer`: Address, `code`: string\): _Promise‹boolean›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:658_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L658)

Validates a given code by the issuer on-chain

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `identifier` | string | Attestation identifier \(e.g. phone hash\) |
| `account` | Address | The address of the account which requested attestation |
| `issuer` | Address | The address of the issuer of the attestation |
| `code` | string | The code send by the issuer |

**Returns:** _Promise‹boolean›_

### waitForSelectingIssuers

▸ **waitForSelectingIssuers**\(`identifier`: string, `account`: Address, `timeoutSeconds`: number, `pollDurationSeconds`: number\): _Promise‹void›_

_Defined in_ [_contractkit/src/wrappers/Attestations.ts:162_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/Attestations.ts#L162)

**`notice`** Waits for appropriate block numbers for before issuer can be selected

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `identifier` | string | - | Attestation identifier \(e.g. phone hash\) |
| `account` | Address | - | Address of the account |
| `timeoutSeconds` | number | 120 | - |
| `pollDurationSeconds` | number | 1 | - |

**Returns:** _Promise‹void›_

