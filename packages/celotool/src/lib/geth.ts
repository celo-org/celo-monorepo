/* tslint:disable: no-console */
import { CeloContract, ContractKit, newKit } from '@celo/contractkit'
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result'
import { waitForPortOpen } from '@celo/dev-utils/lib/network'
import {
  convertToContractDecimals,
  GoldToken,
  sendTransaction,
  StableToken,
  unlockAccount,
} from '@celo/walletkit'
import { GoldToken as GoldTokenType } from '@celo/walletkit/types/GoldToken'
import { StableToken as StableTokenType } from '@celo/walletkit/types/StableToken'
import BigNumber from 'bignumber.js'
import { spawn } from 'child_process'
import fs from 'fs'
import { range } from 'lodash'
import fetch from 'node-fetch'
import path from 'path'
import sleep from 'sleep-promise'
import Web3Type from 'web3'
import { Admin } from 'web3-eth-admin'
import { TransactionReceipt } from 'web3/types'
import { envVar, fetchEnv, isVmBased } from './env-utils'
import {
  AccountType,
  generateGenesis,
  generatePrivateKey,
  privateKeyToPublicKey,
  Validator,
} from './generate_utils'
import { retrieveIPAddress } from './helm_deploy'
import { execCmd, execCmdWithExitOnFailure, spawnCmd, spawnCmdWithExitOnFailure } from './utils'
import { getTestnetOutputs } from './vm-testnet-utils'

type HandleErrorCallback = (isError: boolean, data: { location: string; error: string }) => void

export interface GethRunConfig {
  // migration
  migrate?: boolean
  migrateTo?: number
  migrationOverrides?: any
  keepData?: boolean
  // ??
  useBootnode?: boolean
  // genesis config
  genesisConfig?: any
  // network
  network: string
  networkId: number
  // where to run
  runPath: string
  verbosity?: number
  gethRepoPath: string
  // running instances
  instances: GethInstanceConfig[]
}

export interface GethInstanceConfig {
  gethRunConfig: GethRunConfig
  name: string
  validating?: boolean
  validatingGasPrice?: number
  syncmode: string
  port: number
  proxyport?: number
  rpcport?: number
  wsport?: number
  lightserv?: boolean
  privateKey?: string
  etherbase?: string
  peers?: string[]
  proxies?: Array<string[2]>
  pid?: number
  isProxied?: boolean
  isProxy?: boolean
  bootnodeEnode?: string
  proxy?: string
  proxiedValidatorAddress?: string
  ethstats?: string
}

const Web3 = require('web3')

const DEFAULT_TRANSFER_AMOUNT = new BigNumber('0.00000000000001')
const LOAD_TEST_TRANSFER_WEI = new BigNumber(10000)

const GETH_IPC = 'geth.ipc'
const DISCOVERY_PORT = 30303

const BLOCKSCOUT_TIMEOUT = 12000 // ~ 12 seconds needed to see the transaction in the blockscout

// for log messages which indicate that blockscout where not able to provide
// information about transaction in a "timely" (15s for now) manner
export const LOG_TAG_BLOCKSCOUT_TIMEOUT = 'blockscout_timeout'
// for log messages which show time (+- 150-200ms) needed for blockscout to
// fetch and publish information about transaction
export const LOG_TAG_BLOCKSCOUT_TIME_MEASUREMENT = 'blockscout_time_measurement'
// for log messages which show the error about validating transaction receipt
export const LOG_TAG_BLOCKSCOUT_VALIDATION_ERROR = 'validate_blockscout_error'
// for log messages which show the error occurred when fetching a contract address
export const LOG_TAG_CONTRACT_ADDRESS_ERROR = 'contract_address_error'
// for log messages which show the error while validating geth rpc response
export const LOG_TAG_GETH_RPC_ERROR = 'geth_rpc_error'
// for log messages which show the error occurred when the transaction has
// been sent
export const LOG_TAG_TRANSACTION_ERROR = 'transaction_error'
// message indicating that the tx hash has been received in callback within sendTransaction
export const LOG_TAG_TRANSACTION_HASH_RECEIVED = 'tx_hash_received'
// for log messages which show the error about validating transaction receipt
export const LOG_TAG_TRANSACTION_VALIDATION_ERROR = 'validate_transaction_error'
// for log messages which show time needed to receive the receipt after
// the transaction has been sent
export const LOG_TAG_TX_TIME_MEASUREMENT = 'tx_time_measurement'

const getTxNodeName = (namespace: string, id: number) => {
  return `${namespace}-gethtx${id}`
}

export const getEnodeAddress = (nodeId: string, ipAddress: string, port: number) => {
  return `enode://${nodeId}@${ipAddress}:${port}`
}

