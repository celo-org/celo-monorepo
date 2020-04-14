# Class: BaseWrapper <**T**>

Base ContractWrapper

## Type parameters

▪ **T**: *Contract*

## Hierarchy

* **BaseWrapper**

  ↳ [AccountsWrapper](_contractkit_src_wrappers_accounts_.accountswrapper.md)

  ↳ [AttestationsWrapper](_contractkit_src_wrappers_attestations_.attestationswrapper.md)

  ↳ [BlockchainParametersWrapper](_contractkit_src_wrappers_blockchainparameters_.blockchainparameterswrapper.md)

  ↳ [DoubleSigningSlasherWrapper](_contractkit_src_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)

  ↳ [ValidatorsWrapper](_contractkit_src_wrappers_validators_.validatorswrapper.md)

  ↳ [DowntimeSlasherWrapper](_contractkit_src_wrappers_downtimeslasher_.downtimeslasherwrapper.md)

  ↳ [ElectionWrapper](_contractkit_src_wrappers_election_.electionwrapper.md)

  ↳ [EscrowWrapper](_contractkit_src_wrappers_escrow_.escrowwrapper.md)

  ↳ [ExchangeWrapper](_contractkit_src_wrappers_exchange_.exchangewrapper.md)

  ↳ [GasPriceMinimumWrapper](_contractkit_src_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)

  ↳ [GoldTokenWrapper](_contractkit_src_wrappers_goldtokenwrapper_.goldtokenwrapper.md)

  ↳ [GovernanceWrapper](_contractkit_src_wrappers_governance_.governancewrapper.md)

  ↳ [LockedGoldWrapper](_contractkit_src_wrappers_lockedgold_.lockedgoldwrapper.md)

  ↳ [MultiSigWrapper](_contractkit_src_wrappers_multisig_.multisigwrapper.md)

  ↳ [ReserveWrapper](_contractkit_src_wrappers_reserve_.reservewrapper.md)

  ↳ [SortedOraclesWrapper](_contractkit_src_wrappers_sortedoracles_.sortedoracleswrapper.md)

  ↳ [StableTokenWrapper](_contractkit_src_wrappers_stabletokenwrapper_.stabletokenwrapper.md)

  ↳ [ReleaseGoldWrapper](_contractkit_src_wrappers_releasegold_.releasegoldwrapper.md)

## Index

### Constructors

* [constructor](_contractkit_src_wrappers_basewrapper_.basewrapper.md#constructor)

### Properties

* [events](_contractkit_src_wrappers_basewrapper_.basewrapper.md#events)

### Accessors

* [address](_contractkit_src_wrappers_basewrapper_.basewrapper.md#address)

## Constructors

###  constructor

\+ **new BaseWrapper**(`kit`: [ContractKit](_contractkit_src_kit_.contractkit.md), `contract`: T): *[BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_contractkit_src_kit_.contractkit.md) |
`contract` | T |

**Returns:** *[BaseWrapper](_contractkit_src_wrappers_basewrapper_.basewrapper.md)*

## Properties

###  events

• **events**: *any* = this.contract.events

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L33)*

## Accessors

###  address

• **get address**(): *string*

*Defined in [contractkit/src/wrappers/BaseWrapper.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L23)*

Contract address

**Returns:** *string*
