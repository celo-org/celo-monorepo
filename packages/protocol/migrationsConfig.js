const { toFixed } = require('@celo/utils/lib/fixidity')
const { CeloContractName } = require('@celo/protocol/lib/registry-utils')

const BigNumber = require('bignumber.js')
const minimist = require('minimist')
const path = require('path')
const lodash = require('lodash')
const web3 = require('web3')

const argv = minimist(process.argv.slice(2), {
  default: {
    build_directory: path.join(__dirname, 'build'),
  },
  string: ['migration_override', 'build_directory', 'network'],
})
const network = require('./truffle-config.js').networks[argv.network]

// Almost never use exponential notation in toString
// http://mikemcl.github.io/bignumber.js/#exponential-at
BigNumber.config({ EXPONENTIAL_AT: 1e9 })

const SECOND = 1
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const YEAR = 365 * DAY

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
      major: 0,
      minor: 9,
      patch: 0,
    },
    blockGasLimit: 20000000,
  },
  doubleSigningSlasher: {
    reward: '1000000000000000000000', // 1000 cGLD
    penalty: '9000000000000000000000', // 9000 cGLD
  },
  downtimeSlasher: {
    reward: '10000000000000000000', // 10 cGLD
    penalty: '100000000000000000000', // 100 cGLD
    slashableDowntime: (12 * HOUR) / 5, // ~12 hours
  },
  election: {
    minElectableValidators: '22',
    maxElectableValidators: '100',
    maxVotesPerAccount: 100,
    electabilityThreshold: 1 / 1000,
    frozen: true,
  },
  epochRewards: {
    targetVotingYieldParameters: {
      initial: 0.00016, // (x + 1) ^ 365 = 1.06
      max: 0.0005, // (x + 1) ^ 365 = 1.20
      adjustmentFactor: 0, // Change to 1 / 3650 once mainnet activated
    },
    rewardsMultiplierParameters: {
      max: 2,
      adjustmentFactors: {
        underspend: 1 / 2,
        overspend: 5,
      },
    },
    // Intentionally set lower than the expected value at steady state to account for the fact that
    // users may take some time to start voting with their cGLD.
    targetVotingGoldFraction: 1 / 2,
    maxValidatorEpochPayment: '205479452054794520547', // (75,000 / 365) * 10 ^ 18
    communityRewardFraction: 1 / 4,
    // TODO(asa): Must be set before RC1
    carbonOffsettingPartner: '0x0000000000000000000000000000000000000000',
    carbonOffsettingFraction: 1 / 1000,
    frozen: true,
  },
  exchange: {
    spread: 5 / 1000,
    reserveFraction: 1 / 20,
    updateFrequency: 5 * MINUTE,
    minimumReports: 5,
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
    dequeueFrequency: DAY, // Change to 1 week once mainnet activated
    concurrentProposals: 3,
    approvalStageDuration: DAY, // Change to 3 days once mainnet activated
    referendumStageDuration: 2 * DAY, // Change to 1 week once mainnet activated
    executionStageDuration: 3 * DAY,
    minDeposit: 100, // 100 cGLD
    participationBaseline: 5 / 100, // Start with low participation requirements, let the protocol adjust
    participationBaselineFloor: 5 / 100,
    participationBaselineUpdateFactor: 1 / 5,
    participationBaselineQuorumFactor: 1,
  },
  governanceApproverMultiSig: {
    // 2/4 multsig
    signatories: [
      '0x32830A3f65DF98aFCFA18bAd35009Aa51163D606',
      '0x7c593219ad21e172c1fdc6bfdc359699fa428adb',
      '0x31af68f73fb93815b3eB9a6FA76e63113De5f733',
      '0x47fE4b9fFDB9712fC5793B1b5E86d96a4664cf02',
    ],
    numRequiredConfirmations: 2,
    numInternalRequiredConfirmations: 2,
    useMultiSig: true,
  },
  lockedGold: {
    unlockingPeriod: 3 * DAY,
  },
  oracles: {
    reportExpiry: 5 * MINUTE,
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
    spenders: [],
    otherAddresses: ['0xd0a57D8acFe9979d33933d8A52971E6DC9E2DbF0'],
    assetAllocationSymbols: ['cGLD', 'BTC', 'ETH', 'DAI'],
    assetAllocationWeights: [0.5, 0.2, 0.1, 0.2],
  },
  reserveSpenderMultiSig: {
    // 2/2 multsig
    signatories: [
      '0x49eFFA2ceF5FccA5540f421d6b28e76184cc0fDF',
      '0x4550F1576fAC966Ac8b9F42e1D5D66D3A14dD8D3',
    ],
    numRequiredConfirmations: 2,
    numInternalRequiredConfirmations: 2,
  },
  stableToken: {
    decimals: 18,
    goldPrice: 1,
    tokenName: 'Celo Dollar',
    tokenSymbol: 'cUSD',
    inflationRate: 1,
    inflationPeriod: 1.5 * YEAR,
    initialBalances: {
      addresses: [],
      values: [],
    },
    oracles: [],
    frozen: true,
  },
  transferWhitelist: {
    addresses: [
      '0x49eFFA2ceF5FccA5540f421d6b28e76184cc0fDF',
      '0x4550F1576fAC966Ac8b9F42e1D5D66D3A14dD8D3',
      '0xd0a57D8acFe9979d33933d8A52971E6DC9E2DbF0',
      '0x36940810BfDB329B31e38d3e97aFD673081B497C',
      '0xfCf982bb4015852e706100B14E21f947a5Bb718E',
      '0xe90bB6dE0996D41cb0A843A06839EEf38c6E5456',
      '0xbA8761304CEc7bE0f83C6F8Fa7EBBa3eE0b6Ae97',
      '0xb566bB6D1850A345FA39EF38fefaC4E892348d51',
      '0xDb39DBE5abE42466F122b24c44518b1089ef8fC8',
      '0x671D520ae3E89Ea5383A5d7162bCed79FD25CdEe',
      '0x469be98FE71AFf8F6e7f64F9b732e28A03596B5C',
      '0x8f55CE88b4F62F22c663f5A539414dcCeF969c32',
      '0xF607d4dd519B4bc963C9c48E8650E67C51DbC35b',
      '0x515033209a0A29034DC3F037cC72a6014b902341',
      '0x6E36F0D3cF12aa592FF88D03938584562c9239cA',
    ],
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
      // MUST BE KEPT IN SYNC WITH MEMBERSHIP HISTORY LENGTH
      duration: 60 * DAY,
    },
    validatorScoreParameters: {
      exponent: 10,
      adjustmentSpeed: 0.1,
    },
    // MUST BE KEPT IN SYNC WITH VALIDATOR LOCKED GOLD DURATION
    membershipHistoryLength: 60,
    commissionUpdateDelay: (3 * DAY) / 5, // Approximately 3 days with 5s block times
    maxGroupSize: 5,
    slashingPenaltyResetPeriod: 30 * DAY,

    // Register a number of cLabs groups to contain an initial set of validators to run test
    // networks.
    validatorKeys: [],
    attestationKeys: [],
    groupName: 'C-Labs',
    commission: 0.1,
    votesRatioOfLastVsFirstGroup: 2.0,
  },
}

