contractPackages = require('./contractPackages.js')

const MENTO_PACKAGE = contractPackages.MENTO_PACKAGE
// __contractPackage field is used to specify which contract package this contract belongs to
// leaving it undefined assumes it's a monorepo contract

const DefaultConstitution = {
  Accounts: {
    default: 0.6,
  },
  Attestations: {
    default: 0.6,
    setRegistry: 0.9,
    setAttestationRequestFee: 0.6,
    setAttestationExpiryBlocks: 0.6,
    setSelectIssuersWaitBlocks: 0.6,
  },
  BlockchainParameters: {
    default: 0.9,
    setBlockGasLimit: 0.8,
    setIntrinsicGasForAlternativeFeeCurrency: 0.8,
  },
  DoubleSigningSlasher: {
    default: 0.7,
    setSlashingIncentives: 0.7,
  },
  DowntimeSlasher: {
    default: 0.7,
    setSlashingIncentives: 0.7,
    setSlashableDowntime: 0.7,
  },
  Election: {
    default: 0.8,
    setRegistry: 0.9,
    setElectableValidators: 0.8,
    setMaxNumGroupsVotedFor: 0.8,
    setElectabilityThreshold: 0.8,
  },
  EpochRewards: {
    default: 0.8,
    setRegistry: 0.9,
    setCommunityRewardFraction: 0.8,
    setTargetVotingGoldFraction: 0.8,
    setTargetValidatorEpochPayment: 0.8,
    setRewardsMultiplierParameters: 0.8,
    setTargetVotingYieldParameters: 0.8,
  },
  Escrow: {
    default: 0.6,
    addDefaultTrustedIssuer: 0.6,
    removeDefaultTrustedIssuer: 0.6,
  },
  FederatedAttestations: {
    default: 0.6,
  },
  FeeCurrencyWhitelist: {
    default: 0.8,
    addToken: 0.8,
  },
  Freezer: {
    default: 0.6,
    freeze: 0.6,
    unfreeze: 0.6,
  },
  GasPriceMinimum: {
    default: 0.7,
    setRegistry: 0.9,
    setAdjustmentSpeed: 0.7,
    setTargetDensity: 0.7,
    setGasPriceMinimumFloor: 0.7,
    __contractPackage: contractPackages.SOLIDITY_08_PACKAGE,
  },
  GoldToken: {
    default: 0.9,
    transfer: 0.6,
    transferWithComment: 0.6,
    approve: 0.6,
  },
  Governance: {
    default: 0.9,
    setRegistry: 0.9,
    setApprover: 0.9,
    setConcurrentProposals: 0.9,
    setMinDeposit: 0.9,
    setQueueExpiry: 0.9,
    setDequeueFrequency: 0.9,
    setReferendumStageDuration: 0.9,
    setExecutionStageDuration: 0.9,
    setParticipationBaseline: 0.9,
    setParticipationFloor: 0.9,
    setBaselineUpdateFactor: 0.9,
    setBaselineQuorumFactor: 0.9,
    setConstitution: 0.9,
  },
  GovernanceSlasher: {
    default: 0.7,
    approveSlashing: 0.7,
  },
  LockedGold: {
    default: 0.9,
    setRegistry: 0.9,
    setUnlockingPeriod: 0.8,
    addSlasher: 0.9,
    removeSlasher: 0.8,
  },
  OdisPayments: {
    default: 0.6,
  },
  // Values for all proxied contracts.
  proxy: {
    _transferOwnership: 0.9,
    _setAndInitializeImplementation: 0.9,
    _setImplementation: 0.9,
  },
  Random: {
    default: 0.7,
    setRandomnessBlockRetentionWindow: 0.7,
  },
  Registry: {
    default: 0.9,
    setAddressFor: 0.9,
  },
  SortedOracles: {
    default: 0.7,
    setReportExpiry: 0.7,
    addOracle: 0.8,
    removeOracle: 0.7,
  },
  Validators: {
    default: 0.7,
    setRegistry: 0.9,
    setMaxGroupSize: 0.7,
    setMembershipHistoryLength: 0.7,
    setGroupLockedGoldRequirements: 0.8,
    setValidatorLockedGoldRequirements: 0.8,
    setSlashingMultiplierResetPeriod: 0.7,
    setValidatorScoreParameters: 0.7,
  },
}

const constitutionExternal = {
  Reserve: {
    default: 0.9,
    setRegistry: 0.9,
    setTobinTaxStalenessThreshold: 0.7,
    setDailySpendingRatio: 0.9,
    setAssetAllocations: 0.7,
    addToken: 0.9,
    removeToken: 0.9,
    addOtherReserveAddress: 0.9,
    removeOtherReserveAddress: 0.9,
    addSpender: 0.9,
    removeSpender: 0.8,
    addExchangeSpender: 0.9,
    removeExchangeSpender: 0.9,
    __contractPackage: MENTO_PACKAGE,
  },
  StableToken: {
    default: 0.8,
    setRegistry: 0.9,
    setInflationParameters: 0.9,
    transfer: 0.6,
    transferWithComment: 0.6,
    approve: 0.6,
    __contractPackage: MENTO_PACKAGE,
  },
  StableTokenEUR: {
    default: 0.8,
    setRegistry: 0.9,
    setInflationParameters: 0.9,
    transfer: 0.6,
    transferWithComment: 0.6,
    approve: 0.6,
    __contractPackage: MENTO_PACKAGE,
  },
  StableTokenBRL: {
    default: 0.8,
    setRegistry: 0.9,
    setInflationParameters: 0.9,
    transfer: 0.6,
    transferWithComment: 0.6,
    approve: 0.6,
    __contractPackage: MENTO_PACKAGE,
  },
  GrandaMento: {
    default: 0.8,
    cancelExchangeProposal: 0.6,
    setApprover: 0.8,
    setSpread: 0.8,
    setStableTokenExchangeLimits: 0.8,
    setVetoPeriodSeconds: 0.8,
    __contractPackage: MENTO_PACKAGE,
  },
  Exchange: {
    default: 0.8,
    setRegistry: 0.9,
    setUpdateFrequency: 0.8,
    setMinimumReports: 0.8,
    setStableToken: 0.8,
    setSpread: 0.8,
    setReserveFraction: 0.8,
    __contractPackage: MENTO_PACKAGE,
  },
  ExchangeEUR: {
    default: 0.8,
    setRegistry: 0.9,
    setUpdateFrequency: 0.8,
    setMinimumReports: 0.8,
    setStableToken: 0.8,
    setSpread: 0.8,
    setReserveFraction: 0.8,
    __contractPackage: MENTO_PACKAGE,
  },
  ExchangeBRL: {
    default: 0.8,
    setRegistry: 0.9,
    setUpdateFrequency: 0.8,
    setMinimumReports: 0.8,
    setStableToken: 0.8,
    setSpread: 0.8,
    setReserveFraction: 0.8,
    __contractPackage: MENTO_PACKAGE,
  },
}

const constitution = { ...DefaultConstitution, ...constitutionExternal }

module.exports = {
  constitution,
}
