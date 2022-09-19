// @ts-ignore
import * as bls12377js from '@celo/bls12377js'
import { blsPrivateKeyToProcessedPrivateKey } from '@celo/cryptographic-utils/lib/bls'
import BigNumber from 'bignumber.js'
import { BIP32Factory, BIP32Interface } from 'bip32'
import * as ecc from 'tiny-secp256k1'
import * as bip39 from 'bip39'
import fs from 'fs'
import { merge, range, repeat } from 'lodash'
import { tmpdir } from 'os'
import path from 'path'
import * as rlp from 'rlp'
import { MyceloGenesisConfig } from 'src/lib/interfaces/mycelo-genesis-config'
import { CurrencyPair } from 'src/lib/k8s-oracle/base'
import Web3 from 'web3'
import { spawnCmd, spawnCmdWithExitOnFailure } from './cmd-utils'
import { envVar, fetchEnv, fetchEnvOrFallback, monorepoRoot } from './env-utils'
import {
  CONTRACT_OWNER_STORAGE_LOCATION,
  GENESIS_MSG_HASH,
  GETH_CONFIG_OLD,
  ISTANBUL_MIX_HASH,
  REGISTRY_ADDRESS,
  TEMPLATE,
} from './genesis_constants'
import { getIndexForLoadTestThread } from './geth'
import { GenesisConfig } from './interfaces/genesis-config'
import { ensure0x, strip0x } from './utils'

const bip32 = BIP32Factory(ecc)

export enum AccountType {
  VALIDATOR = 0,
  LOAD_TESTING_ACCOUNT = 1,
  TX_NODE = 2,
  BOOTNODE = 3,
  FAUCET = 4,
  ATTESTATION = 5,
  PRICE_ORACLE = 6,
  PROXY = 7,
  ATTESTATION_BOT = 8,
  VOTING_BOT = 9,
  TX_NODE_PRIVATE = 10,
  VALIDATOR_GROUP = 11,
  ADMIN = 12,
  TX_FEE_RECIPIENT = 13,
}

export enum ConsensusType {
  CLIQUE = 'clique',
  ISTANBUL = 'istanbul',
}

export interface Validator {
  address: string
  blsPublicKey: string
  balance?: string
}

export interface AccountAndBalance {
  address: string
  balance: string
}

export const MNEMONIC_ACCOUNT_TYPE_CHOICES = [
  'validator',
  'load_testing',
  'tx_node',
  'bootnode',
  'faucet',
  'attestation',
  'price_oracle',
  'proxy',
  'attestation_bot',
  'voting_bot',
  'tx_node_private',
  'validator_group',
  'admin',
  'tx_fee_recipient',
]

export const add0x = (str: string) => {
  return '0x' + str
}

export const coerceMnemonicAccountType = (raw: string): AccountType => {
  const index = MNEMONIC_ACCOUNT_TYPE_CHOICES.indexOf(raw)
  if (index === -1) {
    throw new Error('Invalid mnemonic account type')
  }
  return index
}

export const generatePrivateKey = (mnemonic: string, accountType: AccountType, index: number) => {
  return generatePrivateKeyWithDerivations(mnemonic, [accountType, index])
}

export const generateOraclePrivateKey = (
  mnemonic: string,
  currencyPair: CurrencyPair,
  index: number
) => {
  let derivationPath: number[]
  if (currencyPair === 'CELOUSD') {
    // For backwards compatibility we don't add currencyPair to
    // the derivation path for CELOUSD
    derivationPath = [AccountType.PRICE_ORACLE, index]
  } else {
    // Deterministically convert the currency pair string to a path segment
    // keccak(currencyPair) modulo 2^31
    const currencyDerivation = new BigNumber(Web3.utils.keccak256(currencyPair), 16)
      .mod(2 ** 31)
      .toNumber()
    derivationPath = [AccountType.PRICE_ORACLE, currencyDerivation, index]
  }

  return generatePrivateKeyWithDerivations(mnemonic, derivationPath)
}

export const generatePrivateKeyWithDerivations = (mnemonic: string, derivations: number[]) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const node = bip32.fromSeed(seed)
  const newNode = derivations.reduce((n: BIP32Interface, derivation: number) => {
    return n.derive(derivation)
  }, node)
  return newNode.privateKey!.toString('hex')
}