const getOGEnodesAddresses = async (namespace: string) => {
  const txNodesIds = [
    fetchEnv(envVar.GETHTX1_NODE_ID),
    fetchEnv(envVar.GETHTX2_NODE_ID),
    fetchEnv(envVar.GETHTX3_NODE_ID),
    fetchEnv(envVar.GETHTX4_NODE_ID),
  ]

  const enodes = []
  for (let id = 0; id < txNodesIds.length; id++) {
    const [ipAddress] = await execCmdWithExitOnFailure(
      `kubectl get service/${getTxNodeName(
        namespace,
        id + 1
      )} --namespace ${namespace} -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`
    )

    enodes.push(getEnodeAddress(txNodesIds[id], ipAddress, DISCOVERY_PORT))
  }

  return enodes
}

const getClusterNativeEnodes = async (namespace: string) => {
  return getEnodesWithIpAddresses(namespace, false)
}

const getExternalEnodeAddresses = async (namespace: string) => {
  // const usingStaticIps = fetchEnv(envVar.STATIC_IPS_FOR_GETH_NODES)
  // if (usingStaticIps === 'true') {
  //   return getBootnodeEnode(namespace)
  // }
  return getEnodesWithIpAddresses(namespace, true)
}

export const getBootnodeEnode = async (namespace: string) => {
  const ip = await retrieveIPAddress(`${namespace}-bootnode`)
  const privateKey = generatePrivateKey(fetchEnv(envVar.MNEMONIC), AccountType.BOOTNODE, 0)
  const nodeId = privateKeyToPublicKey(privateKey)
  return [getEnodeAddress(nodeId, ip, DISCOVERY_PORT)]
}

const retrieveTxNodeAddresses = async (namespace: string, txNodesNum: number) => {
  if (isVmBased()) {
    const outputs = await getTestnetOutputs(namespace)
    return outputs.tx_node_ip_addresses.value
  } else {
    const txNodesRange = range(0, txNodesNum)
    return Promise.all(txNodesRange.map((i) => retrieveIPAddress(`${namespace}-tx-nodes-${i}`)))
  }
}

const getEnodesWithIpAddresses = async (namespace: string, getExternalIP: boolean) => {
  const txNodesNum = parseInt(fetchEnv(envVar.TX_NODES), 10)
  const txAddresses = await retrieveTxNodeAddresses(namespace, txNodesNum)
  const txNodesRange = range(0, txNodesNum)
  return Promise.all(
    txNodesRange.map(async (index) => {
      const privateKey = generatePrivateKey(fetchEnv(envVar.MNEMONIC), AccountType.TX_NODE, index)
      const nodeId = privateKeyToPublicKey(privateKey)
      let address: string
      if (getExternalIP) {
        address = txAddresses[index]
      } else {
        address = (await execCmd(
          `kubectl get service/${namespace}-service-${index} --namespace ${namespace} -o jsonpath='{.spec.clusterIP}'`
        ))[0]
        if (address.length === 0) {
          console.error('IP address is empty for transaction node')
          throw new Error('IP address is empty for transaction node')
        }
      }
      return getEnodeAddress(nodeId, address, DISCOVERY_PORT)
    })
  )
}

export const getEnodesAddresses = async (namespace: string) => {
  const txNodes = fetchEnv(envVar.TX_NODES)
  if (txNodes === 'og') {
    return getOGEnodesAddresses(namespace)
  } else {
    return getClusterNativeEnodes(namespace)
  }
}

export const getEnodesWithExternalIPAddresses = async (namespace: string) => {
  const txNodes = fetchEnv(envVar.TX_NODES)
  if (txNodes === 'og') {
    return getOGEnodesAddresses(namespace)
  } else {
    return getExternalEnodeAddresses(namespace)
  }
}

export const fetchPassword = (passwordFile: string) => {
  if (!fs.existsSync(passwordFile)) {
    console.error(`Password file at ${passwordFile} does not exists!`)
    process.exit(1)
  }
  return fs.readFileSync(passwordFile).toString()
}

export const writeStaticNodes = (
  enodes: string[],
  outputDirPath: string,
  outputFileName: string,
  spacing: number = 2
) => {
  const encodedJSON = JSON.stringify(enodes, null, spacing)

  fs.writeFile(path.join(outputDirPath, outputFileName), encodedJSON, (err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
  })
}

export const checkGethStarted = (dataDir: string) => {
  if (!fs.existsSync(path.resolve(dataDir, GETH_IPC))) {
    console.error(`Looks like there are no local geth nodes running in ${dataDir}`)
    console.info(
      `Please, make sure you specified correct data directory, you could also run the geth node by "celotooljs geth run"`
    )
    process.exit(1)
  }
}

