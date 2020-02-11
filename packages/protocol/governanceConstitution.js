const DefaultConstitution = {
  accounts: {
    default: 0.6,
  },
  attestations: {
    default: 0.6,
    setRegistry: 0.9,
    setAttestationRequestFee: 0.6,
    setAttestationExpiryBlocks: 0.6,
    setSelectIssuersWaitBlocks: 0.6,
  },
  blockChainParameters: {
    default: 0.9,
    setRegistry: 0.9,
    setMinimumClientVersion: 0.9,
    setBlockGasLimit: 0.8,
    setIntrinsicGasForAlternativeFeeCurrency: 0.8,
  },
  doubleSigningSlasher: {
    default: 0.7,
    setSlashingIncentives: 0.7,
  },
  downtimeSlasher: {
    default: 0.7,
    setSlashingIncentives: 0.7,
    setSlashableDowntime: 0.7,
  },
  election: {
    default: 0.8,
    setRegistry: 0.9,
    setElectableValidators: 0.8,
    setMaxNumGroupsVotedFor: 0.8,
    setElectabilityThreshold: 0.8,
  },
  epochRewards: {
    default: 0.8,
    setRegistry: 0.9,
    setCommunityRewardFraction: 0.8,
    setTargetVotingGoldFraction: 0.8,
    setTargetValidatorEpochPayment: 0.8,
    setRewardsMultiplierParameters: 0.8,
    setTargetVotingYieldParameters: 0.8,
  },
  escrow: {
    default: 0.5,
    setRegistry: 0.9,
  },
  exchange: {
    default: 0.8,
    setRegistry: 0.9,
    setUpdateFrequency: 0.8,
    setMinimumReports: 0.8,
    setStableToken: 0.8,
    setSpread: 0.8,
    setReserveFraction: 0.8,
  },
  feeCurrencyWhitelist: {
    default: 0.8,
    addToken: 0.8,
  },
  gasPriceMinimum: {
    default: 0.7,
    setRegistry: 0.9,
    setAdjustmentSpeed: 0.7,
    setTargetDensity: 0.7,
    setGasPriceMinimumFloor: 0.7,
  },
  goldToken: {
    default: 0.9,
  },
  governance: {
    default: 0.9,
    setRegistry: 0.9,
    setApprover: 0.9,
    setConcurrentProposals: 0.9,
    setMinDeposit: 0.9,
    setQueueExpiry: 0.9,
    setDequeueFrequency: 0.9,
    setApprovalStageDuration: 0.9,
    setReferendumStageDuration: 0.9,
    setExecutionStageDuration: 0.9,
    setParticipationBaseline: 0.9,
    setParticipationFloor: 0.9,
    setBaselineUpdateFactor: 0.9,
    setBaselineQuorumFactor: 0.9,
    setConstitution: 0.9,
  },
  governanceSlasher: {
    default: 0.7,
    setSlashingIncentives: 0.7,
    approveSlashing: 0.7,
  },
  lockedGold: {
    default: 0.9,
    setRegistry: 0.9,
    setUnlockingPeriod: 0.8,
    addSlasher: 0.9,
    removeSlasher: 0.8,
  },
  // Values for all proxied contracts.
  proxy: {
    _transferOwnership: 0.9,
    _setAndInitializeImplementation: 0.9,
    _setImplementation: 0.9,
  },
  random: {
    default: 0.7,
    setRandomnessBlockRetentionWindow: 0.7,
  },
  registry: {
    default: 0.9,
    setAddressFor: 0.9,
  },
  reserve: {
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
  },
  sortedOracles: {
    default: 0.7,
    setReportExpiry: 0.7,
    addOracle: 0.8,
    removeOracle: 0.7,
  },
  stableToken: {
    default: 0.8,
    setRegistry: 0.9,
    setInflationParameters: 0.9,
  },
  validators: {
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

const constitution = DefaultConstitution

module.exports = {
  constitution,
}
