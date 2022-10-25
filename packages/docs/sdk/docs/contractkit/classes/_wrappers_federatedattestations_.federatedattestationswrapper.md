[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["wrappers/FederatedAttestations"](../modules/_wrappers_federatedattestations_.md) › [FederatedAttestationsWrapper](_wrappers_federatedattestations_.federatedattestationswrapper.md)

# Class: FederatedAttestationsWrapper

## Hierarchy

* [BaseWrapper](_wrappers_basewrapper_.basewrapper.md)‹FederatedAttestations›

  ↳ **FederatedAttestationsWrapper**

## Index

### Constructors

* [constructor](_wrappers_federatedattestations_.federatedattestationswrapper.md#constructor)

### Properties

* [batchRevokeAttestations](_wrappers_federatedattestations_.federatedattestationswrapper.md#batchrevokeattestations)
* [eventTypes](_wrappers_federatedattestations_.federatedattestationswrapper.md#eventtypes)
* [events](_wrappers_federatedattestations_.federatedattestationswrapper.md#events)
* [getUniqueAttestationHash](_wrappers_federatedattestations_.federatedattestationswrapper.md#getuniqueattestationhash)
* [lookupAttestations](_wrappers_federatedattestations_.federatedattestationswrapper.md#lookupattestations)
* [lookupIdentifiers](_wrappers_federatedattestations_.federatedattestationswrapper.md#lookupidentifiers)
* [methodIds](_wrappers_federatedattestations_.federatedattestationswrapper.md#methodids)
* [registerAttestationAsIssuer](_wrappers_federatedattestations_.federatedattestationswrapper.md#registerattestationasissuer)
* [revokeAttestation](_wrappers_federatedattestations_.federatedattestationswrapper.md#revokeattestation)
* [validateAttestationSig](_wrappers_federatedattestations_.federatedattestationswrapper.md#validateattestationsig)

### Accessors

* [address](_wrappers_federatedattestations_.federatedattestationswrapper.md#address)

### Methods

* [getPastEvents](_wrappers_federatedattestations_.federatedattestationswrapper.md#getpastevents)
* [registerAttestation](_wrappers_federatedattestations_.federatedattestationswrapper.md#registerattestation)
* [version](_wrappers_federatedattestations_.federatedattestationswrapper.md#version)

## Constructors

###  constructor

\+ **new FederatedAttestationsWrapper**(`connection`: Connection, `contract`: FederatedAttestations): *[FederatedAttestationsWrapper](_wrappers_federatedattestations_.federatedattestationswrapper.md)*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[constructor](_wrappers_basewrapper_.basewrapper.md#constructor)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`connection` | Connection |
`contract` | FederatedAttestations |

**Returns:** *[FederatedAttestationsWrapper](_wrappers_federatedattestations_.federatedattestationswrapper.md)*

## Properties

###  batchRevokeAttestations

• **batchRevokeAttestations**: *function* = proxySend(
    this.connection,
    this.contract.methods.batchRevokeAttestations
  )

*Defined in [packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts#L167)*

**`notice`** Revokes attestations [identifiers <-> accounts] from issuer

**`param`** Address of the issuer of all attestations to be revoked

**`param`** Hash of the identifiers

**`param`** Addresses of the accounts mapped to the identifiers
  at the same indices

**`dev`** Throws if the number of identifiers and accounts is not the same

**`dev`** Throws if sender is not the issuer or currently registered signer of issuer

**`dev`** Throws if an attestation is not found for identifiers[i] <-> accounts[i]

#### Type declaration:

▸ (`issuer`: Address, `identifiers`: string[], `accounts`: Address[]): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`issuer` | Address |
`identifiers` | string[] |
`accounts` | Address[] |

___

###  eventTypes

• **eventTypes**: *EventsEnum‹T›* = Object.keys(this.events).reduce<EventsEnum<T>>(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L63)*

___

###  events

• **events**: *FederatedAttestations["events"]* = this.contract.events

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[events](_wrappers_basewrapper_.basewrapper.md#events)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L61)*

___

###  getUniqueAttestationHash

• **getUniqueAttestationHash**: *function* = proxyCall(this.contract.methods.getUniqueAttestationHash)

*Defined in [packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts#L76)*

**`returns`** keccak 256 of abi encoded parameters

#### Type declaration:

▸ (`identifier`: string, `issuer`: Address, `account`: Address, `signer`: Address, `issuedOn`: number): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`issuer` | Address |
`account` | Address |
`signer` | Address |
`issuedOn` | number |

___

###  lookupAttestations

• **lookupAttestations**: *function* = proxyCall(this.contract.methods.lookupAttestations)

*Defined in [packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts#L38)*

**`notice`** Returns info about attestations for `identifier` produced by
   signers of `trustedIssuers`

**`param`** Hash of the identifier

**`param`** Array of n issuers whose attestations will be included

**`returns`** countsPerIssuer Array of number of attestations returned per issuer
         For m (== sum([0])) found attestations:

**`returns`** accounts Array of m accounts

**`returns`** signers Array of m signers

**`returns`** issuedOns Array of m issuedOns

**`returns`** publishedOns Array of m publishedOns

**`dev`** Adds attestation info to the arrays in order of provided trustedIssuers

**`dev`** Expectation that only one attestation exists per (identifier, issuer, account)

#### Type declaration:

▸ (`identifier`: string, `trustedIssuers`: Address[]): *Promise‹object›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`trustedIssuers` | Address[] |

___

###  lookupIdentifiers

• **lookupIdentifiers**: *function* = proxyCall(this.contract.methods.lookupIdentifiers)

*Defined in [packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts#L16)*

**`notice`** Returns identifiers mapped to `account` by signers of `trustedIssuers`

**`param`** Address of the account

**`param`** Array of n issuers whose identifier mappings will be used

**`returns`** countsPerIssuer Array of number of identifiers returned per issuer

**`returns`** identifiers Array (length == sum([0])) of identifiers

**`dev`** Adds identifier info to the arrays in order of provided trustedIssuers

**`dev`** Expectation that only one attestation exists per (identifier, issuer, account)

#### Type declaration:

▸ (`account`: Address, `trustedIssuers`: Address[]): *Promise‹object›*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |
`trustedIssuers` | Address[] |

___

###  methodIds

• **methodIds**: *Record‹keyof T["methods"], string›* = Object.keys(this.contract.methods).reduce<Record<Methods<T>, string>>(
    (acc, method: Methods<T>) => {
      const methodABI = this.contract.options.jsonInterface.find((item) => item.name === method)

      acc[method] =
        methodABI === undefined
          ? '0x'
          : this.connection.getAbiCoder().encodeFunctionSignature(methodABI)

      return acc
    },
    {} as any
  )

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L68)*

___

###  registerAttestationAsIssuer

• **registerAttestationAsIssuer**: *function* = proxySend(
    this.connection,
    this.contract.methods.registerAttestationAsIssuer
  )

*Defined in [packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts#L92)*

**`notice`** Registers an attestation directly from the issuer

**`param`** Hash of the identifier to be attested

**`param`** Address of the account being mapped to the identifier

**`param`** Time at which the issuer issued the attestation in Unix time

**`dev`** Attestation signer and issuer in storage is set to msg.sender

**`dev`** Throws if an attestation with the same (identifier, issuer, account) already exists

#### Type declaration:

▸ (`identifier`: string, `account`: Address, `issuedOn`: number): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`account` | Address |
`issuedOn` | number |

___

###  revokeAttestation

• **revokeAttestation**: *function* = proxySend(
    this.connection,
    this.contract.methods.revokeAttestation
  )

*Defined in [packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts#L148)*

**`notice`** Revokes an attestation

**`param`** Hash of the identifier to be revoked

**`param`** Address of the attestation issuer

**`param`** Address of the account mapped to the identifier

**`dev`** Throws if sender is not the issuer, signer, or account

#### Type declaration:

▸ (`identifier`: string, `issuer`: Address, `account`: Address): *CeloTransactionObject‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`issuer` | Address |
`account` | Address |

___

###  validateAttestationSig

• **validateAttestationSig**: *function* = proxyCall(this.contract.methods.validateAttestationSig)

*Defined in [packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts#L62)*

**`notice`** Validates the given attestation and signature

**`param`** Hash of the identifier to be attested

**`param`** Address of the attestation issuer

**`param`** Address of the account being mapped to the identifier

**`param`** Time at which the issuer issued the attestation in Unix time

**`param`** Address of the signer of the attestation

**`param`** The recovery id of the incoming ECDSA signature

**`param`** Output value r of the ECDSA signature

**`param`** Output value s of the ECDSA signature

**`dev`** Throws if attestation has been revoked

**`dev`** Throws if signer is not an authorized AttestationSigner of the issuer

#### Type declaration:

▸ (`identifier`: string, `issuer`: Address, `account`: Address, `signer`: Address, `issuedOn`: number, `v`: number | string, `r`: string | number[], `s`: string | number[]): *Promise‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`issuer` | Address |
`account` | Address |
`signer` | Address |
`issuedOn` | number |
`v` | number &#124; string |
`r` | string &#124; number[] |
`s` | string &#124; number[] |

## Accessors

###  address

• **get address**(): *string*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[address](_wrappers_basewrapper_.basewrapper.md#address)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L37)*

Contract address

**Returns:** *string*

## Methods

###  getPastEvents

▸ **getPastEvents**(`event`: Events‹FederatedAttestations›, `options`: PastEventOptions): *Promise‹EventLog[]›*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L57)*

Contract getPastEvents

**Parameters:**

Name | Type |
------ | ------ |
`event` | Events‹FederatedAttestations› |
`options` | PastEventOptions |

**Returns:** *Promise‹EventLog[]›*

___

###  registerAttestation

▸ **registerAttestation**(`identifier`: string, `issuer`: Address, `account`: Address, `signer`: Address, `issuedOn`: number): *Promise‹CeloTransactionObject‹void››*

*Defined in [packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/FederatedAttestations.ts#L110)*

**`notice`** Generates a valid signature and registers the attestation

**`dev`** Throws if an attestation with the same (identifier, issuer, account) already exists

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identifier` | string | Hash of the identifier to be attested |
`issuer` | Address | Address of the attestation issuer |
`account` | Address | Address of the account being mapped to the identifier |
`signer` | Address | Address of the signer of the attestation |
`issuedOn` | number | Time at which the issuer issued the attestation in Unix time |

**Returns:** *Promise‹CeloTransactionObject‹void››*

___

###  version

▸ **version**(): *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*

*Inherited from [BaseWrapper](_wrappers_basewrapper_.basewrapper.md).[version](_wrappers_basewrapper_.basewrapper.md#version)*

*Defined in [packages/sdk/contractkit/src/wrappers/BaseWrapper.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)*

**Returns:** *Promise‹NonNullable‹T["methods"] extends object ? ContractVersion<> : never››*