export const generatePublicKey = (mnemonic: string, accountType: AccountType, index: number) => {
  return privateKeyToPublicKey(generatePrivateKey(mnemonic, accountType, index))
}

export const generateAddress = (mnemonic: string, accountType: AccountType, index: number) =>
  privateKeyToAddress(generatePrivateKey(mnemonic, accountType, index))

export const privateKeyToPublicKey = (privateKey: string): string => {
  // NOTE: elliptic is disabled elsewhere in this library to prevent
  // accidental signing of truncated messages.
  // tslint:disable-next-line:import-blacklist
  const EC = require('elliptic').ec
  const ec = new EC('secp256k1')
  const ecPrivateKey = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'))
  const ecPublicKey: string = ecPrivateKey.getPublic('hex')
  return ecPublicKey.slice(2)
}

export const privateKeyToAddress = (privateKey: string) => {
  // @ts-ignore
  return new Web3.modules.Eth().accounts.privateKeyToAccount(ensure0x(privateKey)).address
}

export const privateKeyToStrippedAddress = (privateKey: string) =>
  strip0x(privateKeyToAddress(privateKey))

const validatorZeroBalance = () =>
  fetchEnvOrFallback(envVar.VALIDATOR_ZERO_GENESIS_BALANCE, '103010030000000000000000000') // 103,010,030 CG
const validatorBalance = () =>
  fetchEnvOrFallback(envVar.VALIDATOR_GENESIS_BALANCE, '10011000000000000000000') // 10,011 CG
const faucetBalance = () =>
  fetchEnvOrFallback(envVar.FAUCET_GENESIS_BALANCE, '10011000000000000000000') // 10,011 CG
const oracleBalance = () =>
  fetchEnvOrFallback(envVar.MOCK_ORACLE_GENESIS_BALANCE, '100000000000000000000') // 100 CG
const votingBotBalance = () =>
  fetchEnvOrFallback(envVar.VOTING_BOT_BALANCE, '10000000000000000000000') // 10,000 CG

export const getPrivateKeysFor = (accountType: AccountType, mnemonic: string, n: number) =>
  range(0, n).map((i) => generatePrivateKey(mnemonic, accountType, i))

export const getOraclePrivateKeysFor = (currencyPair: CurrencyPair, mnemonic: string, n: number) =>
  range(0, n).map((i) => generateOraclePrivateKey(mnemonic, currencyPair, i))

export const getAddressesFor = (accountType: AccountType, mnemonic: string, n: number) =>
  getPrivateKeysFor(accountType, mnemonic, n).map(privateKeyToAddress)

export const getStrippedAddressesFor = (accountType: AccountType, mnemonic: string, n: number) =>
  getAddressesFor(accountType, mnemonic, n).map(strip0x)

export const getValidatorsInformation = (mnemonic: string, n: number): Validator[] => {
  return getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, n).map((key, i) => {
    const blsKeyBytes = blsPrivateKeyToProcessedPrivateKey(key)
    return {
      address: strip0x(privateKeyToAddress(key)),
      blsPublicKey: bls12377js.BLS.privateToPublicBytes(blsKeyBytes).toString('hex'),
      balance: i === 0 ? validatorZeroBalance() : validatorBalance(),
    }
  })
}

export const getAddressFromEnv = (accountType: AccountType, n: number) => {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const privateKey = generatePrivateKey(mnemonic, accountType, n)
  return privateKeyToAddress(privateKey)
}

const getFaucetedAccountsFor = (
  accountType: AccountType,
  mnemonic: string,
  n: number,
  balance: string
) => {
  return getStrippedAddressesFor(accountType, mnemonic, n).map((address) => ({
    address,
    balance,
  }))
}

const getFaucetedAccountsForLoadTest = (
  accountType: AccountType,
  mnemonic: string,
  clients: number,
  threads: number,
  balance: string
) => {
  const addresses: string[] = []
  for (const podIndex of range(0, clients)) {
    for (const threadIndex of range(0, threads)) {
      const index = getIndexForLoadTestThread(podIndex, threadIndex)
      addresses.push(strip0x(generateAddress(mnemonic, accountType, parseInt(`${index}`, 10))))
    }
  }
  return addresses.map((address) => ({
    address,
    balance,
  }))
}