export const getWeb3AndTokensContracts = async () => {
  const web3Instance = new Web3('http://localhost:8545')
  const [goldTokenContact, stableTokenContact] = await Promise.all([
    GoldToken(web3Instance),
    StableToken(web3Instance),
  ])

  return {
    web3: web3Instance,
    goldToken: goldTokenContact,
    stableToken: stableTokenContact,
  }
}

export const getRandomInt = (from: number, to: number) => {
  return Math.floor(Math.random() * (to - from)) + from
}

const getRandomToken = (goldToken: GoldTokenType, stableToken: StableTokenType) => {
  const tokenType = getRandomInt(0, 2)
  if (tokenType === 0) {
    return goldToken
  } else {
    return stableToken
  }
}

const validateGethRPC = async (
  web3: Web3Type,
  txHash: string,
  from: string,
  handleError: HandleErrorCallback
) => {
  const transaction = await web3.eth.getTransaction(txHash)
  const txFrom = transaction.from.toLowerCase()
  const expectedFrom = from.toLowerCase()
  handleError(!transaction.from || expectedFrom !== txFrom, {
    location: '[GethRPC]',
    error: `Expected "from" to equal ${expectedFrom}, but found ${txFrom}`,
  })
}

const checkBlockscoutResponse = (
  json: any /* response */,
  txHash: string,
  from: string,
  handleError: HandleErrorCallback
) => {
  const location = '[Blockscout]'

  handleError(json.status !== '1', { location, error: `Invalid status: expected '1', received` })
  handleError(!json.result, { location, error: `No result found: receive ${json.status.result}` })
  const resultFrom = json.result.from.toLowerCase()
  const expectedFrom = from.toLowerCase()
  handleError(resultFrom !== expectedFrom, {
    location,
    error: `Expected "from" to equal ${expectedFrom}, but found ${resultFrom}`,
  })
  handleError(json.result.hash !== txHash, {
    location,
    error: `Expected "hash" to equal ${txHash}, but found ${json.result.hash}`,
  })
}

const fetchBlockscoutTxInfo = async (url: string, txHash: string) => {
  const response = await fetch(`${url}/api?module=transaction&action=gettxinfo&txhash=${txHash}`)
  return response.json()
}

const validateBlockscout = async (
  url: string,
  txHash: string,
  from: string,
  handleError: HandleErrorCallback
) => {
  const json = await fetchBlockscoutTxInfo(url, txHash)

  checkBlockscoutResponse(json, txHash, from, handleError)
}

// Maximal time given for blockscout to provide info about tx
// If the transaction does not appear in blockscout within 15 seconds,
// blockscout is considered to be not working in a timely manner
const MAXIMAL_BLOCKSCOUT_TIMEOUT = 15000

// Try to fetch info about transaction every 150 ms
const BLOCKSCOUT_FETCH_RETRY_TIME = 150

// within MAXIMAL_BLOCKSCOUT_TIMEOUT ms
const getFirstValidBlockscoutResponse = async (url: string, txHash: string) => {
  const attempts = MAXIMAL_BLOCKSCOUT_TIMEOUT / BLOCKSCOUT_FETCH_RETRY_TIME
  for (let attemptId = 0; attemptId < attempts; attemptId++) {
    const json = await fetchBlockscoutTxInfo(url, txHash)
    if (json.status !== '1') {
      await sleep(BLOCKSCOUT_FETCH_RETRY_TIME)
    } else {
      return [json, Date.now()]
    }
  }
  return [null, null]
}

const validateTransactionAndReceipt = (
  from: string,
  txReceipt: any,
  handleError: HandleErrorCallback
) => {
  const location = '[TX & Receipt]'

  handleError(!txReceipt, { location, error: 'No transaction receipt received!' })
  handleError(txReceipt.status !== true, {
    location,
    error: `Transaction receipt status (${txReceipt.status}) is not true!`,
  })
  handleError(txReceipt.from.toLowerCase() !== from.toLowerCase(), {
    location,
    error: `Transaction receipt from (${txReceipt.from}) is not equal to sender address (${from}).`,
  })
}

const tracerLog = (logMessage: any) => {
  console.log(JSON.stringify(logMessage))
}

const exitTracerTool = (logMessage: any) => {
  tracerLog(logMessage)
  process.exit(1)
}

