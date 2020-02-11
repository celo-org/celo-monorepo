const DefaultConstitution = {
  accounts: {
    // No onlyOwner functions outside of the proxy, set as a precaution for future
    // implementations.
    default: 0.6,
  },
  attestations: {
    default: 0.6,
    setAttestationRequestFee: 0.6,
    setAttestationExpiryBlocks: 0.6,
    setRegistry: 0.9,
    setSelectIssuersWaitBlocks: 0.6,
  },
  blockChainParameters: {
    default: 0.7,
    setMinimumClientVersion: 0.9,
    setBlockGasLimit: 0.7,
    setIntrinsicGasForAlternativeFeeCurrency: 0.7,
    setRegistry: 0.9,
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
    default: 0.5,
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
    default: 0.5,
    setRegistry: 0.9,
    setUpdateFrequency: 0.7,
    setMinimumReports: 0.7,
    setStableToken: 0.7,
    setSpread: 0.8,
    setReserveFraction: 0.8,
  },
  feeCurrencyWhitelist: {
    default: 0.5,
    addToken: 0.7,
  },
  gasPriceMinimum: {
    default: 0.5,
    setRegistry: 0.9,
    setAdjustmentSpeed: 0.5,
    setTargetDensity: 0.7,
    setGasPriceMinimumFloor: 0.7,
  },
  goldToken: {
    default: 0.5,
  },
  governance: {
    default: 0.5,
    setRegistry: 0.9,
    setApprover: 0.9,
    setConcurrentProposals: 0.8,
    setMinDeposit: 0.8,
    setQueueExpiry: 0.8,
    setDequeueFrequency: 0.8,
    setApprovalStageDuration: 0.8,
    setReferendumStageDuration: 0.8,
    setExecutionStageDuration: 0.8,
    setParticipationBaseline: 0.8,
    setParticipationFloor: 0.8,
    setBaselineUpdateFactor: 0.8,
    setBaselineQuorumFactor: 0.8,
    setConstitution: 0.8,
  },
  governanceSlasher: {
    default: 0.7,
    setSlashingIncentives: 0.7,
    approveSlashing: 0.7,
  },
  lockedGold: {
    default: 0.5,
    setRegistry: 0.9,
    setUnlockingPeriod: 0.7,
    addSlasher: 0.7,
    removeSlasher: 0.8,
  },
  // Values for all proxied contracts.
  proxy: {
    _transferOwnership: 0.8,
    _setAndInitializeImplementation: 0.8,
    _setImplementation: 0.8,
  },
  random: {
    default: 0.5,
    setRandomnessBlockRetentionWindow: 0.7,
  },
  registry: {
    default: 0.5,
    setAddressFor: 0.7,
  },
  reserve: {
    default: 0.5,
    setRegistry: 0.9,
    setTobinTaxStalenessThreshold: 0.8,
    setDailySpendingRatio: 0.8,
    setAssetAllocations: 0.8,
    addToken: 0.8,
    removeToken: 0.8,
    addOtherReserveAddress: 0.8,
    removeOtherReserveAddress: 0.8,
    addSpender: 0.8,
    removeSpender: 0.8,
  },
  sortedOracles: {
    default: 0.5,
    setReportExpiry: 0.7,
    addOracle: 0.8,
    removeOracle: 0.8,
  },
  stableToken: {
    default: 0.5,
    setRegistry: 0.9,
    setInflationParameters: 0.9,
  },
  validators: {
    default: 0.5,
    setRegistry: 0.9,
    setMaxGroupSize: 0.7,
    setMembershipHistoryLength: 0.8,
    setGroupLockedGoldRequirements: 0.8,
    setValidatorLockedGoldRequirements: 0.8,
    setSlashingMultiplierResetPeriod: 0.8,
    setValidatorScoreParameters: 0.8,
  },
}

const constitution = DefaultConstitution

module.exports = {
  constitution,
}
