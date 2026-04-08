/* tslint:disable: object-literal-sort-keys */
require('ts-node/register')
var Web3 = require('web3')

const HDWalletProvider = require('@truffle/hdwallet-provider')

const argv = require('minimist')(process.argv.slice(2), {
  string: ['truffle_override', 'network'],
  boolean: ['reset'],
})

const CELOSEPOLIA_NETWORKID = 11142220

const OG_FROM = '0xfeE1a22F43BeeCB912B5a4912ba87527682ef0fC'
const DEVELOPMENT_FROM = '0x5409ed021d9299bf6814279a6a1411a7e866a631'
const INTEGRATION_FROM = '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'
const INTEGRATION_TESTING_FROM = '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'
const CELOSEPOLIA_FROM = process.env.CELOSEPOLIA_FROM

const gasLimit = 20000000
const hostAddress = process.env.CELO_NODE_ADDRESS || '127.0.0.1'
const hostPort = parseInt(process.env.CELO_NODE_PORT || '8545')
const devPort = 8546

const defaultConfig = {
  host: hostAddress,
  port: hostPort,
  network_id: 1101,
  from: OG_FROM,
  gas: gasLimit,
  gasPrice: 100000000000,
  maxFeePerGas: 975_000_000_000,
}

function readMnemonic(networkName) {
  dotenv = require('dotenv').config({
    path: require('path').resolve(__dirname, `../../.env.mnemonic.${networkName.replace('-', '')}`),
  })

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY
  if (privateKey === undefined || privateKey === null || privateKey === '') {
    console.log(
      `No private key found in .env.mnemonic.${networkName}. Please run "yarn keys:decrypt" in root after escalating perms in Akeyless`
    )
    process.exit(1)
  }

  return process.env.DEPLOYER_PRIVATE_KEY
}

const fornoUrls = {
  'celo-sepolia': 'https://forno.celo-sepolia.celo-testnet.org',
  rc1: 'https://forno.celo.org',
  mainnet: 'https://forno.celo.org',
}

const networks = {
  development: {
    ...defaultConfig,
    from: DEVELOPMENT_FROM,
    gasPrice: 0,
    gas: gasLimit,
    defaultBalance: 200000000,
    mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
  },
  rc1: {
    port: 8545,
    from: '0xF3EB910DA09B8AF348E0E5B6636da442cFa79239',
    network_id: 42220,
    gas: gasLimit,
    gasPrice: 100000000000,
    privateKeyAvailable: false,
    proposer: '0xc11F5aC70B86517Dcc10f20d8B0D5e77EBb956Ce',
    approver: '0x41822d8A191fcfB1cfcA5F7048818aCd8eE933d3',
    voter: '0xb073014a4c60c9824B597375C5e2d49e765cf811',
  },
  testnet_prod: defaultConfig,
  anvil: {
    ...defaultConfig,
    network_id: '*', // Accept any chain ID for anvil fork testing
    from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    port: devPort, // Use port 8546 for anvil (matches ANVIL_PORT in constants.sh)
  },
  // New testnets
  integration: {
    ...defaultConfig,
    from: INTEGRATION_FROM,
    port: devPort,
  },
  testing: {
    ...defaultConfig,
    from: INTEGRATION_TESTING_FROM,
    network_id: 1101,
    port: devPort,
  },
  'celo-sepolia': {
    ...defaultConfig,
    network_id: CELOSEPOLIA_NETWORKID,
    from: CELOSEPOLIA_FROM,
    privateKeyAvailable: true,
    proposer: '0x95a40aA01d2d72b4122C19c86160710D01224ada',
    approver: '0x95a40aA01d2d72b4122C19c86160710D01224ada',
    voter: '0x95a40aA01d2d72b4122C19c86160710D01224ada',
  },
}

// Equivalent
networks.mainnet = networks.rc1

// Validate CELOSEPOLIA_FROM is set when using celosepolia network
if (argv.network === 'celo-sepolia' && !CELOSEPOLIA_FROM) {
  console.error('Error: CELOSEPOLIA_FROM environment variable is required for celo-sepolia network')
  process.exit(1)
}

// If an override was provided, apply it.
// If the network is missing from networks, start with the default config.
if (argv.truffle_override || !(argv.network in networks)) {
  const configOverride = argv.truffle_override ? JSON.parse(argv.truffle_override) : {}
  if (argv.network in networks) {
    networks[argv.network] = { ...networks[argv.network], ...configOverride }
  } else {
    networks[argv.network] = { ...defaultConfig, ...configOverride }
  }
}

if (process.argv.includes('--forno')) {
  console.log('Using forno as RPC')
  if (!fornoUrls[argv.network]) {
    console.log(`Forno URL for network ${argv.network} not known!`)
    process.exit(1)
  }

  networks[argv.network].host = undefined
  networks[argv.network].port = undefined

  if (networks[argv.network].privateKeyAvailable) {
    console.log('Network is supposed to have a private key available, using HDWalletProvider')
    networks[argv.network].provider = function () {
      return new HDWalletProvider({
        privateKeys: [readMnemonic(argv.network)],
        providerOrUrl: fornoUrls[argv.network],
      })
    }
  } else {
    networks[argv.network].provider = function () {
      return new Web3.providers.HttpProvider(fornoUrls[argv.network])
    }
  }
}

module.exports = { networks: networks, fornoUrls: fornoUrls }