const transferAndTrace = async (
  web3: Web3Type,
  goldToken: GoldTokenType,
  stableToken: StableTokenType,
  from: string,
  to: string,
  password: string,
  blockscoutUrl: string
) => {
  console.info('Transfer')

  const token = getRandomToken(goldToken, stableToken)
  const feeCurrencyToken = getRandomToken(goldToken, stableToken)

  const [tokenName, feeCurrencySymbol] = await Promise.all([
    token.methods.symbol().call(),
    feeCurrencyToken.methods.symbol().call(),
  ])

  const logMessage: any = {
    severity: 'CRITICAL',
    senderAddress: from,
    receiverAddress: to,
    blockscout: blockscoutUrl,
    token: tokenName,
    error: '',
    location: '',
    txHash: '',
  }

  const txParams: any = {}
  // Fill txParams below
  if (getRandomInt(0, 2) === 3) {
    txParams.feeCurrency = feeCurrencyToken._address
    logMessage.feeCurrency = feeCurrencySymbol
  }

  const transferToken = new Promise(async (resolve) => {
    await transferERC20Token(
      web3,
      token,
      from,
      to,
      DEFAULT_TRANSFER_AMOUNT,
      password,
      txParams,
      undefined,
      (receipt: any) => {
        resolve(receipt)
      },
      undefined,
      (error: any) => {
        logMessage.error = error
        exitTracerTool(logMessage)
      }
    )
  })

  const txReceipt: any = await transferToken
  const txHash = txReceipt ? txReceipt.transactionHash : ''

  // Need to wait for a bit to make sure that blockscout had enough time
  // to see the transaction and display it
  await sleep(BLOCKSCOUT_TIMEOUT)

  logMessage.txHash = txHash

  const handleError = (isError: boolean, data: { location: string; error: string }) => {
    if (isError) {
      exitTracerTool({ ...logMessage, ...data })
    }
  }

  validateTransactionAndReceipt(from, txReceipt!, handleError)
  await validateBlockscout(blockscoutUrl, txHash, from, handleError)
  await validateGethRPC(web3, txHash, from, handleError)
}

export const traceTransactions = async (
  web3: Web3Type,
  goldToken: GoldTokenType,
  stableToken: StableTokenType,
  addresses: string[],
  blockscoutUrl: string
) => {
  console.info('Starting simulation')

  await transferAndTrace(
    web3,
    goldToken,
    stableToken,
    addresses[0],
    addresses[1],
    '',
    blockscoutUrl
  )

  await transferAndTrace(
    web3,
    goldToken,
    stableToken,
    addresses[1],
    addresses[0],
    '',
    blockscoutUrl
  )

  console.info('Simulation finished successully!')
}

const measureBlockscout = async (
  blockscoutUrl: string,
  txHash: string,
  from: string,
  obtainReceiptTime: number,
  baseLogMessage: any
) => {
  const [json, receivedTime] = await getFirstValidBlockscoutResponse(blockscoutUrl, txHash)
  if (receivedTime === null) {
    tracerLog({
      tag: LOG_TAG_BLOCKSCOUT_TIMEOUT,
      ...baseLogMessage,
    })
  } else {
    tracerLog({
      tag: LOG_TAG_BLOCKSCOUT_TIME_MEASUREMENT,
      p_time: receivedTime - obtainReceiptTime,
      ...baseLogMessage,
    })
    checkBlockscoutResponse(json, txHash, from, (isError, data) => {
      if (isError) {
        tracerLog({
          tag: LOG_TAG_BLOCKSCOUT_VALIDATION_ERROR,
          ...data,
          ...baseLogMessage,
        })
      }
    })
  }
}

export const transferCeloGold = async (
  kit: ContractKit,
  fromAddress: string,
  toAddress: string,
  amount: BigNumber,
  txOptions: {
    gas?: number
    gasPrice?: string
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
  } = {}
) => {
  const kitGoldToken = await kit.contracts.getGoldToken()
  return kitGoldToken.transfer(toAddress, amount.toString()).send({
    from: fromAddress,
    gas: txOptions.gas,
    gasPrice: txOptions.gasPrice,
    feeCurrency: txOptions.feeCurrency,
    gatewayFeeRecipient: txOptions.gatewayFeeRecipient,
    gatewayFee: txOptions.gatewayFee,
  })
}

export const transferCeloDollars = async (
  kit: ContractKit,
  fromAddress: string,
  toAddress: string,
  amount: BigNumber,
  txOptions: {
    gas?: number
    gasPrice?: string
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
  } = {}
) => {
  const kitStableToken = await kit.contracts.getStableToken()
  return kitStableToken.transfer(toAddress, amount.toString()).send({
    from: fromAddress,
    gas: txOptions.gas,
    gasPrice: txOptions.gasPrice,
    feeCurrency: txOptions.feeCurrency,
    gatewayFeeRecipient: txOptions.gatewayFeeRecipient,
    gatewayFee: txOptions.gatewayFee,
  })
}