export const getFaucetedAccounts = (mnemonic: string) => {
  const numFaucetAccounts = parseInt(fetchEnvOrFallback(envVar.FAUCET_GENESIS_ACCOUNTS, '0'), 10)
  const faucetAccounts = getFaucetedAccountsFor(
    AccountType.FAUCET,
    mnemonic,
    numFaucetAccounts,
    faucetBalance()
  )

  const numLoadTestAccounts = parseInt(fetchEnvOrFallback(envVar.LOAD_TEST_CLIENTS, '0'), 10)
  const numLoadTestThreads = parseInt(fetchEnvOrFallback(envVar.LOAD_TEST_THREADS, '0'), 10)

  const loadTestAccounts = getFaucetedAccountsForLoadTest(
    AccountType.LOAD_TESTING_ACCOUNT,
    mnemonic,
    numLoadTestAccounts,
    numLoadTestThreads,
    faucetBalance()
  )

  const oracleAccounts = getFaucetedAccountsFor(
    AccountType.PRICE_ORACLE,
    mnemonic,
    1,
    oracleBalance()
  )

  const numVotingBotAccounts = parseInt(fetchEnvOrFallback(envVar.VOTING_BOTS, '0'), 10)
  const votingBotAccounts = getFaucetedAccountsFor(
    AccountType.VOTING_BOT,
    mnemonic,
    numVotingBotAccounts,
    votingBotBalance()
  )

  return [...faucetAccounts, ...loadTestAccounts, ...oracleAccounts, ...votingBotAccounts]
}

const hardForkActivationBlock = (key: string) => {
  const value = fetchEnvOrFallback(key, '')
  if (value === '') {
    return undefined
  } else {
    return parseInt(value, 10)
  }
}

export const generateGenesisFromEnv = (enablePetersburg: boolean = true) => {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const validatorEnv = parseInt(fetchEnv(envVar.VALIDATORS), 10)
  const genesisAccountsEnv = fetchEnvOrFallback(envVar.GENESIS_ACCOUNTS, '')
  const validators = getValidatorsInformation(mnemonic, validatorEnv)

  const consensusType = fetchEnv(envVar.CONSENSUS_TYPE) as ConsensusType

  if (![ConsensusType.CLIQUE, ConsensusType.ISTANBUL].includes(consensusType)) {
    console.error('Unsupported CONSENSUS_TYPE')
    process.exit(1)
  }

  const blockTime = parseInt(fetchEnv(envVar.BLOCK_TIME), 10)
  const requestTimeout = parseInt(
    fetchEnvOrFallback(envVar.ISTANBUL_REQUEST_TIMEOUT_MS, '3000'),
    10
  )
  const epoch = parseInt(fetchEnvOrFallback(envVar.EPOCH, '30000'), 10)
  // allow 12 blocks in prod for the uptime metric
  const lookbackwindow = parseInt(fetchEnvOrFallback(envVar.LOOKBACK, '12'), 10)
  const chainId = parseInt(fetchEnv(envVar.NETWORK_ID), 10)

  const initialAccounts = getFaucetedAccounts(mnemonic)
  if (genesisAccountsEnv !== '') {
    const genesisAccountsPath = path.resolve(monorepoRoot, genesisAccountsEnv)
    const genesisAccounts = JSON.parse(fs.readFileSync(genesisAccountsPath).toString())
    for (const addr of genesisAccounts.addresses) {
      initialAccounts.push({
        address: addr,
        balance: genesisAccounts.value,
      })
    }
  }

  // Allocate voting bot account(s)
  const numVotingBotAccounts = parseInt(fetchEnvOrFallback(envVar.VOTING_BOTS, '0'), 10)
  initialAccounts.concat(
    getStrippedAddressesFor(AccountType.VOTING_BOT, mnemonic, numVotingBotAccounts).map((addr) => {
      return {
        address: addr,
        balance: fetchEnvOrFallback(envVar.VOTING_BOT_BALANCE, '100000000000000000000'),
      }
    })
  )

  // Celo hard fork activation blocks.  Default is undefined, which means not activated.
  const churritoBlock = hardForkActivationBlock(envVar.CHURRITO_BLOCK)
  const donutBlock = hardForkActivationBlock(envVar.DONUT_BLOCK)
  const espressoBlock = hardForkActivationBlock(envVar.ESPRESSO_BLOCK)

  // network start timestamp
  const timestamp = parseInt(fetchEnvOrFallback(envVar.TIMESTAMP, '0'), 10)

  return generateGenesis({
    validators,
    consensusType,
    blockTime,
    initialAccounts,
    epoch,
    lookbackwindow,
    chainId,
    requestTimeout,
    enablePetersburg,
    timestamp,
    churritoBlock,
    donutBlock,
    espressoBlock,
  })
}

