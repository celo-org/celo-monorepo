# Class: BaseWrapper <**T**>

Base ContractWrapper

## Type parameters

▪ **T**: *Contract*

## Hierarchy

* **BaseWrapper**

  ↳ [AccountsWrapper](_wrappers_accounts_.accountswrapper.md)

  ↳ [AttestationsWrapper](_wrappers_attestations_.attestationswrapper.md)

  ↳ [BlockchainParametersWrapper](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)

  ↳ [DoubleSigningSlasherWrapper](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)

  ↳ [ValidatorsWrapper](_wrappers_validators_.validatorswrapper.md)

  ↳ [DowntimeSlasherWrapper](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)

  ↳ [ElectionWrapper](_wrappers_election_.electionwrapper.md)

  ↳ [EscrowWrapper](_wrappers_escrow_.escrowwrapper.md)

  ↳ [ExchangeWrapper](_wrappers_exchange_.exchangewrapper.md)

  ↳ [GasPriceMinimumWrapper](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)

  ↳ [GoldTokenWrapper](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)

  ↳ [GovernanceWrapper](_wrappers_governance_.governancewrapper.md)

  ↳ [LockedGoldWrapper](_wrappers_lockedgold_.lockedgoldwrapper.md)

  ↳ [ReserveWrapper](_wrappers_reserve_.reservewrapper.md)

  ↳ [SortedOraclesWrapper](_wrappers_sortedoracles_.sortedoracleswrapper.md)

  ↳ [StableTokenWrapper](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)

## Index

### Constructors

* [constructor](_wrappers_basewrapper_.basewrapper.md#constructor)

### Accessors

* [address](_wrappers_basewrapper_.basewrapper.md#address)

## Constructors

###  constructor

\+ **new BaseWrapper**(`kit`: [ContractKit](_kit_.contractkit.md), `contract`: T): *[BaseWrapper](_wrappers_basewrapper_.basewrapper.md)*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contract` | T |

**Returns:** *[BaseWrapper](_wrappers_basewrapper_.basewrapper.md)*

## Accessors

###  address

• **get address**(): *string*

*Defined in [packages/contractkit/src/wrappers/BaseWrapper.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wrappers/BaseWrapper.ts#L18)*

Contract address

**Returns:** *string*
