const argv = require('minimist')(process.argv.slice(2), { string: ['migration_override'] })
const BigNumber = require('bignumber.js')

// Almost never use exponential notation in toString
// http://mikemcl.github.io/bignumber.js/#exponential-at
BigNumber.config({ EXPONENTIAL_AT: 1e9 })

const defaultConfig = {
  attestations: {
    attestationExpirySeconds: 60 * 60, // 1 hour,
    attestationRequestFeeInDollars: 0.05,
  },
  bondedDeposits: {
    maxNoticePeriod: 60 * 60 * 24 * 365 * 3, // 3 years
  },
  oracles: {
    reportExpiry: 60 * 60, // 1 hour
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
    tallyStageDuration: 15 * 60, // 15 minutes
  },
  gasPriceMinimum: {
    initialMinimum: 10000,
    targetDensity: 1 / 2,
    adjustmentSpeed: 1 / 2,
    infrastructureFraction: 1 / 2,
  },
  quorum: {
    participationBaseline: 8 / 10,
    participationFloor: 5 / 100,
    updateCoefficient: 1 / 5,
    criticalBaselineLevel: 1,
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
    inflationRateNumerator: BigNumber(100009591886),
    inflationRateDenominator: BigNumber(100000000000),
    inflationPeriod: 7 * 24 * 60 * 60, // 1 week
  },
  validators: {
    minElectableValidators: '10',
    maxElectableValidators: '100',
    minBondedDepositValue: '1000000000000000000', // 1 gold
    minBondedDepositNoticePeriod: 60 * 24 * 60 * 60, // 60 days

    // We register a single validator group during the migration.
    groupName: 'C-Labs',
    groupUrl: 'https://www.celo.org',
  },
}

const linkedLibraries = {
  FixidityLib: [
    'BondedDeposits',
    'Exchange',
    'GasPriceMinimum',
    'Governance',
    'Quorum',
    'SortedFractionMedianList',
    'SortedOracles',
    'StableToken',
    'Validators',
  ],
  LinkedList: ['AddressLinkedList', 'SortedLinkedList'],
  SortedLinkedList: ['AddressSortedLinkedList', 'IntegerSortedLinkedList'],
  AddressLinkedList: ['Validators'],
  AddressSortedLinkedList: ['Validators'],
  IntegerSortedLinkedList: ['Governance', 'IntegerSortedLinkedListTest'],
  SortedFractionMedianList: ['SortedOracles', 'SortedFractionMedianListTest'],
  Signatures: ['BondedDeposits', 'Escrow'],
}

const migrationOverride = argv.migration_override ? JSON.parse(argv.migration_override) : {}
config = {}
for (const key in defaultConfig) {
  config[key] = { ...defaultConfig[key], ...migrationOverride[key] }
}

module.exports = {
  config,
  linkedLibraries,
}