const NetworkConfigs = {
  trevor3: {
    downtimeSlasher: {
      slashableDowntime: 60, // epoch length is 100 for unit tests
    },
    election: {
      minElectableValidators: '10',
      frozen: false,
    },
    epochRewards: {
      frozen: false,
    },
    exchange: {
      frozen: false,
      minimumReports: 1,
    },
    goldToken: {
      frozen: false,
    },
    governanceApproverMultiSig: {
      signatories: [network.from],
      numRequiredConfirmations: 1,
      numInternalRequiredConfirmations: 1,
    },
    reserve: {
      initialBalance: 100000000,
      otherAddresses: ['0x7457d5E02197480Db681D3fdF256c7acA21bDc12'], // Add an arbitrary "otherReserveAddress" so that reserve spending can be tested.
    },
    reserveSpenderMultiSig: {
      signatories: [network.from],
      numRequiredConfirmations: 1,
      numInternalRequiredConfirmations: 1,
    },
    stableToken: {
      oracles: [
        '0xf4314cb9046bece6aa54bb9533155434d0c76909',
        '0x485d120a0e8c4aba1c1190b0e3b86632d391e9b6',
      ],
      frozen: false,
    },
  },
  development: {
    downtimeSlasher: {
      slashableDowntime: 60, // epoch length is 100 for unit tests
    },
    election: {
      minElectableValidators: '10',
      frozen: false,
    },
    epochRewards: {
      frozen: false,
    },
    exchange: {
      frozen: false,
      minimumReports: 1,
    },
    goldToken: {
      frozen: false,
    },
    governanceApproverMultiSig: {
      signatories: [network.from],
      numRequiredConfirmations: 1,
      numInternalRequiredConfirmations: 1,
    },
    reserve: {
      initialBalance: 100000000,
      otherAddresses: ['0x7457d5E02197480Db681D3fdF256c7acA21bDc12'], // Add an arbitrary "otherReserveAddress" so that reserve spending can be tested.
    },
    reserveSpenderMultiSig: {
      signatories: [network.from],
      numRequiredConfirmations: 1,
      numInternalRequiredConfirmations: 1,
    },
    stableToken: {
      oracles: [network.from],
      frozen: false,
    },
  },
  testing: {
    downtimeSlasher: {
      slashableDowntime: 6,
    },
    election: {
      minElectableValidators: '1',
      frozen: false,
    },
    epochRewards: {
      frozen: false,
      targetVotingYieldParameters: {
        initial: 0.00016,
        max: 0.0005,
        adjustmentFactor: 0.1,
      },
    },
    exchange: {
      frozen: false,
    },
    goldToken: {
      frozen: false,
    },
    governance: {
      skipSetConstitution: true,
      skipTransferOwnership: true,
    },
    stableToken: {
      frozen: false,
    },
    reserve: {
      initialBalance: 100000000,
    },
  },
  baklava: {
    blockchainParameters: {
      minimumClientVersion: {
        major: 0,
        minor: 10,
        patch: 0,
      },
    },
    election: {
      minElectableValidators: '25', // About half of the expected genesis set.
    },
    governance: {
      // Set to be able to complete a proposal in about a day, but give everyone a chance to participate.
      dequeueFrequency: 4 * HOUR,
      approvalStageDuration: 4 * HOUR,
      referendumStageDuration: DAY,
      executionStageDuration: WEEK,
    },
    lockedGold: {
      unlockingPeriod: 6 * HOUR, // 1/12 of the mainnet period.
    },
    stableToken: {
      oracles: [
        '0x0d473f73AAf1C2bf7EBd2be7196C71dBa6C1724b',
        '0x8F7ca85A9E4A18B551b765706bd0B6f26927D86F',
        '0x3EaEe6C693420Ae86643EB2837978da8eEbf973f',
        '0xDd3E5FcE22938c0f482004527D468a8799C4a61E',
        '0xFb2Ee4Da251fC6A9DF7eb8d5c4ea1DeC99d127eA',
        '0xd321C7356DFB5b6F4AD9e5B58C51B46409fe1442',
        '0xbbbC38f6a383293522d4aEDaA98b7d2D73E90A73',
        '0xB9E0b0B8fdA1001392c8fFd19f6B7ad5286589F2',
        '0x44740e3eedfD3a2A2e7662de9165a6E20bBcC72C',
        '0x7a2cb0438e7B9801C29B39Ff94439aFf930CDf9F',
      ],
    },
    validators: {
      groupLockedGoldRequirements: {
        duration: 15 * DAY, // 1/12 of the mainnet duration.
      },
      validatorLockedGoldRequirements: {
        duration: 5 * DAY, // 1/12 of the mainnet duration.
      },
      membershipHistoryLength: 15, // Number of epochs in the group lockup period.
    },
  },
}

NetworkConfigs.baklavastaging = NetworkConfigs.baklava

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

const config = lodash.cloneDeep(DefaultConfig)

const migrationOverride = argv.migration_override ? JSON.parse(argv.migration_override) : {}

// Use lodash merge to deeply override defaults.
if (argv.network && NetworkConfigs[argv.network]) {
  lodash.merge(config, NetworkConfigs[argv.network])
}
lodash.merge(config, migrationOverride)

module.exports = {
  build_directory: argv.build_directory,
  config,
  linkedLibraries,
}