export const simulateClient = async (
  senderAddress: string,
  recipientAddress: string,
  txPeriodMs: number, // time between new transactions in ms
  blockscoutUrl: string,
  blockscoutMeasurePercent: number, // percent of time in range [0, 100] to measure blockscout for a tx
  index: number
) => {
  // Assume the node is accessible via localhost with senderAddress unlocked
  const kit = newKit('http://localhost:8545')
  kit.defaultAccount = senderAddress

  const baseLogMessage: any = {
    loadTestID: index,
    sender: senderAddress,
    recipient: recipientAddress,
    feeCurrency: '',
    txHash: '',
  }

  while (true) {
    const sendTransactionTime = Date.now()

    // randomly choose which token to use
    const transferGold = Boolean(Math.round(Math.random()))
    const transferFn = transferGold ? transferCeloGold : transferCeloDollars
    baseLogMessage.tokenName = transferGold ? 'cGLD' : 'cUSD'

    // randomly choose which gas currency to use
    const feeCurrencyGold = Boolean(Math.round(Math.random()))

    let feeCurrency
    if (!feeCurrencyGold) {
      try {
        feeCurrency = await kit.registry.addressFor(CeloContract.StableToken)
      } catch (error) {
        tracerLog({
          tag: LOG_TAG_CONTRACT_ADDRESS_ERROR,
          error: error.toString(),
          ...baseLogMessage,
        })
      }
    }
    baseLogMessage.feeCurrency = feeCurrency || ''

    // We purposely do not use await syntax so we sleep after sending the transaction,
    // not after processing a transaction's result
    transferFn(kit, senderAddress, recipientAddress, LOAD_TEST_TRANSFER_WEI, {
      feeCurrency,
    })
      .then(async (txResult: TransactionResult) => {
        await onLoadTestTxResult(
          kit,
          senderAddress,
          txResult,
          sendTransactionTime,
          baseLogMessage,
          blockscoutUrl,
          blockscoutMeasurePercent
        )
      })
      .catch((error: any) => {
        console.error('Load test transaction failed with error:', JSON.stringify(error))
        tracerLog({
          tag: LOG_TAG_TRANSACTION_ERROR,
          error: error.toString(),
          ...baseLogMessage,
        })
      })
    await sleep(txPeriodMs)
  }
}

export const onLoadTestTxResult = async (
  kit: ContractKit,
  senderAddress: string,
  txResult: TransactionResult,
  sendTransactionTime: number,
  baseLogMessage: any,
  blockscoutUrl: string,
  blockscoutMeasurePercent: number
) => {
  const txReceipt = await txResult.waitReceipt()
  const txHash = txReceipt.transactionHash
  baseLogMessage.txHash = txHash

  const receiptTime = Date.now()

  tracerLog({
    tag: LOG_TAG_TX_TIME_MEASUREMENT,
    p_time: receiptTime - sendTransactionTime,
    ...baseLogMessage,
  })

  // Continuing only with receipt received
  validateTransactionAndReceipt(senderAddress, txReceipt, (isError, data) => {
    if (isError) {
      tracerLog({
        tag: LOG_TAG_TRANSACTION_VALIDATION_ERROR,
        ...baseLogMessage,
        ...data,
      })
    }
  })

  if (Math.random() * 100 < blockscoutMeasurePercent) {
    await measureBlockscout(
      blockscoutUrl,
      txReceipt.transactionHash,
      senderAddress,
      receiptTime,
      baseLogMessage
    )
  }

  await validateGethRPC(kit.web3, txHash, senderAddress, (isError, data) => {
    if (isError) {
      tracerLog({
        tag: LOG_TAG_GETH_RPC_ERROR,
        ...data,
        ...baseLogMessage,
      })
    }
  })
}

export const transferERC20Token = async (
  web3: Web3Type,
  token: GoldTokenType | StableTokenType,
  from: string,
  to: string,
  amount: BigNumber,
  password: string,
  txParams: any = {},
  onTransactionHash?: (hash: string) => void,
  onReceipt?: (receipt: TransactionReceipt) => void,
  onConfirmation?: (confirmationNumber: number, receipt: TransactionReceipt) => void,
  onError?: (error: any) => void
) => {
  txParams.from = from
  await unlockAccount(web3, 0, password, from)

  const [convertedAmount, symbol] = await Promise.all([
    convertToContractDecimals(amount, token),
    token.methods.symbol().call(),
  ])

  await sendTransaction(
    `celotool/transfer-${symbol}`,
    `transfer ${symbol}`,
    token.methods.transfer(to, convertedAmount.toString()),
    txParams,
    onTransactionHash,
    onReceipt,
    onConfirmation,
    onError
  )
}

