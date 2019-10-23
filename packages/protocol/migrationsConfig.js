const BigNumber = require('bignumber.js')
const minimist = require('minimist')
const path = require('path')

// Almost never use exponential notation in toString
// http://mikemcl.github.io/bignumber.js/#exponential-at
BigNumber.config({ EXPONENTIAL_AT: 1e9 })

const DefaultConfig = {
  attestations: {
    attestationExpirySeconds: 60 * 60, // 1 hour,
    attestationRequestFeeInDollars: 0.05,
  },
  lockedGold: {
    unlockingPeriod: 60 * 60 * 24 * 3, // 3 days
  },
  oracles: {
    reportExpiry: 60 * 60, // 1 hour
  },
  election: {
    minElectableValidators: '22',
    maxElectableValidators: '100',
    maxVotesPerAccount: 3,
    electabilityThreshold: '0', // no threshold
  },
  exchange: {
    spread: 5 / 1000,
    reserveFraction: 1,
    updateFrequency: 3600,
    minimumReports: 1,
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
  gasPriceMinimum: {
    initialMinimum: 10000,
    targetDensity: 1 / 2,
    adjustmentSpeed: 1 / 2,
    proposerFraction: 1 / 2,
  },
  registry: {
    predeployedProxyAddress: '0x000000000000000000000000000000000000ce10',
  },
  reserve: {
    goldBalance: 100000,
    tobinTaxStalenessThreshold: 3600, // 1 hour
  },
  stableToken: {
    decimals: 18,
    goldPrice: 10,
    minerDollarBalance: 60000,
    tokenName: 'Celo Dollar',
    tokenSymbol: 'cUSD',
    // 52nd root of 1.005, equivalent to 0.5% annual inflation
    inflationRate: 1.00009591886,
    inflationPeriod: 7 * 24 * 60 * 60, // 1 week
    initialAccounts: [],
    priceOracleAccounts: [],
  },
  validators: {
    registrationRequirements: {
      group: '1000000000000000000', // 1 gold
      validator: '1000000000000000000', // 1 gold
    },
    deregistrationLockups: {
      group: 60 * 24 * 60 * 60, // 60 days
      validator: 60 * 24 * 60 * 60, // 60 days
    },
    maxGroupSize: '70',

    validatorKeys: [],
    // We register a single validator group during the migration.
    groupName: 'C-Labs',
    groupUrl: 'celo.org',
    commission: 0.1,
  },
  blockchainParameters: {
    minimumClientVersion: {
      major: 1,
      minor: 8,
      patch: 23,
    },
  },
}

const linkedLibraries = {
  FixidityLib: [
    'LockedGold',
    'Exchange',
    'GasPriceMinimum',
    'Governance',
    'Proposals',
    'SortedOracles',
    'StableToken',
    'Validators',
  ],
  Proposals: ['Governance', 'ProposalsTest'],
  LinkedList: ['AddressLinkedList', 'SortedLinkedList', 'LinkedListTest'],
  SortedLinkedList: [
    'AddressSortedLinkedList',
    'IntegerSortedLinkedList',
    'SortedLinkedListWithMedian',
  ],
  SortedLinkedListWithMedian: ['AddressSortedLinkedListWithMedian'],
  AddressLinkedList: ['Validators'],
  AddressSortedLinkedList: ['Election'],
  IntegerSortedLinkedList: ['Governance', 'IntegerSortedLinkedListTest'],
  AddressSortedLinkedListWithMedian: ['SortedOracles', 'AddressSortedLinkedListWithMedianTest'],
  Signatures: ['TestAttestations', 'Attestations', 'LockedGold', 'Escrow'],
}

const argv = minimist(process.argv.slice(2), {
  string: ['migration_override', 'build_directory'],
  default: {
    build_directory: path.join(__dirname, 'build'),
  },
})

const migrationOverride = argv.migration_override ? JSON.parse(argv.migration_override) : {}
const config = {}

for (const key of Object.keys(DefaultConfig)) {
  config[key] = { ...DefaultConfig[key], ...migrationOverride[key] }
}

module.exports = {
  build_directory: argv.build_directory,
  config,
  linkedLibraries,
}