export const generateIstanbulExtraData = (validators: Validator[]) => {
  const istanbulVanity = GENESIS_MSG_HASH
  // Vanity prefix is 32 bytes (1 hex char/.5 bytes * 32 bytes = 64 hex chars)
  if (istanbulVanity.length !== 32 * 2) {
    throw new Error('Istanbul vanity must be 32 bytes')
  }
  const blsSignatureVanity = 96
  const ecdsaSignatureVanity = 65
  return (
    '0x' +
    istanbulVanity +
    rlp
      // @ts-ignore
      .encode([
        // Added validators
        validators.map((validator) => Buffer.from(validator.address, 'hex')),
        validators.map((validator) => Buffer.from(validator.blsPublicKey, 'hex')),
        // Removed validators
        new Buffer(0),
        // Seal
        Buffer.from(repeat('0', ecdsaSignatureVanity * 2), 'hex'),
        [
          // AggregatedSeal.Bitmap
          new Buffer(0),
          // AggregatedSeal.Signature
          Buffer.from(repeat('0', blsSignatureVanity * 2), 'hex'),
          // AggregatedSeal.Round
          new Buffer(0),
        ],
        [
          // ParentAggregatedSeal.Bitmap
          new Buffer(0),
          // ParentAggregatedSeal.Signature
          Buffer.from(repeat('0', blsSignatureVanity * 2), 'hex'),
          // ParentAggregatedSeal.Round
          new Buffer(0),
        ],
      ])
      .toString('hex')
  )
}

export const generateGenesis = ({
  validators,
  consensusType = ConsensusType.ISTANBUL,
  initialAccounts: otherAccounts = [],
  blockTime,
  epoch,
  lookbackwindow,
  chainId,
  requestTimeout,
  enablePetersburg = true,
  timestamp = 0,
  churritoBlock,
  donutBlock,
  espressoBlock,
}: GenesisConfig): string => {
  const genesis: any = { ...TEMPLATE }

  if (!enablePetersburg) {
    genesis.config = GETH_CONFIG_OLD
  }

  if (typeof churritoBlock === 'number') {
    genesis.config.churritoBlock = churritoBlock
  }
  if (typeof donutBlock === 'number') {
    genesis.config.donutBlock = donutBlock
  }
  if (typeof espressoBlock === 'number') {
    genesis.config.espressoBlock = espressoBlock
  }

  genesis.config.chainId = chainId

  if (consensusType === ConsensusType.CLIQUE) {
    genesis.config.clique = {
      period: blockTime,
      epoch,
    }
  } else if (consensusType === ConsensusType.ISTANBUL) {
    genesis.mixHash = ISTANBUL_MIX_HASH
    genesis.difficulty = '0x1'
    if (validators) {
      genesis.extraData = generateIstanbulExtraData(validators)
    }
    genesis.config.istanbul = {
      // see github.com/celo-org/celo-blockchain/blob/master/consensus/istanbul/config.go#L21-L25
      // 0 = RoundRobin, 1 = Sticky, 2 = ShuffledRoundRobin
      policy: 2,
      blockperiod: blockTime,
      requesttimeout: requestTimeout,
      epoch,
      lookbackwindow,
    }
  }

  if (validators) {
    for (const validator of validators) {
      genesis.alloc[validator.address] = {
        balance: validator.balance,
      }
    }
  }

  for (const account of otherAccounts) {
    genesis.alloc[account.address] = {
      balance: account.balance,
    }
  }

  const contracts = [REGISTRY_ADDRESS]
  const contractBuildPath = path.resolve(
    monorepoRoot,
    'packages/protocol/build/contracts/Proxy.json'
  )

  if (validators && validators.length > 0) {
    for (const contract of contracts) {
      genesis.alloc[contract] = {
        code: JSON.parse(fs.readFileSync(contractBuildPath).toString()).deployedBytecode,
        storage: {
          [CONTRACT_OWNER_STORAGE_LOCATION]: validators[0].address,
        },
        balance: '0',
      }
    }
  }

  genesis.timestamp = timestamp > 0 ? timestamp.toString() : '0x0'

  return JSON.stringify(genesis, null, 2)
}

