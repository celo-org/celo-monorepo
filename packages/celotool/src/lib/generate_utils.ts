import {
  CONTRACT_ADDRESSES,
  CONTRACT_OWNER_STORAGE_LOCATION,
  GETH_CONFIG_OLD,
  ISTANBUL_MIX_HASH,
  OG_ACCOUNTS,
  PROXY_CONTRACT_CODE,
  TEMPLATE,
} from '@celo/celotool/src/lib/genesis_constants'
import {
  ensure0x,
  envVar,
  fetchEnv,
  fetchEnvOrFallback,
  strip0x,
} from '@celo/celotool/src/lib/utils'
import { ec as EC } from 'elliptic'
import { range, repeat } from 'lodash'
import rlp from 'rlp'
import Web3 from 'web3'

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

export const MNEMONIC_ACCOUNT_TYPE_CHOICES = [
  'validator',
  'load_testing',
  'tx_node',
  'bootnode',
  'faucet',
]

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

export const generatePublicKeyFromPrivateKey = (privateKey: string) => {
  const ecPrivateKey = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'))
  const ecPublicKey: string = ecPrivateKey.getPublic('hex')
  return ecPublicKey.slice(2)
}

export const generateAccountAddressFromPrivateKey = (privateKey: string) => {
  // @ts-ignore
  return new Web3.modules.Eth().accounts.privateKeyToAccount(ensure0x(privateKey)).address
}

const DEFAULT_BALANCE = '1000000000000000000000000'
const VALIDATOR_OG_SOURCE = 'og'

export const getValidatorsPrivateKeys = (mnemonic: string, n: number) => {
  return range(0, n).map((i) => generatePrivateKey(mnemonic, AccountType.VALIDATOR, i))
}

export const getValidators = (mnemonic: string, n: number) => {
  return range(0, n)
    .map((i) => generatePrivateKey(mnemonic, AccountType.VALIDATOR, i))
    .map(generateAccountAddressFromPrivateKey)
    .map(strip0x)
}

export const generateGenesisFromEnv = (enablePetersburg: boolean = true) => {
  const validatorEnv = fetchEnv(envVar.VALIDATORS)
  const validators =
    validatorEnv === VALIDATOR_OG_SOURCE
      ? OG_ACCOUNTS.map((account) => account.address)
      : getValidators(fetchEnv(envVar.MNEMONIC), parseInt(validatorEnv, 10))

  // @ts-ignore
  if (![ConsensusType.CLIQUE, ConsensusType.ISTANBUL].includes(fetchEnv(envVar.CONSENSUS_TYPE))) {
    console.error('Unsupported CONSENSUS_TYPE')
    process.exit(1)
  }

  // @ts-ignore
  const consensusType: ConsensusType = fetchEnv(envVar.CONSENSUS_TYPE)

  const contracts: string[] = fetchEnv(envVar.PREDEPLOYED_CONTRACTS)
    .split(',')
    // @ts-ignore
    .map((contract) => CONTRACT_ADDRESSES[contract])

  // @ts-ignore
  if (contracts.includes(undefined)) {
    console.error('Unsupported PREDEPLOYED_CONTRACTS value')
    process.exit(1)
  }

  const blockTime = parseInt(fetchEnv(envVar.BLOCK_TIME), 10)
  const epoch = parseInt(fetchEnvOrFallback(envVar.EPOCH, '30000'), 10)
  const chainId = parseInt(fetchEnv(envVar.NETWORK_ID), 10)

  return generateGenesis(
    validators,
    consensusType,
    contracts,
    blockTime,
    epoch,
    chainId,
    enablePetersburg
  )
}

const generateIstanbulExtraData = (validators: string[]) => {
  const istanbulVanity = 32
  const signatureVanity = 65

  return (
    '0x' +
    repeat('0', istanbulVanity * 2) +
    rlp
      // @ts-ignore
      .encode([
        validators.map((validator) => Buffer.from(validator, 'hex')),
        [],
        Buffer.from(repeat('0', signatureVanity * 2), 'hex'),
        [],
      ])
      .toString('hex')
  )
}

export const generateGenesis = (
  validators: string[],
  consensusType: ConsensusType,
  contracts: string[],
  blockTime: number,
  epoch: number,
  chainId: number,
  enablePetersburg: boolean = true
) => {
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
      epoch,
    }
  }

  for (const validator of validators) {
    genesis.alloc[validator] = {
      balance: DEFAULT_BALANCE,
    }
  }

  for (const contract of contracts) {
    genesis.alloc[contract] = {
      code: PROXY_CONTRACT_CODE,
      storage: {
        [CONTRACT_OWNER_STORAGE_LOCATION]: validators[0],
      },
      balance: '0',
    }
  }

  return JSON.stringify(genesis)
}
