// tslint:disable:no-console
// tslint:disable-next-line:no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3-celo.d.ts" />
import { CeloContract, ContractKit, newKit } from '@celo/contractkit'
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { waitForPortOpen } from '@celo/dev-utils/lib/network'
import BigNumber from 'bignumber.js'
import { spawn } from 'child_process'
import fs from 'fs'
import { merge, range } from 'lodash'
import fetch from 'node-fetch'
import path from 'path'
import sleep from 'sleep-promise'
import Web3 from 'web3'
import { TransactionReceipt } from 'web3-core'
import { Admin } from 'web3-eth-admin'
import { spawnCmd, spawnCmdWithExitOnFailure } from './cmd-utils'
import { convertToContractDecimals } from './contract-utils'
import { envVar, fetchEnv, isVmBased } from './env-utils'
import {
  AccountType,
  generateGenesis,
  generatePrivateKey,
  privateKeyToPublicKey,
  Validator,
} from './generate_utils'
import { retrieveClusterIPAddress, retrieveIPAddress } from './helm_deploy'
import { GethInstanceConfig } from './interfaces/geth-instance-config'
import { GethRunConfig } from './interfaces/geth-run-config'
import { ensure0x } from './utils'
import { getTestnetOutputs } from './vm-testnet-utils'

export async function unlockAccount(
  web3: Web3,
  duration: number,
  password: string,
  accountAddress: string | null = null
) {
  if (accountAddress === null) {
    const accounts = await web3.eth.getAccounts()
    accountAddress = accounts[0]
  }
  await web3.eth.personal.unlockAccount(accountAddress!, password, duration)
  return accountAddress!
}

type HandleErrorCallback = (isError: boolean, data: { location: string; error: string }) => void

const DEFAULT_TRANSFER_AMOUNT = new BigNumber('0.00000000000001')
const LOAD_TEST_TRANSFER_WEI = new BigNumber(10000)

const GETH_IPC = 'geth.ipc'
const DISCOVERY_PORT = 30303
const BOOTNODE_DISCOVERY_PORT = 30301

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

export const getEnodeAddress = (nodeId: string, ipAddress: string, port: number) => {
  return `enode://${nodeId}@${ipAddress}:${port}`
}

export const getBootnodeEnode = async (namespace: string) => {
  const ip = await retrieveBootnodeIPAddress(namespace)
  const privateKey = generatePrivateKey(fetchEnv(envVar.MNEMONIC), AccountType.BOOTNODE, 0)
  const nodeId = privateKeyToPublicKey(privateKey)
  return [getEnodeAddress(nodeId, ip, BOOTNODE_DISCOVERY_PORT)]
}

const retrieveBootnodeIPAddress = async (namespace: string) => {
  if (isVmBased()) {
    const outputs = await getTestnetOutputs(namespace)
    return outputs.bootnode_ip_address.value
  } else {
    const resourceName = `${namespace}-bootnode`
    if (fetchEnv(envVar.STATIC_IPS_FOR_GETH_NODES) === 'true') {
      return retrieveIPAddress(resourceName)
    } else {
      return retrieveClusterIPAddress('service', resourceName, namespace)
    }
  }
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
        address = await retrieveClusterIPAddress(
          'service',
          `${namespace}-service-${index}`,
          namespace
        )
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
  return getEnodesWithIpAddresses(namespace, false)
}

export const getEnodesWithExternalIPAddresses = async (namespace: string) => {
  return getEnodesWithIpAddresses(namespace, true)
}

export function getPrivateTxNodeClusterIP(celoEnv: string) {
  return retrieveClusterIPAddress('service', 'tx-nodes-private', celoEnv)
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
  const kit = newKit('http://localhost:8545')
  const [goldToken, stableToken] = await Promise.all([
    kit.contracts.getGoldToken(),
    kit.contracts.getStableToken(),
  ])

  return {
    kit,
    goldToken,
    stableToken,
  }
}

export const getRandomInt = (from: number, to: number) => {
  return Math.floor(Math.random() * (to - from)) + from
}

