# BaseWrapper

Base ContractWrapper

## Type parameters

▪ **T**: _Contract_

## Hierarchy

* **BaseWrapper**

  ↳ [AccountsWrapper](_wrappers_accounts_.accountswrapper.md)

  ↳ [ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)

  ↳ [AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)

  ↳ [BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)

  ↳ [BaseSlasher](_wrappers_baseslasher_.baseslasher.md)

  ↳ [ElectionWrapper](_wrappers_election_.electionwrapper.md)

  ↳ [EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)

  ↳ [ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)

  ↳ [FreezerWrapper](_wrappers_freezer_.freezerwrapper.md)

  ↳ [GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)

  ↳ [GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)

  ↳ [GovernanceWrapper](_wrappers_governance_.governancewrapper.md)

  ↳ [LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)

  ↳ [MetaTransactionWalletWrapper](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)

  ↳ [MetaTransactionWalletDeployerWrapper](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)

  ↳ [MultiSigWrapper](_wrappers_multisig_.multisigwrapper.md)

  ↳ [ReserveWrapper](_wrappers_reserve_.reservewrapper.md)

  ↳ [SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)

  ↳ [StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)

  ↳ [ReleaseGoldWrapper](_wrappers_releasegold_.releasegoldwrapper.md)

## Index

### Constructors

* [constructor](_wrappers_basewrapper_.basewrapper.md#constructor)

### Properties

* [eventTypes](_wrappers_basewrapper_.basewrapper.md#eventtypes)
* [events](_wrappers_basewrapper_.basewrapper.md#events)
* [methodIds](_wrappers_basewrapper_.basewrapper.md#methodids)

### Accessors

* [address](_wrappers_basewrapper_.basewrapper.md#address)

### Methods

* [getPastEvents](_wrappers_basewrapper_.basewrapper.md#getpastevents)

## Constructors

### constructor

+ **new BaseWrapper**\(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: T\): [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contract` | T |

**Returns:** [_BaseWrapper_](_wrappers_basewrapper_.basewrapper.md)

## Properties

### eventTypes

• **eventTypes**: _EventsEnum‹T›_ = Object.keys\(this.events\).reduce&gt;\( \(acc, key\) =&gt; \({ ...acc, \[key\]: key }\), {} as any \)

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L41)

### events

• **events**: _T\["events"\]_ = this.contract.events

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L39)

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

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:46_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L46)

## Accessors

### address

• **get address**\(\): _string_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L30)

Contract address

**Returns:** _string_

## Methods

### getPastEvents

▸ **getPastEvents**\(`event`: Events‹T›, `options`: PastEventOptions\): _Promise‹EventLog\[\]›_

_Defined in_ [_contractkit/src/wrappers/BaseWrapper.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/BaseWrapper.ts#L35)

Contract getPastEvents

**Parameters:**

| Name | Type |
| :--- | :--- |
| `event` | Events‹T› |
| `options` | PastEventOptions |

**Returns:** _Promise‹EventLog\[\]›_

