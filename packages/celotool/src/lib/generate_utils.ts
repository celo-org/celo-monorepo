import * as bls12377js from 'bls12377js'
import { ec as EC } from 'elliptic'
import { range, repeat } from 'lodash'
import rlp from 'rlp'
import Web3 from 'web3'
import { blsPrivateKeyToProcessedPrivateKey } from './bls_utils'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import {
  CONTRACT_OWNER_STORAGE_LOCATION,
  GETH_CONFIG_OLD,
  ISTANBUL_MIX_HASH,
  OG_ACCOUNTS,
  PROXY_CONTRACT_CODE,
  REGISTRY_ADDRESS,
  TEMPLATE,
} from './genesis_constants'
import { ensure0x, strip0x } from './utils'

import bip32 = require('bip32')
import bip39 = require('bip39')
const ec = new EC('secp256k1')

export enum AccountType {
  VALIDATOR = 0,
  LOAD_TESTING_ACCOUNT = 1,
  TX_NODE = 2,
  BOOTNODE = 3,
  FAUCET = 4,
}

export enum ConsensusType {
  CLIQUE = 'clique',
  ISTANBUL = 'istanbul',
}

export interface Validator {
  address: string
  blsPublicKey: string
}

export const MNEMONIC_ACCOUNT_TYPE_CHOICES = [
  'validator',
  'load_testing',
  'tx_node',
  'bootnode',
  'faucet',
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
  const seed = bip39.mnemonicToSeed(mnemonic)
  const node = bip32.fromSeed(seed)
  const newNode = node.derive(accountType).derive(index)

  return newNode.privateKey.toString('hex')
}

export const privateKeyToPublicKey = (privateKey: string) => {
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

const DEFAULT_BALANCE = '1000000000000000000000000'
const VALIDATOR_OG_SOURCE = 'og'

export const getPrivateKeysFor = (accountType: AccountType, mnemonic: string, n: number) =>
  range(0, n).map((i) => generatePrivateKey(mnemonic, accountType, i))

export const getAddressesFor = (accountType: AccountType, mnemonic: string, n: number) =>
  getPrivateKeysFor(accountType, mnemonic, n).map(privateKeyToAddress)

export const getStrippedAddressesFor = (accountType: AccountType, mnemonic: string, n: number) =>
  getAddressesFor(accountType, mnemonic, n).map(strip0x)

export const getValidators = (mnemonic: string, n: number) => {
  return range(0, n)
    .map((i) => generatePrivateKey(mnemonic, AccountType.VALIDATOR, i))
    .map((key) => {
      const blsKeyBytes = blsPrivateKeyToProcessedPrivateKey(key)
      return {
        address: privateKeyToAddress(key).slice(2),
        blsPublicKey: bls12377js.BLS.privateToPublicBytes(blsKeyBytes).toString('hex'),
      }
    })
}

export const generateGenesisFromEnv = (enablePetersburg: boolean = true) => {
  const validatorEnv = fetchEnv(envVar.VALIDATORS)
  const validators =
    validatorEnv === VALIDATOR_OG_SOURCE
      ? OG_ACCOUNTS.map((account) => {
          const blsKeyBytes = blsPrivateKeyToProcessedPrivateKey(account.privateKey)
          return {
            address: account.address,
            blsPublicKey: bls12377js.BLS.privateToPublicBytes(blsKeyBytes).toString('hex'),
          }
        })
      : getValidators(fetchEnv(envVar.MNEMONIC), parseInt(validatorEnv, 10))

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
  const chainId = parseInt(fetchEnv(envVar.NETWORK_ID), 10)

  return generateGenesis({
    validators,
    consensusType,
    blockTime,
    epoch,
    chainId,
    requestTimeout,
    enablePetersburg,
  })
}

const generateIstanbulExtraData = (validators: Validator[]) => {
  const istanbulVanity = 32
  const blsSignatureVanity = 192

  return (
    '0x' +
    repeat('0', istanbulVanity * 2) +
    rlp
      // @ts-ignore
      .encode([
        validators.map((validator) => Buffer.from(validator.address, 'hex')),
        validators.map((validator) => Buffer.from(validator.blsPublicKey, 'hex')),
        new Buffer(0),
        Buffer.from(repeat('0', blsSignatureVanity * 2), 'hex'),
        new Buffer(0),
        Buffer.from(repeat('0', blsSignatureVanity * 2), 'hex'),
        new Buffer(0),
      ])
      .toString('hex')
  )
}

export const generateGenesis = ({
  validators,
  consensusType = ConsensusType.ISTANBUL,
  blockTime,
  epoch,
  chainId,
  requestTimeout,
  enablePetersburg = true,
}: {
  validators: Validator[]
  consensusType?: ConsensusType
  blockTime: number
  epoch: number
  chainId: number
  requestTimeout: number
  enablePetersburg?: boolean
}) => {
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
    genesis.extraData = generateIstanbulExtraData(validators)
    genesis.config.istanbul = {
      policy: 0,
      period: blockTime,
      requesttimeout: requestTimeout,
      epoch,
    }
  }

  for (const validator of validators) {
    genesis.alloc[validator.address] = {
      balance: DEFAULT_BALANCE,
    }
  }

  const contracts = [REGISTRY_ADDRESS]
  for (const contract of contracts) {
    genesis.alloc[contract] = {
      code: PROXY_CONTRACT_CODE,
      storage: {
        [CONTRACT_OWNER_STORAGE_LOCATION]: validators[0].address,
      },
      balance: '0',
    }
  }

  return JSON.stringify(genesis)
}