export const runGethNodes = async ({
  gethConfig,
  validators,
  validatorPrivateKeys,
  verbose,
}: {
  gethConfig: GethRunConfig
  validators: any[]
  validatorPrivateKeys: any
  verbose: boolean
}) => {
  const validatorsFilePath = `${gethConfig.runPath}/nodes.json`
  const validatorInstances = gethConfig.instances.filter((x: any) => x.validating)
  const validatorEnodes =
    validatorInstances.length > 0
      ? validatorPrivateKeys.map((x: any, i: number) => {
          return getEnodeAddress(privateKeyToPublicKey(x), '127.0.0.1', validatorInstances[i].port)
        })
      : []

  const gethBinaryPath = `${gethConfig.gethRepoPath}/build/bin/geth`

  if (!gethConfig.keepData && fs.existsSync(gethConfig.runPath)) {
    await resetDataDir(gethConfig.runPath, verbose)
  }

  if (!fs.existsSync(gethConfig.runPath)) {
    // @ts-ignore
    fs.mkdirSync(gethConfig.runPath, { recursive: true })
  }

  console.log(gethConfig.runPath)

  await writeGenesis(validators, gethConfig)

  console.log('eNodes', JSON.stringify(validatorEnodes, null, 2))

  console.log(validators.map((validator) => validator.address))
  fs.writeFileSync(validatorsFilePath, JSON.stringify(validatorEnodes), 'utf8')

  let validatorIndex = 0

  for (const instance of gethConfig.instances) {
    if (instance.validating) {
      // Automatically connect validator nodes to each other.
      const otherValidators = validatorEnodes.filter((_: string, i: number) => i !== validatorIndex)
      instance.peers = (instance.peers || []).concat(otherValidators)
      instance.privateKey = instance.privateKey || validatorPrivateKeys[validatorIndex]
      validatorIndex++
    }

    await initAndStartGeth(gethBinaryPath, instance, verbose)
  }
}

function getInstanceDir(instance: GethInstanceConfig) {
  return path.join(instance.gethRunConfig.runPath, instance.name)
}

function getSnapshotdir(instance: GethInstanceConfig) {
  return path.join(getInstanceDir(instance), 'snapshot')
}

export function importGenesis(genesisPath: string) {
  return JSON.parse(fs.readFileSync(genesisPath).toString())
}

