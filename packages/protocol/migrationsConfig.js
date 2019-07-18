const argv = require('minimist')(process.argv.slice(2), { string: ['migration_override'] })

const defaultConfig = {
  attestations: {
    attestationExpirySeconds: 60 * 60, // 1 hour,
    attestationRequestFeeInDollars: 0.05,
  },
  bondedDeposits: {
    maxNoticePeriod: 60 * 60 * 24 * 365 * 3, // 3 years
  },
  exchange: {
    spreadNumerator: 5,
    spreadDenominator: 1000,
    reserveFractionNumerator: 1,
    reserveFractionDenominator: 1,
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
  },
  gasPriceMinimum: {
    initialMinimum: 10000,
    targetDensity: {
      numerator: 1,
      denominator: 2,
    },
    adjustmentSpeed: {
      numerator: 1,
      denominator: 2,
    },
    infrastructureFraction: {
      numerator: 1,
      denominator: 2,
    },
  },
  registryProxyPredeployedAddress: '0x000000000000000000000000000000000000ce10',
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
    inflationRateNumerator: 100009591886,
    inflationRateDenominator: 100000000000,
    inflationPeriod: 7 * 24 * 60 * 60, // 1 week
  },
  validators: {
    minElectableValidators: '10', // 1 is only used for tests
    maxElectableValidators: '100',
    minBondedDepositValue: '1000000000000000000', // 1 gold
    minBondedDepositNoticePeriod: 60 * 24 * 60 * 60, // 60 days

    // We register a single validator group during the migration.
    groupName: 'C-Labs',
    groupUrl: 'https://www.celo.org',
  },
}

const linkedLibraries = {
  LinkedList: ['AddressLinkedList', 'SortedLinkedList'],
  SortedLinkedList: ['AddressSortedLinkedList', 'IntegerSortedLinkedList'],
  AddressLinkedList: ['Validators'],
  AddressSortedLinkedList: ['Validators'],
  IntegerSortedLinkedList: ['Governance', 'IntegerSortedLinkedListTest'],
  SortedFractionMedianList: ['SortedOracles', 'SortedFractionMedianListTest'],
}

const migrationOverride = argv.migration_override ? JSON.parse(argv.migration_override) : {}
config = { ...defaultConfig, ...migrationOverride }

module.exports = {
  config,
  linkedLibraries,
}
