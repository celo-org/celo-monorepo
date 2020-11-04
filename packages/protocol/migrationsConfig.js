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
      major: 1,
      minor: 0,
      patch: 0,
    },
    deploymentBlockGasLimit: 20000000,
    blockGasLimit: 10000000,
  },
  doubleSigningSlasher: {
    reward: '1000000000000000000000', // 1000 cGLD
    penalty: '9000000000000000000000', // 9000 cGLD
  },
  downtimeSlasher: {
    reward: '10000000000000000000', // 10 cGLD
    penalty: '100000000000000000000', // 100 cGLD
    slashableDowntime: (8 * HOUR) / 5, // ~8 hours
  },
  election: {
    minElectableValidators: '22',
    maxElectableValidators: '100',
    maxVotesPerAccount: 10,
    electabilityThreshold: 1 / 1000,
    frozen: true,
  },
  epochRewards: {
    targetVotingYieldParameters: {
      initial: 0, // Change to (x + 1) ^ 365 = 1.06 once Mainnet activated.
      max: 0.0005, // (x + 1) ^ 365 = 1.20
      adjustmentFactor: 0, // Change to 1 / 3650 once Mainnet activated.
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
    carbonOffsettingPartner: '0x0000000000000000000000000000000000000000',
    carbonOffsettingFraction: 1 / 1000,
    frozen: true,
  },
  exchange: {
    spread: 5 / 1000,
    reserveFraction: 1 / 100,
    updateFrequency: 5 * MINUTE,
    minimumReports: 5,
    frozen: true,
  },
  gasPriceMinimum: {
    minimumFloor: 100000000,
    targetDensity: 1 / 2,
    adjustmentSpeed: 1 / 2,
  },
  goldToken: {
    frozen: true,
  },
  governance: {
    queueExpiry: 4 * WEEK,
    dequeueFrequency: DAY, // Change to 1 week once Mainnet activated
    concurrentProposals: 3,
    approvalStageDuration: DAY, // Change to 3 days once Mainnet activated
    referendumStageDuration: 2 * DAY, // Change to 1 week once Mainnet activated
    executionStageDuration: 3 * DAY,
    minDeposit: 100, // 100 cGLD
    participationBaseline: 5 / 100, // Start with low participation requirements, let the protocol adjust
    participationBaselineFloor: 5 / 100,
    participationBaselineUpdateFactor: 1 / 5,
    participationBaselineQuorumFactor: 1,
  },
  governanceApproverMultiSig: {
    // 3/9 multsig, with 5/9 to make multisig changes.
    signatories: [
      '0xBE0c3B35Ec3f759D9A67c4B7c539b0D5b52A4642',
      '0xD6d48412dA0804CF88258bfDf5AaFcBe5FEd7ecC',
      '0xFD74A4b05F12B9aB6020CB202aDE1BBa4Bc99aba',
      '0x114a0f28f20a6cF1AD428C396f78248d0E76724e',
      '0xC631Eb5dE231000f96F4973ca8516d487108b2BF',
      '0xc85639289d4bbb5f90e380a0f4db6b77a2f777bf',
      '0x92AD020Cde6A4e566770C603ae8315a9d7252740',
      '0xba4862643d476acbc13276bd73daca7b27bf567c',
      '0xe5bD469Ad2d2A160604e38ad123828B7754aa23b',
    ],
    numRequiredConfirmations: 3,
    numInternalRequiredConfirmations: 5,
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
    tobinTaxStalenessThreshold: 100 * YEAR, // Tobin tax turned off to start
    tobinTax: toFixed(0).toFixed(), // Tobin tax turned off to start
    tobinTaxReserveRatio: toFixed(0).toFixed(), // Tobin tax turned off to start
    dailySpendingRatio: toFixed(0.05).toFixed(), // 5%
    frozenAssetsStartBalance: null,
    frozenAssetsDays: null,
    spenders: [],
    otherAddresses: [
      '0x246f4599eFD3fA67AC44335Ed5e749E518Ffd8bB',
      '0x298FbD6dad2Fc2cB56d7E37d8aCad8Bf07324f67',
    ],
    assetAllocationSymbols: ['cGLD', 'BTC', 'ETH', 'DAI'],
    assetAllocationWeights: [0.5, 0.3, 0.15, 0.05],
  },
  reserveSpenderMultiSig: {
    // 2/2 multsig
    signatories: [
      '0x21E7082D7b0Bc12BF65296CF859E09Fe529d366d',
      '0xbf4D39e774F438B6f8B8d7e56f26Fd2409F6ACF2',
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
      addresses: ['0xc471776eA02705004C451959129bF09423B56526'],
      values: ['5000000000000000000000000'],
    },
    oracles: [
      '0x0aee051be85ba9c7c1bc635fb76b52039341ab26',
      '0xd3405621f6cdcd95519a79d37f91c78e7c79cefa',
      '0xe037f31121f3a96c0cc49d0cf55b2f5d6deff19e',
      '0x12bad172b47287a754048f0d294221a499d1690f',
      '0xacad5b2913e21ccc073b80e431fec651cd8231c6',
      '0xfe9925e6ae9c4cd50ae471b90766aaef37ad307e',
      '0x641c6466dae2c0b1f1f4f9c547bc3f54f4744a1d',
      '0x75becd8e400552bac29cbe0534d8c7d6cba49979',
      '0x223ab67272891dd352194be61597042ecf9c272a',
      '0xca9ae47493f763a7166ab8310686b197984964b4',
      '0xB93Fe7906ea4221b3fbe23412D18Ab1B07FE2F71',
      '0x8d25D74E43789079Ef3C6B965c3D22b63A1233aC',
      '0xCD88Cc79342a7cFE78E91FAa173eC87704bDcA9a',
      '0x5091110175318A2A8aF88309D1648c1D84d31B29',
      '0xBBd6e54Af7A5722f42461C6313F37Bd50729F195',
    ],
    frozen: true,
  },
  transferWhitelist: {
    // Whitelist genesis block addresses.
    addresses: [
      '0x11901cf7eEae1E2644995FB2E47Ce46bC7F33246',
      '0xC1cDA18694F5B86cFB80c1B4f8Cc046B0d7E6326',
      '0xa5d40D93b01AfBafec84E20018Aff427628F645E',
      '0x8d485780E84E23437f8F6938D96B964645529127',
      '0x5F857c501b73ddFA804234f1f1418D6f75554076',
      '0xaa9064F57F8d7de4b3e08c35561E21Afd6341390',
      '0x7FA26b50b3e9a2eC8AD1850a4c4FBBF94D806E95',
      '0x08960Ce6b58BE32FBc6aC1489d04364B4f7dC216',
      '0x77B68B2e7091D4F242a8Af89F200Af941433C6d8',
      '0x75Bb69C002C43f5a26a2A620518775795Fd45ecf',
      '0x19992AE48914a178Bf138665CffDD8CD79b99513',
      '0xE23a4c6615669526Ab58E9c37088bee4eD2b2dEE',
      '0xDe22679dCA843B424FD0BBd70A22D5F5a4B94fe4',
      '0x743D80810fe10c5C3346D2940997cC9647035B13',
      '0x8e1c4355307F1A59E7eD4Ae057c51368b9338C38',
      '0x417fe63186C388812e342c85FF87187Dc584C630',
      '0xF5720c180a6Fa14ECcE82FB1bB060A39E93A263c',
      '0xB80d1e7F9CEbe4b5E1B1Acf037d3a44871105041',
      '0xf8ed78A113cD2a34dF451Ba3D540FFAE66829AA0',
      '0x9033ff75af27222c8f36a148800c7331581933F3',
      '0x8A07541C2eF161F4e3f8de7c7894718dA26626B2',
      '0xB2fe7AFe178335CEc3564d7671EEbD7634C626B0',
      '0xc471776eA02705004C451959129bF09423B56526',
      '0xeF283eca68DE87E051D427b4be152A7403110647',
      '0x7cf091C954ed7E9304452d31fd59999505Ddcb7a',
      '0xa5d2944C32a8D7b284fF0b84c20fDcc46937Cf64',
      '0xFC89C17525f08F2Bc9bA8cb77BcF05055B1F7059',
      '0x3Fa7C646599F3174380BD9a7B6efCde90b5d129d',
      '0x989e1a3B344A43911e02cCC609D469fbc15AB1F1',
      '0xAe1d640648009DbE0Aa4485d3BfBB68C37710924',
      '0x1B6C64779F42BA6B54C853Ab70171aCd81b072F7',
    ],
    registryIds: [
      web3.utils.soliditySha3(CeloContractName.Governance),
      web3.utils.soliditySha3(CeloContractName.LockedGold),
      web3.utils.soliditySha3(CeloContractName.Reserve),
    ],
  },
  validators: {
    groupLockedGoldRequirements: {
      value: '10000000000000000000000', // 10k CELO per validator
      duration: 180 * DAY,
    },
    validatorLockedGoldRequirements: {
      value: '10000000000000000000000', // 10k CELO
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

    // Register cLabs groups to contain an initial set of validators to run test networks.
    validatorKeys: [],
    attestationKeys: [],
    groupName: 'cLabs',
    commission: 0.1,
    votesRatioOfLastVsFirstGroup: 2.0,
  },
}

const NetworkConfigs = {
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
      // Add an arbitrary "otherReserveAddress" so that reserve spending can be tested.
      otherAddresses: ['0x7457d5E02197480Db681D3fdF256c7acA21bDc12'],
    },
    reserveSpenderMultiSig: {
      signatories: [network.from],
      numRequiredConfirmations: 1,
      numInternalRequiredConfirmations: 1,
    },
    stableToken: {
      oracles: [network.from],
      frozen: false,
      initialBalances: {
        addresses: [network.from],
        values: ['5000000000000000000000000'],
      },
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
      initialBalance: 100000000, // CELO
    },
  },
  baklava: {
    election: {
      minElectableValidators: 20,
      frozen: false,
    },
    epochRewards: {
      targetVotingYieldParameters: {
        initial: 0.00016,
      },
      frozen: false,
    },
    exchange: {
      frozen: false,
    },
    goldToken: {
      frozen: false,
    },
    governance: {
      // Set to be able to complete a proposal in about a day, but give everyone a chance to participate.
      dequeueFrequency: 4 * HOUR,
      approvalStageDuration: 4 * HOUR,
      referendumStageDuration: DAY,
      executionStageDuration: WEEK,
      participationBaseline: 1 / 200, // Very low participation requirement given its a testnet.
      participationBaselineFloor: 1 / 100,
      participationBaselineUpdateFactor: 1 / 5,
      participationBaselineQuorumFactor: 1,
    },
    governanceApproverMultiSig: {
      // 1/5 multsig
      signatories: [
        '0xb04778c00A8e30F59bFc91DD74853C4f32F34E54', // Google Cloud IAM managed account
        '0x32830A3f65DF98aFCFA18bAd35009Aa51163D606', // Individual signer
        '0x7c593219ad21e172c1fdc6bfdc359699fa428adb', // Individual signer
        '0x31af68f73fb93815b3eB9a6FA76e63113De5f733', // Individual signer
        '0x47fE4b9fFDB9712fC5793B1b5E86d96a4664cf02', // Individual signer
      ],
      numRequiredConfirmations: 1,
      numInternalRequiredConfirmations: 2,
    },
    lockedGold: {
      unlockingPeriod: 6 * HOUR, // 1/12 of the Mainnet period.
    },
    reserve: {
      initialBalance: 100000000, // CELO
      frozenAssetsStartBalance: 80000000, // Matches Mainnet after CGP-6
      frozenAssetsDays: 182, // 3x Mainnet thawing rate
    },
    reserveSpenderMultiSig: {
      // 1/3 multsig
      signatories: [
        '0x62C6a0446BbD7f6260108dD538d88E8b53128a90', // Google Cloud IAM managed account
        '0x49eFFA2ceF5FccA5540f421d6b28e76184cc0fDF', // Individual signer
        '0x4550F1576fAC966Ac8b9F42e1D5D66D3A14dD8D3', // Individual signer
      ],
      numRequiredConfirmations: 1,
      numInternalRequiredConfirmations: 2,
    },
    stableToken: {
      // Don't set an initial gold price before oracles start to report.
      goldPrice: null,
      oracles: [
        '0xd71fea6b92d3f21f659152589223385a7329bb11',
        '0x1e477fc9b6a49a561343cd16b2c541930f5da7d2',
        '0x460b3f8d3c203363bb65b1a18d89d4ffb6b0c981',
        '0x3b522230c454ca9720665d66e6335a72327291e8',
        '0x0AFe167600a5542d10912f4A07DFc4EEe0769672',
        '0x412ebe7859e9aa71ff5ce4038596f6878c359c96',
        '0xbbfe73df8b346b3261b19ac91235888aba36d68c',
        '0x02b1d1bea682fcab4448c0820f5db409cce4f702',
        '0xe90f891710f625f18ecbf1e02efb4fd1ab236a10',
        '0x28c52c722df87ed11c5d7665e585e84aa93d7964',
      ],
      frozen: false,
    },
    validators: {
      groupLockedGoldRequirements: {
        duration: 15 * DAY, // 1/12 of the Mainnet duration.
      },
      validatorLockedGoldRequirements: {
        duration: 5 * DAY, // 1/12 of the Mainnet duration.
      },
      membershipHistoryLength: 15, // Number of epochs in the group lockup period.
      votesRatioOfLastVsFirstGroup: 1.0,
    },
  },
  alfajores: {
    election: {
      minElectableValidators: 5,
    },
    epochRewards: {
      targetVotingYieldParameters: {
        initial: 0.00016,
      },
      frozen: false,
    },
    exchange: {
      frozen: false,
      minimumReports: 1,
    },
    goldToken: {
      frozen: false,
    },
    governance: {
      // Set to allow an attentive individual complete a governance proposal in 2 hours.
      dequeueFrequency: 30 * MINUTE,
      approvalStageDuration: 30 * MINUTE,
      referendumStageDuration: HOUR,
      executionStageDuration: DAY,
      participationBaseline: 1 / 200, // Very low participation requirement given its a testnet.
      participationBaselineFloor: 1 / 100,
      participationBaselineUpdateFactor: 1 / 5,
      participationBaselineQuorumFactor: 1,
    },
    governanceApproverMultiSig: {
      signatories: [
        '0xCc50EaC48bA71343dC76852FAE1892c6Bd2971DA', // Google Cloud IAM managed account
      ],
      numRequiredConfirmations: 1,
      numInternalRequiredConfirmations: 1,
    },
    lockedGold: {
      unlockingPeriod: 6 * HOUR, // 1/12 of the Mainnet period.
    },
    oracles: {
      // Allow old reports so Oracle does not have to run continuously.
      reportExpiry: 1000 * DAY,
    },
    reserve: {
      initialBalance: 100000000, // CELO
      frozenAssetsStartBalance: 80000000, // Matches Mainnet after CGP-6
      frozenAssetsDays: 182, // 3x Mainnet thawing rate
      otherAddresses: [],
    },
    reserveSpenderMultiSig: {
      signatories: [
        '0x50F5017cED9d69A47C29643bde02E0EB120E039A', // Google Cloud IAM managed account
      ],
      numRequiredConfirmations: 1,
      numInternalRequiredConfirmations: 1,
    },
    stableToken: {
      oracles: [
        // Oracle addresses generated from alfajores mnemonic
        '0x840b32F30e1a3b2E8b9E6C0972eBa0148E22B847',
        '0x3E4DBf92e5f19BE41e1Faa6368779418A610191f',
        '0xdD5Cb02066fde415dda4f04EE53fBb652066afEE',
        '0x473a3be7C2A42452Ed0b521614B3b76BC59D2D1D',
        '0x43c25991F0f037517D174B7E0ffD8c8Ccc471c6B',
        '0x2c82F367e2eD1BA018f23219b0E3FBA60a4424d8',
        '0xedf87d1e6A041cA55F857a01C10fC626C194c524',
        '0x510Bf5D8feBCA69fCfe73d391783be01B3324c69',
        '0xD7C06AfE310baCD786BA2929088298b9e60322ec',
        '0xFc0Ea86dBDFE9CB432BaFDe251Bd2dEba022AFd7',
      ],
      frozen: false,
    },
    validators: {
      groupLockedGoldRequirements: {
        duration: 15 * DAY, // 1/12 of the Mainnet duration.
      },
      validatorLockedGoldRequirements: {
        duration: 5 * DAY, // 1/12 of the Mainnet duration.
      },
      membershipHistoryLength: 15, // Number of epochs in the group lockup period.
      votesRatioOfLastVsFirstGroup: 1.0,
    },
  },
}

NetworkConfigs.baklavastaging = NetworkConfigs.baklava
NetworkConfigs.alfajoresstaging = NetworkConfigs.alfajores

const linkedLibraries = {
  Proposals: ['Governance', 'GovernanceTest', 'ProposalsTest'],
  AddressLinkedList: ['Validators', 'ValidatorsTest'],
  AddressSortedLinkedList: ['Election', 'ElectionTest'],
  IntegerSortedLinkedList: ['Governance', 'GovernanceTest', 'IntegerSortedLinkedListTest'],
  AddressSortedLinkedListWithMedian: ['SortedOracles', 'AddressSortedLinkedListWithMedianTest'],
  Signatures: [
    'Accounts',
    'Attestations',
    'AttestationsTest',
    'LockedGold',
    'Escrow',
    'MetaTransactionWallet',
  ],
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
