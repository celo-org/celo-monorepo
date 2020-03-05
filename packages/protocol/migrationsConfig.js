const { toFixed } = require('@celo/utils/lib/fixidity')
const { CeloContractName } = require('@celo/protocol/lib/registry-utils')

const BigNumber = require('bignumber.js')
const minimist = require('minimist')
const path = require('path')
const lodash = require('lodash')
const web3 = require('web3')

// Almost never use exponential notation in toString
// http://mikemcl.github.io/bignumber.js/#exponential-at
BigNumber.config({ EXPONENTIAL_AT: 1e9 })

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

const DefaultConfig = {
  attestations: {
    attestationExpiryBlocks: HOUR / 5, // ~1 hour,
    attestationRequestFeeInDollars: 0.05,
    selectIssuersWaitBlocks: 4,
    maxAttestations: 100,
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
    reward: '1000000000000000000000', // 1000 cGLD
    penalty: '5000000000000000000000', // 5000 cGLD
  },
  downtimeSlasher: {
    reward: '10000000000000000000', // 10 cGLD
    penalty: '100000000000000000000', // 100 cGLD
    slashableDowntime: (12 * HOUR) / 5, // ~12 hours
  },
  election: {
    minElectableValidators: '50',
    maxElectableValidators: '100',
    maxVotesPerAccount: 100,
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
    frozen: true,
  },
  exchange: {
    spread: 5 / 1000,
    reserveFraction: 1 / 100,
    updateFrequency: 5 * MINUTE, // 5 minutes
    // TODO(asa): This is too low
    minimumReports: 1,
    frozen: true,
  },
  gasPriceMinimum: {
    minimumFloor: 1000000000,
    targetDensity: 1 / 2,
    adjustmentSpeed: 1 / 2,
  },
  goldToken: {
    frozen: true,
  },
  governance: {
    queueExpiry: 4 * WEEK,
    dequeueFrequency: WEEK,
    concurrentProposals: 10,
    approvalStageDuration: 3 * DAY,
    referendumStageDuration: WEEK,
    executionStageDuration: WEEK,
    minDeposit: 100, // 100 cGLD
    participationBaseline: 8 / 10,
    participationBaselineFloor: 5 / 100,
    participationBaselineUpdateFactor: 1 / 5,
    participationBaselineQuorumFactor: 1,
  },
  governanceApproverMultiSig: {
    //Placeholder until addresses for 2/5 multsig are generated.
    signatories: [`0x5409ed021d9299bf6814279a6a1411a7e866a631`],
    numRequiredConfirmations: 1,
    numInternalRequiredConfirmations: 1,
    useMultiSig: true,
  },
  lockedGold: {
    unlockingPeriod: 3 * DAY,
  },
  oracles: {
    reportExpiry: 10 * MINUTE,
  },
  random: {
    randomnessBlockRetentionWindow: HOUR / 5, // 1 hour to match attestationExpiryBlocks
  },
  registry: {
    predeployedProxyAddress: '0x000000000000000000000000000000000000ce10',
  },
  reserve: {
    tobinTaxStalenessThreshold: HOUR, // 1 hour
    dailySpendingRatio: toFixed(0.05).toFixed(), // 5%
    // TODO(Roman): Set these appropriately.
    frozenGold: 0,
    frozenDays: 0,
    spenders: [],
    otherAddresses: [],
    assetAllocationSymbols: ['cGLD', 'BTC', 'ETH'], // TODO(roman)
    assetAllocationWeights: [0.5, 0.25, 0.25], // TODO(roman)
  },
  reserveSpenderMultiSig: {
    //Placeholder until addresses for 2/2 multsig are generated.
    signatories: [`0x5409ed021d9299bf6814279a6a1411a7e866a631`],
    numRequiredConfirmations: 1,
    numInternalRequiredConfirmations: 1,
  },
  stableToken: {
    decimals: 18,
    goldPrice: 10,
    tokenName: 'Celo Dollar',
    tokenSymbol: 'cUSD',
    inflationRate: 1,
    inflationPeriod: 1.5 * 365 * DAY, // 1.5 years
    initialBalances: {
      addresses: [],
      values: [],
    },
    oracles: [],
    frozen: true,
  },
  transferWhitelist: {
    addresses: [], // TODO(Alec): get whitelist of addresses.
    registryIds: [
      web3.utils.soliditySha3(CeloContractName.Governance),
      web3.utils.soliditySha3(CeloContractName.LockedGold),
      web3.utils.soliditySha3(CeloContractName.Reserve),
    ],
  },
  validators: {
    groupLockedGoldRequirements: {
      value: '10000000000000000000000', // 10k gold per validator
      duration: 180 * DAY,
    },
    validatorLockedGoldRequirements: {
      value: '10000000000000000000000', // 10k gold
      duration: 60 * DAY,
    },
    validatorScoreParameters: {
      exponent: 10,
      adjustmentSpeed: 0.1,
    },
    membershipHistoryLength: 60,
    commissionUpdateDelay: 51840, // Approximately 3 days
    maxGroupSize: 5,
    slashingPenaltyResetPeriod: 30 * DAY,

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
