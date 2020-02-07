const BigNumber = require('bignumber.js')
const minimist = require('minimist')
const path = require('path')
const lodash = require('lodash')

// Almost never use exponential notation in toString
// http://mikemcl.github.io/bignumber.js/#exponential-at
BigNumber.config({ EXPONENTIAL_AT: 1e9 })

const DefaultConfig = {
  attestations: {
    attestationExpiryBlocks: (60 * 60) / 5, // 1 hour,
    attestationRequestFeeInDollars: 0.05,
    selectIssuersWaitBlocks: 4,
  },
  blockchainParameters: {
    gasForNonGoldCurrencies: 50000,
    minimumClientVersion: {
      major: 1,
      minor: 8,
      patch: 23,
    },
    blockGasLimit: 20000000,
  },
  doubleSigningSlasher: {
    reward: '20000000000000000000', // 20 cGLD
    penalty: '100000000000000000000', // 100 cGLD
  },
  downtimeSlasher: {
    reward: '10000000000000000000', // 10 cGLD
    penalty: '20000000000000000000', // 20 cGLD
    slashableDowntime: 480,
  },
  election: {
    minElectableValidators: '22',
    maxElectableValidators: '100',
    maxVotesPerAccount: 3,
    electabilityThreshold: 1 / 1000,
  },
  epochRewards: {
    targetVotingYieldParameters: {
      initial: 0.00016, // (x + 1) ^ 365 = 1.06
      max: 0.0005, // (x + 1) ^ 365 = 1.20
      adjustmentFactor: 1 / 365,
    },
    rewardsMultiplierParameters: {
      max: 2,
      adjustmentFactors: {
        underspend: 1 / 2,
        overspend: 5,
      },
    },
    targetVotingGoldFraction: 2 / 3,
    maxValidatorEpochPayment: '205479452054794520547', // (75,000 / 365) * 10 ^ 18
    communityRewardFraction: 1 / 4,
    frozen: false,
  },
  exchange: {
    spread: 5 / 1000,
    reserveFraction: 1 / 100,
    updateFrequency: 5 * 60, // 5 minutes
    minimumReports: 1,
    frozen: false,
  },
  gasPriceMinimum: {
    minimumFloor: 1000000000,
    targetDensity: 1 / 2,
    adjustmentSpeed: 1 / 2,
  },
  governance: {
    approvalStageDuration: 15 * 60, // 15 minutes
    concurrentProposals: 10,
    dequeueFrequency: 15 * 60, // 15 minutes
    executionStageDuration: 2 * 24 * 60 * 60, // 2 days
    minDeposit: 1, // 1 cGLD
    queueExpiry: 7 * 24 * 60 * 60, // 1 week
    referendumStageDuration: 15 * 60, // 15 minutes
    participationBaseline: 8 / 10,
    participationBaselineFloor: 5 / 100,
    participationBaselineUpdateFactor: 1 / 5,
    participationBaselineQuorumFactor: 1,
  },
  lockedGold: {
    unlockingPeriod: (60 * 60 * 24 * 3) / 24, // 3 days divided by 24 to accelerate for Stake off
  },
  oracles: {
    reportExpiry: 10 * 60, // 10 minutes
  },
  random: {
    randomnessBlockRetentionWindow: (60 * 60) / 5, // 1 hour to match attestationExpiryBlocks
  },
  registry: {
    predeployedProxyAddress: '0x000000000000000000000000000000000000ce10',
  },
  reserve: {
    goldBalance: 100000000,
    tobinTaxStalenessThreshold: 60 * 60, // 1 hour
    dailySpendingRatio: '1000000000000000000000000', // 100%
  },
  stableToken: {
    decimals: 18,
    goldPrice: 10,
    tokenName: 'Celo Dollar',
    tokenSymbol: 'cUSD',
    inflationRate: 1,
    inflationPeriod: 1.5 * 365 * 24 * 60 * 60, // 1.5 years
    initialBalances: {
      addresses: [],
      values: [],
    },
    oracles: [],
    unfreezeImmediately: true,
  },
  validators: {
    groupLockedGoldRequirements: {
      value: '10000000000000000000000', // 10k gold per validator
      duration: (60 * 24 * 60 * 60) / 24, // 60 days divided by 24 to accelerate for Stake off
    },
    validatorLockedGoldRequirements: {
      value: '10000000000000000000000', // 10k gold
      duration: (60 * 24 * 60 * 60) / 24, // 60 days divided by 24 to accelerate for Stake off
    },
    validatorScoreParameters: {
      exponent: 10,
      adjustmentSpeed: 0.1,
    },
    membershipHistoryLength: 60,
    maxGroupSize: '5',
    // 30 Days divided by 24 to accelerate for Stake off
    slashingPenaltyResetPeriod: (60 * 60 * 24 * 30) / 24,

    // We register a number of C-Labs groups to contain an initial set of validators to run the network.
    validatorKeys: [],
    attestationKeys: [],
    groupName: 'C-Labs',
    commission: 0.1,
    votesRatioOfLastVsFirstGroup: 2.0,
  },
}

const linkedLibraries = {
  FixidityLib: [
    'LockedGold',
    'Exchange',
    'GasPriceMinimum',
    'Governance',
    'GovernanceTest',
    'Proposals',
    'SortedOracles',
    'StableToken',
    'Validators',
  ],
  Proposals: ['Governance', 'GovernanceTest', 'ProposalsTest'],
  LinkedList: ['AddressLinkedList', 'SortedLinkedList', 'LinkedListTest'],
  SortedLinkedList: [
    'AddressSortedLinkedList',
    'IntegerSortedLinkedList',
    'SortedLinkedListWithMedian',
  ],
  SortedLinkedListWithMedian: ['AddressSortedLinkedListWithMedian'],
  AddressLinkedList: ['Validators', 'ValidatorsTest'],
  AddressSortedLinkedList: ['Election', 'ElectionTest'],
  IntegerSortedLinkedList: ['Governance', 'GovernanceTest', 'IntegerSortedLinkedListTest'],
  AddressSortedLinkedListWithMedian: ['SortedOracles', 'AddressSortedLinkedListWithMedianTest'],
  Signatures: ['Accounts', 'TestAttestations', 'Attestations', 'LockedGold', 'Escrow'],
}

const argv = minimist(process.argv.slice(2), {
  default: {
    build_directory: path.join(__dirname, 'build'),
  },
  string: ['migration_override', 'build_directory'],
})

const config = DefaultConfig

const migrationOverride = argv.migration_override ? JSON.parse(argv.migration_override) : {}
// use lodash merge to deeply override defaults
lodash.merge(config, migrationOverride)

module.exports = {
  build_directory: argv.build_directory,
  config,
  linkedLibraries,
}