function getDatadir(instance: GethInstanceConfig) {
  const dir = path.join(getInstanceDir(instance), 'datadir')
  // @ts-ignore
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * @returns Promise<number> the geth pid number
 */
export async function initAndStartGeth(
  gethBinaryPath: string,
  instance: GethInstanceConfig,
  verbose: boolean
) {
  const datadir = getDatadir(instance)

  console.info(`geth:${instance.name}: init datadir ${datadir}`)

  const genesisPath = path.join(instance.gethRunConfig.runPath, 'genesis.json')
  await init(gethBinaryPath, datadir, genesisPath, verbose)

  if (instance.privateKey) {
    await importPrivateKey(gethBinaryPath, instance, verbose)
  }

  if (instance.peers) {
    await addStaticPeers(datadir, instance.peers, verbose)
  }

  return startGeth(gethBinaryPath, instance, verbose)
}

export async function init(
  gethBinaryPath: string,
  datadir: string,
  genesisPath: string,
  verbose: boolean
) {
  if (verbose) {
    console.log('init geth')
  }

  await spawnCmdWithExitOnFailure('rm', ['-rf', datadir], { silent: !verbose })
  await spawnCmdWithExitOnFailure(gethBinaryPath, ['--datadir', datadir, 'init', genesisPath], {
    silent: !verbose,
  })
}

export async function importPrivateKey(
  gethBinaryPath: string,
  instance: GethInstanceConfig,
  verbose: boolean
) {
  const keyFile = path.join(getDatadir(instance), 'key.txt')

  fs.writeFileSync(keyFile, instance.privateKey, { flag: 'a' })

  if (verbose) {
    console.info(`geth:${instance.name}: import account`)
  }

  const args = [
    'account',
    'import',
    '--datadir',
    getDatadir(instance),
    '--password',
    '/dev/null',
    keyFile,
  ]

  if (verbose) {
    console.log(gethBinaryPath, ...args)
  }

  await spawnCmdWithExitOnFailure(gethBinaryPath, args, { silent: true })
}

export async function getEnode(peer: string, ws: boolean = false) {
  // do we have already an enode?
  if (peer.toLowerCase().startsWith('enode')) {
    // yes return peer
    return peer
  }

  // no, try to build it
  const p = ws ? 'ws' : 'http'
  const enodeRpcUrl = `${p}://localhost:${peer}`
  const admin = new Admin(enodeRpcUrl)

  let nodeInfo: any = {
    enode: null,
  }

  try {
    nodeInfo = await admin.getNodeInfo()
  } catch {
    console.error(`Unable to get node info from ${enodeRpcUrl}`)
  }

  return nodeInfo.enode
}

export async function addStaticPeers(datadir: string, peers: string[], verbose: boolean) {
  const staticPeersPath = `${datadir}/static-nodes.json`
  if (verbose || true) {
    console.log(`Writing static peers to ${staticPeersPath}`)
  }

  const enodes = await Promise.all(peers.map((peer) => getEnode(peer)))
  const enodesString = JSON.stringify(enodes, null, 2)
  fs.writeFileSync(staticPeersPath, enodesString)

  if (verbose || true) {
    console.log(enodesString)
  }
}

export async function addProxyPeer(gethBinaryPath: string, instance: GethInstanceConfig) {
  if (instance.proxies) {
    await spawnCmdWithExitOnFailure(gethBinaryPath, [
      '--datadir',
      getDatadir(instance),
      'attach',
      '--exec',
      `istanbul.addProxy('${instance.proxies[0]!}', '${instance.proxies[1]!}')`,
    ])
  }
}

export async function startGeth(
  gethBinaryPath: string,
  instance: GethInstanceConfig,
  verbose: boolean
) {
  if (verbose) {
    const instanceConfig = { ...instance }
    delete instanceConfig.gethRunConfig

    console.log('starting geth with config', JSON.stringify(instanceConfig, null, 2))
  }

  const datadir = getDatadir(instance)

  const {
    syncmode,
    port,
    rpcport,
    wsport,
    validating,
    validatingGasPrice,
    bootnodeEnode,
    isProxy,
    isProxied,
    proxyport,
    ethstats,
  } = instance

  const privateKey = instance.privateKey || ''
  const lightserv = instance.lightserv || false
  const etherbase = instance.etherbase || ''

  const gethArgs = [
    '--datadir',
    datadir,
    '--syncmode',
    syncmode,
    '--debug',
    '--port',
    port.toString(),
    '--rpcvhosts=*',
    '--networkid',
    instance.gethRunConfig.networkId.toString(),
    `--verbosity=${instance.gethRunConfig.verbosity ? instance.gethRunConfig.verbosity : '3'}`,
    '--consoleoutput=stdout', // Send all logs to stdout
    '--consoleformat=term',
    '--nat',
    'extip:127.0.0.1',
  ]

  if (rpcport) {
    gethArgs.push(
      '--rpc',
      '--rpcport',
      rpcport.toString(),
      '--rpccorsdomain=*',
      '--rpcapi=eth,net,web3,debug,admin,personal,txpool,istanbul'
    )
  }

  if (wsport) {
    gethArgs.push(
      '--wsorigins=*',
      '--ws',
      '--wsport',
      wsport.toString(),
      '--wsapi=eth,net,web3,debug,admin,personal'
    )
  }

  if (etherbase) {
    gethArgs.push('--etherbase', etherbase)
  }

  if (lightserv) {
    gethArgs.push('--lightserv=90')
  }

  if (validating) {
    gethArgs.push('--mine', '--minerthreads=10', `--nodekeyhex=${privateKey}`)

    if (validatingGasPrice) {
      gethArgs.push(`--miner.gasprice=${validatingGasPrice}`)
    }

    if (isProxied) {
      gethArgs.push('--proxy.proxied')
    }
  } else if (isProxy) {
    gethArgs.push('--proxy.proxy')
    if (proxyport) {
      gethArgs.push(`--proxy.internalendpoint=:${proxyport.toString()}`)
    }
    gethArgs.push(`--proxy.proxiedvalidatoraddress=${instance.proxiedValidatorAddress}`)
    // gethArgs.push(`--nodekeyhex=${privateKey}`)
  }

  if (bootnodeEnode) {
    gethArgs.push(`--bootnodes=${bootnodeEnode}`)
  } else {
    gethArgs.push('--nodiscover')
  }

  if (isProxied && instance.proxies) {
    gethArgs.push(`--proxy.proxyenodeurlpair=${instance.proxies[0]!};${instance.proxies[1]!}`)
  }

  if (privateKey) {
    gethArgs.push('--password=/dev/null', `--unlock=0`)
  }

  if (ethstats) {
    gethArgs.push(`--ethstats=${instance.name}@${ethstats}`, '--etherbase=0')
  }

  const gethProcess = spawnWithLog(gethBinaryPath, gethArgs, `${datadir}/logs.txt`, true)
  instance.pid = gethProcess.pid

  gethProcess.on('error', (err) => {
    throw new Error(`Geth crashed! Error: ${err}`)
  })

  const secondsToWait = 5

  // Give some time for geth to come up
  if (rpcport) {
    const isOpen = await waitForPortOpen('localhost', rpcport, secondsToWait)
    if (!isOpen) {
      console.error(
        `geth:${instance.name}: jsonRPC port didn't open after ${secondsToWait} seconds`
      )
      process.exit(1)
    } else {
      console.info(`geth:${instance.name}: jsonRPC port open ${rpcport}`)
    }
  }

  if (wsport) {
    const isOpen = await waitForPortOpen('localhost', wsport, secondsToWait)
    if (!isOpen) {
      console.error(`geth:${instance.name}: ws port didn't open after ${secondsToWait} seconds`)
      process.exit(1)
    } else {
      console.info(`geth:${instance.name}: ws port open ${wsport}`)
    }
  }

  return instance
}

export function writeGenesis(validators: Validator[], gethConfig: GethRunConfig) {
  const genesis: string = generateGenesis({
    validators,
    blockTime: 0,
    epoch: 10,
    lookback: 2,
    requestTimeout: 3000,
    chainId: gethConfig.networkId,
    ...gethConfig.genesisConfig,
  })

  const genesisPath = path.join(gethConfig.runPath, 'genesis.json')
  console.log('writing genesis')
  fs.writeFileSync(genesisPath, genesis)
  console.log(`wrote   genesis to ${genesisPath}`)
}

export async function snapshotDatadir(instance: GethInstanceConfig, verbose: boolean) {
  if (verbose) {
    console.log('snapshotting data dir')
  }

  // Sometimes the socket is still present, preventing us from snapshotting.
  await spawnCmd('rm', [`${getDatadir(instance)}/geth.ipc`], { silent: true })
  await spawnCmdWithExitOnFailure('cp', ['-r', getDatadir(instance), getSnapshotdir(instance)])
}

export async function restoreDatadir(instance: GethInstanceConfig) {
  const datadir = getDatadir(instance)
  const snapshotdir = getSnapshotdir(instance)

  console.info(`geth:${instance.name}: restore datadir: ${datadir}`)

  await spawnCmdWithExitOnFailure('rm', ['-rf', datadir], { silent: true })
  await spawnCmdWithExitOnFailure('cp', ['-r', snapshotdir, datadir], { silent: true })
}

export async function buildGeth(gethPath: string) {
  await spawnCmdWithExitOnFailure('make', ['geth'], { cwd: gethPath })
}

export async function resetDataDir(dataDir: string, verbose: boolean) {
  await spawnCmd('rm', ['-rf', dataDir], { silent: !verbose })
  await spawnCmd('mkdir', [dataDir], { silent: !verbose })
}

export async function checkoutGethRepo(branch: string, gethPath: string) {
  await spawnCmdWithExitOnFailure('rm', ['-rf', gethPath])
  await spawnCmdWithExitOnFailure('git', [
    'clone',
    '--depth',
    '1',
    'https://github.com/celo-org/celo-blockchain.git',
    gethPath,
    '-b',
    branch,
  ])
  await spawnCmdWithExitOnFailure('git', ['checkout', branch], { cwd: gethPath })
}

export function spawnWithLog(cmd: string, args: string[], logsFilepath: string, verbose: boolean) {
  try {
    fs.unlinkSync(logsFilepath)
  } catch (error) {
    // nothing to do
  }

  const logStream = fs.createWriteStream(logsFilepath, { flags: 'a' })

  if (verbose) {
    console.log(cmd, ...args)
  }

  const p = spawn(cmd, args)

  p.stdout.pipe(logStream)
  p.stderr.pipe(logStream)

  if (verbose) {
    p.stdout.pipe(process.stdout)
    p.stderr.pipe(process.stderr)
  }

  return p
}

// Add validator 0 as a peer of each other validator.
export async function connectValidatorPeers(gethConfig: GethRunConfig, verbose: boolean) {
  const admins = gethConfig.instances
    .filter(({ wsport, rpcport, validating }) => validating && (wsport || rpcport))
    .map(({ wsport, rpcport }) => {
      const url = `${wsport ? 'ws' : 'http'}://localhost:${wsport || rpcport}`
      if (verbose) {
        console.log(url)
      }
      return new Admin(url)
    })

  const enodes = await Promise.all(admins.map(async (admin) => (await admin.getNodeInfo()).enode))

  await Promise.all(
    admins.map(async (admin, i) => {
      await Promise.all(
        enodes.map(async (enode, j) => {
          if (i === j) {
            return
          }
          await admin.addPeer(enode)
        })
      )
    })
  )
}
