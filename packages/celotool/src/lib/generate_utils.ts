// @ts-ignore
import { blsPrivateKeyToProcessedPrivateKey } from '@celo/utils/lib/bls'
import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
import * as bls12377js from 'bls12377js'
import { ec as EC } from 'elliptic'
import fs from 'fs'
import { range, repeat } from 'lodash'
import path from 'path'
import * as rlp from 'rlp'
import Web3 from 'web3'
import { envVar, fetchEnv, fetchEnvOrFallback, monorepoRoot } from './env-utils'
import {
  CONTRACT_OWNER_STORAGE_LOCATION,
  GENESIS_MSG_HASH,
  GETH_CONFIG_OLD,
  ISTANBUL_MIX_HASH,
  REGISTRY_ADDRESS,
  TEMPLATE,
} from './genesis_constants'
import { GenesisConfig } from './interfaces/genesis-config'
import { ensure0x, strip0x } from './utils'

const ec = new EC('secp256k1')

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
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const node = bip32.fromSeed(seed)
  const newNode = node.derive(accountType).derive(index)

  return newNode.privateKey!.toString('hex')
}

export const generatePublicKey = (mnemonic: string, accountType: AccountType, index: number) => {
  return privateKeyToPublicKey(generatePrivateKey(mnemonic, accountType, index))
}

export const generateAddress = (mnemonic: string, accountType: AccountType, index: number) =>
  privateKeyToAddress(generatePrivateKey(mnemonic, accountType, index))

export const privateKeyToPublicKey = (privateKey: string): string => {
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

export const getFaucetedAccounts = (mnemonic: string) => {
  const numFaucetAccounts = parseInt(fetchEnvOrFallback(envVar.FAUCET_GENESIS_ACCOUNTS, '0'), 10)
  const faucetAccounts = getFaucetedAccountsFor(
    AccountType.FAUCET,
    mnemonic,
    numFaucetAccounts,
    faucetBalance()
  )

  const numLoadTestAccounts = parseInt(fetchEnvOrFallback(envVar.LOAD_TEST_CLIENTS, '0'), 10)
  const loadTestAccounts = getFaucetedAccountsFor(
    AccountType.LOAD_TESTING_ACCOUNT,
    mnemonic,
    numLoadTestAccounts,
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

export const generateGenesisFromEnv = (enablePetersburg: boolean = true) => {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const validatorEnv = fetchEnv(envVar.VALIDATORS)
  const genesisAccountsEnv = fetchEnvOrFallback(envVar.GENESIS_ACCOUNTS, '')
  const validators = getValidatorsInformation(mnemonic, parseInt(validatorEnv, 10))

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
}: GenesisConfig): string => {
  const genesis: any = { ...TEMPLATE }

  if (!enablePetersburg) {
    genesis.config = GETH_CONFIG_OLD
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

  return JSON.stringify(genesis, null, 2)
}