const getRandomToken = (goldToken: GoldTokenWrapper, stableToken: StableTokenWrapper) => {
  const tokenType = getRandomInt(0, 2)
  if (tokenType === 0) {
    return goldToken
  } else {
    return stableToken
  }
}

const validateGethRPC = async (
  kit: ContractKit,
  txHash: string,
  from: string,
  handleError: HandleErrorCallback
) => {
  const transaction = await kit.web3.eth.getTransaction(txHash)
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
  kit: ContractKit,
  goldToken: GoldTokenWrapper,
  stableToken: StableTokenWrapper,
  from: string,
  to: string,
  password: string,
  blockscoutUrl: string
) => {
  console.info('Transfer')

  const token = getRandomToken(goldToken, stableToken)
  const feeCurrencyToken = getRandomToken(goldToken, stableToken)

  const [tokenName, feeCurrencySymbol] = await Promise.all([
    token.symbol(),
    feeCurrencyToken.symbol(),
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
    txParams.feeCurrency = feeCurrencyToken.address
    logMessage.feeCurrency = feeCurrencySymbol
  }

  const transferToken = new Promise(async (resolve) => {
    await transferERC20Token(
      kit,
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
  await validateGethRPC(kit, txHash, from, handleError)
}

export const traceTransactions = async (
  kit: ContractKit,
  goldToken: GoldTokenWrapper,
  stableToken: StableTokenWrapper,
  addresses: string[],
  blockscoutUrl: string
) => {
  console.info('Starting simulation')

  await transferAndTrace(kit, goldToken, stableToken, addresses[0], addresses[1], '', blockscoutUrl)

  await transferAndTrace(kit, goldToken, stableToken, addresses[1], addresses[0], '', blockscoutUrl)

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

  await validateGethRPC(kit, txHash, senderAddress, (isError, data) => {
    if (isError) {
      tracerLog({
        tag: LOG_TAG_GETH_RPC_ERROR,
        ...data,
        ...baseLogMessage,
      })
    }
  })
}

/**
 * This method sends ERC20 tokens
 *
 * @param kit instance of the contract kit
 * @param token the token contract to use
 * @param from sender to send the token from
 * @param to receiver that gets the tokens
 * @param amount the amount of tokens to be sent
 * @param password the password of the account to use
 * @param txParams additional transaction parameters
 * @param onTransactionHash callback, fired when the transaction has is generated
 * @param onReceipt callback, fired when the receipt is returned
 * @param onError callback, fired in case of an error, containing the error
 */
export const transferERC20Token = async (
  kit: ContractKit,
  token: GoldTokenWrapper | StableTokenWrapper,
  from: string,
  to: string,
  amount: BigNumber,
  password: string,
  txParams: any = {},
  onTransactionHash?: (hash: string) => void,
  onReceipt?: (receipt: TransactionReceipt) => void,
  onError?: (error: any) => void
) => {
  txParams.from = from
  await unlockAccount(kit.web3, 0, password, from)

  const convertedAmount = await convertToContractDecimals(amount, token)

  try {
    const result = await token.transfer(to, convertedAmount.toString()).send()
    if (onTransactionHash) {
      onTransactionHash(await result.getHash())
    }
    if (onReceipt) {
      const receipt = await result.waitReceipt()
      onReceipt(receipt)
    }
  } catch (error) {
    if (onError) {
      onError(error)
    }
  }
}

export const runGethNodes = async ({
  gethConfig,
  validators,
  verbose,
}: {
  gethConfig: GethRunConfig
  validators: Validator[]
  verbose: boolean
}) => {
  const gethBinaryPath = path.join(gethConfig.gethRepoPath!, '/build/bin/geth')

  if (!fs.existsSync(gethBinaryPath)) {
    console.error(`Geth binary at ${gethBinaryPath} not found!`)
    return
  }

  if (!gethConfig.keepData && fs.existsSync(gethConfig.runPath)) {
    await resetDataDir(gethConfig.runPath, verbose)
  }

  if (!fs.existsSync(gethConfig.runPath)) {
    // @ts-ignore
    fs.mkdirSync(gethConfig.runPath, { recursive: true })
  }

  await writeGenesis(gethConfig, validators, verbose)

  if (verbose) {
    const validatorAddresses = validators.map((validator) => validator.address)
    console.log('Validators', JSON.stringify(validatorAddresses, null, 2))
  }

  for (const instance of gethConfig.instances) {
    await initAndStartGeth(gethConfig, gethBinaryPath, instance, verbose)
  }

  await connectValidatorPeers(gethConfig.instances)
}

function getInstanceDir(runPath: string, instance: GethInstanceConfig) {
  return path.join(runPath, instance.name)
}

function getSnapshotdir(runPath: string, instance: GethInstanceConfig) {
  return path.join(getInstanceDir(runPath, instance), 'snapshot')
}

export function importGenesis(genesisPath: string) {
  return JSON.parse(fs.readFileSync(genesisPath).toString())
}

export function getLogFilename(runPath: string, instance: GethInstanceConfig) {
  return path.join(getDatadir(runPath, instance), 'logs.txt')
}

function getDatadir(runPath: string, instance: GethInstanceConfig) {
  const dir = path.join(getInstanceDir(runPath, instance), 'datadir')
  // @ts-ignore
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * @returns Promise<number> the geth pid number
 */
export async function initAndStartGeth(
  gethConfig: GethRunConfig,
  gethBinaryPath: string,
  instance: GethInstanceConfig,
  verbose: boolean
) {
  const datadir = getDatadir(gethConfig.runPath, instance)

  if (verbose) {
    console.info(`geth:${instance.name}: init datadir ${datadir}`)
  }

  const genesisPath = path.join(gethConfig.runPath, 'genesis.json')
  await init(gethBinaryPath, datadir, genesisPath, verbose)

  if (instance.privateKey) {
    await importPrivateKey(gethConfig, gethBinaryPath, instance, verbose)
  }

  return startGeth(gethConfig, gethBinaryPath, instance, verbose)
}

export async function init(
  gethBinaryPath: string,
  datadir: string,
  genesisPath: string,
  verbose: boolean
) {
  if (verbose) {
    console.log(`init geth with genesis at ${genesisPath}`)
  }

  await spawnCmdWithExitOnFailure('rm', ['-rf', datadir], { silent: !verbose })
  await spawnCmdWithExitOnFailure(gethBinaryPath, ['--datadir', datadir, 'init', genesisPath], {
    silent: !verbose,
  })
}

export async function importPrivateKey(
  getConfig: GethRunConfig,
  gethBinaryPath: string,
  instance: GethInstanceConfig,
  verbose: boolean
) {
  const keyFile = path.join(getDatadir(getConfig.runPath, instance), 'key.txt')

  fs.writeFileSync(keyFile, instance.privateKey, { flag: 'a' })

  if (verbose) {
    console.info(`geth:${instance.name}: import account`)
  }

  const args = [
    'account',
    'import',
    '--datadir',
    getDatadir(getConfig.runPath, instance),
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
  const staticPeersPath = path.join(datadir, 'static-nodes.json')
  if (verbose) {
    console.log(`Writing static peers to ${staticPeersPath}`)
  }

  const enodes = await Promise.all(peers.map((peer) => getEnode(peer)))
  const enodesString = JSON.stringify(enodes, null, 2)

  if (verbose) {
    console.log('eNodes', enodesString)
  }

  fs.writeFileSync(staticPeersPath, enodesString)
}

export async function addProxyPeer(
  runPath: string,
  gethBinaryPath: string,
  instance: GethInstanceConfig
) {
  if (instance.proxies) {
    await spawnCmdWithExitOnFailure(gethBinaryPath, [
      '--datadir',
      getDatadir(runPath, instance),
      'attach',
      '--exec',
      `istanbul.addProxy('${instance.proxies[0]!}', '${instance.proxies[1]!}')`,
    ])
  }
}

export async function startGeth(
  gethConfig: GethRunConfig,
  gethBinaryPath: string,
  instance: GethInstanceConfig,
  verbose: boolean
) {
  if (verbose) {
    console.log('starting geth with config', JSON.stringify(instance, null, 2))
  } else {
    console.log(`${instance.name}: starting.`)
  }

  const datadir = getDatadir(gethConfig.runPath, instance)

  const {
    syncmode,
    port,
    rpcport,
    wsport,
    validating,
    replica,
    validatingGasPrice,
    bootnodeEnode,
    isProxy,
    proxyAllowPrivateIp,
    isProxied,
    proxyport,
    ethstats,
    gatewayFee,
  } = instance

  const privateKey = instance.privateKey || ''
  const lightserv = instance.lightserv || false
  const etherbase = instance.etherbase || ''
  const verbosity = gethConfig.verbosity ? gethConfig.verbosity : '3'
  let blocktime: number = 1

  if (
    gethConfig.genesisConfig &&
    gethConfig.genesisConfig.blockTime !== undefined &&
    gethConfig.genesisConfig.blockTime >= 0
  ) {
    blocktime = gethConfig.genesisConfig.blockTime
  }

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
    gethConfig.networkId.toString(),
    `--verbosity=${verbosity}`,
    '--consoleoutput=stdout', // Send all logs to stdout
    '--consoleformat=term',
    '--nat',
    'extip:127.0.0.1',
    '--allow-insecure-unlock', // geth1.9 to use http w/unlocking
    '--gcmode=archive', // Needed to retrieve historical state
    '--istanbul.blockperiod',
    blocktime.toString(),
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
      '--wsapi=eth,net,web3,debug,admin,personal,txpool,istanbul'
    )
  }

  if (etherbase) {
    gethArgs.push('--etherbase', etherbase)
  }

  if (lightserv) {
    gethArgs.push('--light.serve=90')
    gethArgs.push('--light.maxpeers=10')
  } else if (syncmode === 'full' || syncmode === 'fast') {
    gethArgs.push('--light.serve=0')
  }

  if (gatewayFee) {
    gethArgs.push(`--light.gatewayfee=${gatewayFee.toString()}`)
  }

  if (validating) {
    gethArgs.push('--mine', '--minerthreads=10')
    if (!replica) {
      gethArgs.push(`--nodekeyhex=${privateKey}`)
    }

    if (validatingGasPrice) {
      gethArgs.push(`--miner.gasprice=${validatingGasPrice}`)
    }

    if (isProxied) {
      gethArgs.push('--proxy.proxied')
    }
    if (replica) {
      gethArgs.push('--istanbul.replica')
    }
  } else if (isProxy) {
    gethArgs.push('--proxy.proxy')
    if (proxyport) {
      gethArgs.push(`--proxy.internalendpoint=:${proxyport.toString()}`)
    }
    gethArgs.push(`--proxy.proxiedvalidatoraddress=${instance.proxiedValidatorAddress}`)
    gethArgs.push(`--nodekeyhex=${privateKey}`)
  }

  if (bootnodeEnode) {
    gethArgs.push(`--bootnodes=${bootnodeEnode}`)
  } else {
    gethArgs.push('--nodiscover')
  }

  if (isProxied && instance.proxies) {
    if (proxyAllowPrivateIp) {
      gethArgs.push('--proxy.allowprivateip=true')
    }
    gethArgs.push(`--proxy.proxyenodeurlpairs=${instance.proxies[0]!};${instance.proxies[1]!}`)
  }

  if (privateKey || ethstats) {
    gethArgs.push('--password=/dev/null', `--unlock=0`)
  }

  if (ethstats) {
    gethArgs.push(`--ethstats=${instance.name}@${ethstats}`, '--etherbase=0')
  }

  const gethProcess = spawnWithLog(gethBinaryPath, gethArgs, `${datadir}/logs.txt`, verbose)
  instance.pid = gethProcess.pid

  gethProcess.on('error', (err) => {
    throw new Error(`Geth crashed! Error: ${err}`)
  })

  const secondsToWait = 30

  // Give some time for geth to come up
  if (rpcport) {
    const isOpen = await waitForPortOpen('localhost', rpcport, secondsToWait)
    if (!isOpen) {
      console.error(
        `geth:${instance.name}: jsonRPC port ${rpcport} didn't open after ${secondsToWait} seconds`
      )
      process.exit(1)
    } else if (verbose) {
      console.info(`geth:${instance.name}: jsonRPC port open ${rpcport}`)
    }
  }

  if (wsport) {
    const isOpen = await waitForPortOpen('localhost', wsport, secondsToWait)
    if (!isOpen) {
      console.error(
        `geth:${instance.name}: ws port ${wsport} didn't open after ${secondsToWait} seconds`
      )
      process.exit(1)
    } else if (verbose) {
      console.info(`geth:${instance.name}: ws port open ${wsport}`)
    }
  }

  console.log(
    `${instance.name}: running.`,
    rpcport ? `RPC: ${rpcport}` : '',
    wsport ? `WS: ${wsport}` : '',
    proxyport ? `PROXY: ${proxyport}` : ''
  )

  return instance
}

export function writeGenesis(gethConfig: GethRunConfig, validators: Validator[], verbose: boolean) {
  const genesis: string = generateGenesis({
    validators,
    epoch: 10,
    lookbackwindow: 2,
    requestTimeout: 3000,
    chainId: gethConfig.networkId,
    ...gethConfig.genesisConfig,
  })

  const genesisPath = path.join(gethConfig.runPath, 'genesis.json')

  if (verbose) {
    console.log('writing genesis')
  }

  fs.writeFileSync(genesisPath, genesis)

  if (verbose) {
    console.log(`wrote   genesis to ${genesisPath}`)
  }
}

export async function snapshotDatadir(
  runPath: string,
  instance: GethInstanceConfig,
  verbose: boolean
) {
  if (verbose) {
    console.log('snapshotting data dir')
  }

  // Sometimes the socket is still present, preventing us from snapshotting.
  await spawnCmd('rm', [`${getDatadir(runPath, instance)}/geth.ipc`], { silent: true })
  await spawnCmdWithExitOnFailure('cp', [
    '-r',
    getDatadir(runPath, instance),
    getSnapshotdir(runPath, instance),
  ])
}

export async function restoreDatadir(runPath: string, instance: GethInstanceConfig) {
  const datadir = getDatadir(runPath, instance)
  const snapshotdir = getSnapshotdir(runPath, instance)

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

export async function connectPeers(instances: GethInstanceConfig[], verbose: boolean = false) {
  const admins = instances.map(({ wsport, rpcport }) => {
    return new Admin(`${rpcport ? 'http' : 'ws'}://localhost:${rpcport || wsport}`)
  })

  await Promise.all(
    admins.map(async (admin, i) => {
      const enodes = await Promise.all(admins.map(async (a) => (await a.getNodeInfo()).enode))
      await Promise.all(
        enodes.map(async (enode, j) => {
          if (i === j) {
            return
          }
          if (verbose) {
            console.log(
              `connecting ${instances[i].name} with ${instances[j].name} using enode ${enode}`
            )
          }
          const success = await admin.addPeer(enode)
          if (!success) {
            throw new Error('Connecting validators failed!')
          }
        })
      )
    })
  )
}

// Add validator 0 as a peer of each other validator.
export async function connectValidatorPeers(instances: GethInstanceConfig[]) {
  await connectPeers(
    instances.filter(({ wsport, rpcport, validating, isProxy, isProxied }) => ((validating && !isProxied) || isProxy)  && (wsport || rpcport))
  )
}

export async function migrateContracts(
  monorepoRoot: string,
  validatorPrivateKeys: string[],
  attestationKeys: string[],
  validators: string[],
  to: number = 1000,
  overrides: any = {},
  verbose: boolean = true
) {
  const migrationOverrides = merge(
    {
      stableToken: {
        initialBalances: {
          addresses: validators.map(ensure0x),
          values: validators.map(() => '10000000000000000000000'),
        },
        oracles: validators.map(ensure0x),
      },
      validators: {
        validatorKeys: validatorPrivateKeys.map(ensure0x),
        attestationKeys: attestationKeys.map(ensure0x),
      },
    },
    overrides
  )

  const args = [
    '--cwd',
    `${monorepoRoot}/packages/protocol`,
    'init-network',
    '-n',
    'testing',
    '-m',
    JSON.stringify(migrationOverrides),
    '-t',
    to.toString(),
  ]

  await spawnCmdWithExitOnFailure('yarn', args, { silent: !verbose })
}