// This function assumes that mycelo has already been built using 'make all'
export const generateGenesisWithMigrations = async ({
  gethRepoPath,
  genesisConfig,
  mnemonic,
  numValidators,
  verbose,
}: MyceloGenesisConfig): Promise<string> => {
  const tmpDir = path.join(tmpdir(), `mycelo-genesis-${Date.now()}`)
  fs.mkdirSync(tmpDir)
  const envFile = path.join(tmpDir, 'env.json')
  const configFile = path.join(tmpDir, 'genesis-config.json')
  const myceloBinaryPath = path.join(gethRepoPath!, '/build/bin/mycelo')
  await spawnCmdWithExitOnFailure(
    myceloBinaryPath,
    [
      'genesis-config',
      '--template',
      'monorepo',
      '--mnemonic',
      mnemonic,
      '--validators',
      numValidators.toString(),
    ],
    {
      silent: !verbose,
      cwd: tmpDir,
    }
  )
  const mcEnv = JSON.parse(fs.readFileSync(envFile).toString())
  const mcConfig = JSON.parse(fs.readFileSync(configFile).toString())

  // Customize and overwrite the env.json file
  merge(mcEnv, {
    chainId: genesisConfig.chainId,
    accounts: {
      validators: numValidators,
    },
  })
  fs.writeFileSync(envFile, JSON.stringify(mcEnv, undefined, 2))

  // Customize and overwrite the genesis-config.json file
  if (genesisConfig.chainId) {
    mcConfig.chainId = genesisConfig.chainId
  }
  if (genesisConfig.epoch) {
    mcConfig.istanbul.epoch = genesisConfig.epoch
  }
  if (genesisConfig.lookbackwindow) {
    mcConfig.istanbul.lookbackwindow = genesisConfig.lookbackwindow
  }
  if (genesisConfig.blockTime) {
    mcConfig.istanbul.blockperiod = genesisConfig.blockTime
  }
  if (genesisConfig.requestTimeout) {
    mcConfig.istanbul.requesttimeout = genesisConfig.requestTimeout
  }
  if (genesisConfig.churritoBlock !== undefined) {
    mcConfig.hardforks.churritoBlock = genesisConfig.churritoBlock
  }
  if (genesisConfig.donutBlock !== undefined) {
    mcConfig.hardforks.donutBlock = genesisConfig.donutBlock
  }
  if (genesisConfig.espressoBlock !== undefined) {
    mcConfig.hardforks.espressoBlock = genesisConfig.espressoBlock
  }
  if (genesisConfig.timestamp !== undefined) {
    mcConfig.genesisTimestamp = genesisConfig.timestamp
  }

  // TODO: overrides for migrations

  fs.writeFileSync(configFile, JSON.stringify(mcConfig, undefined, 2))

  // Generate the genesis file, and return its contents
  const contractsBuildPath = path.resolve(monorepoRoot, 'packages/protocol/build/contracts/')
  await spawnCmdWithExitOnFailure(
    myceloBinaryPath,
    ['genesis-from-config', tmpDir, '--buildpath', contractsBuildPath],
    {
      silent: !verbose,
      cwd: tmpDir,
    }
  )
  const genesis = fs.readFileSync(path.join(tmpDir, 'genesis.json')).toString()
  // Clean up the tmp dir as it's no longer needed
  await spawnCmd('rm', ['-rf', tmpDir], { silent: true })
  return genesis
}
