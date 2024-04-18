/* eslint-disable no-console */
import { CeloTxReceipt, TransactionResult } from '@celo/connect'
import { CeloContract, ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import BigNumber from 'bignumber.js'
import { spawn } from 'child_process'
import { randomBytes } from 'crypto'
import fs from 'fs'
import { merge, range } from 'lodash'
import fetch from 'node-fetch'
import path from 'path'
import sleep from 'sleep-promise'
import Web3 from 'web3'
import { Admin } from 'web3-eth-admin'
import { numberToHex } from 'web3-utils'
import { spawnCmd, spawnCmdWithExitOnFailure } from './cmd-utils'
import { convertToContractDecimals } from './contract-utils'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import {
  AccountType,
  Validator,
  generateGenesis,
  generateGenesisWithMigrations,
  generatePrivateKey,
  privateKeyToAddress,
  privateKeyToPublicKey,
} from './generate_utils'
import { retrieveClusterIPAddress, retrieveIPAddress } from './helm_deploy'
import { GethInstanceConfig } from './interfaces/geth-instance-config'
import { GethRunConfig } from './interfaces/geth-run-config'
import { waitForPortOpen } from './port-utils'
import { ensure0x } from './utils'

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
// max number of threads used for load testing
export const MAX_LOADTEST_THREAD_COUNT = 10000

export const getEnodeAddress = (nodeId: string, ipAddress: string, port: number) => {
  return `enode://${nodeId}@${ipAddress}:${port}`
}

export const getBootnodeEnode = async (namespace: string) => {
  const ip = await retrieveBootnodeIPAddress(namespace)
  const privateKey = generatePrivateKey(fetchEnv(envVar.MNEMONIC), AccountType.BOOTNODE, 0)
  const nodeId = privateKeyToPublicKey(privateKey)
  return [getEnodeAddress(nodeId, ip, BOOTNODE_DISCOVERY_PORT)]
}

export const retrieveBootnodeIPAddress = async (namespace: string) => {
  // Baklava bootnode address comes from VM and has an different name (not possible to update name after creation)
  const resourceName =
    namespace === 'baklava' ? `${namespace}-bootnode-address` : `${namespace}-bootnode`
  if (fetchEnv(envVar.STATIC_IPS_FOR_GETH_NODES) === 'true') {
    return retrieveIPAddress(resourceName)
  } else {
    return retrieveClusterIPAddress('service', resourceName, namespace)
  }
}

const retrieveTxNodeAddresses = async (namespace: string, txNodesNum: number) => {
  const txNodesRange = range(0, txNodesNum)
  return Promise.all(txNodesRange.map((i) => retrieveIPAddress(`${namespace}-tx-nodes-${i}`)))
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
  const kit = newKitFromWeb3(new Web3('http://localhost:8545'))
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
  const transaction = await kit.connection.getTransaction(txHash)
  handleError(!transaction || !transaction.from, {
    location: '[GethRPC]',
    error: `Contractkit did not return a valid transaction`,
  })
  if (transaction == null) {
    return
  }
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
  return response.json() as any
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
  console.info(JSON.stringify(logMessage))
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

export const transferCalldata = async (
  kit: ContractKit,
  fromAddress: string,
  toAddress: string,
  amount: BigNumber,
  dataStr?: string,
  txOptions: {
    chainId?: number
    gas?: number
    gasPrice?: string
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
    nonce?: number
  } = {}
) => {
  return kit.sendTransaction({
    from: fromAddress,
    to: toAddress,
    chainId: numberToHex(txOptions.chainId || 0),
    value: amount.toString(),
    data: dataStr,
    gas: txOptions.gas,
    gasPrice: txOptions.gasPrice,
    gatewayFeeRecipient: txOptions.gatewayFeeRecipient,
    gatewayFee: txOptions.gatewayFee,
    nonce: txOptions.nonce,
  })
}

// Reference: https://celoscan.io/tx/0x88928b2abfcfb915077341087defc4ba345ce771ed6190bc9d21f34fdc1d34e1
export const transferOrdinals = async (
  kit: ContractKit,
  fromAddress: string,
  toAddress: string,
  amount: BigNumber,
  dataStr?: string,
  txOptions: {
    chainId?: number
    gas?: number
    gasPrice?: string
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
    nonce?: number
  } = {}
) => {
  return kit.connection.sendTransaction({
    from: fromAddress,
    to: fromAddress,
    value: '0',
    chainId: numberToHex(txOptions.chainId || 0),
    data: Buffer.from('data:,{"p":"cls-20","op":"mint","tick":"cels","amt":"100000000"}').toString(
      'hex'
    ),
    gas: '40000',
    maxFeePerGas: Web3.utils.toWei('5', 'gwei'),
    maxPriorityFeePerGas: '1',
    nonce: txOptions.nonce,
  })
}

export const transferCeloGold = async (
  kit: ContractKit,
  fromAddress: string,
  toAddress: string,
  amount: BigNumber,
  _?: string,
  txOptions: {
    chainId?: number
    gas?: number
    gasPrice?: string
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
    nonce?: number
  } = {}
) => {
  const kitGoldToken = await kit.contracts.getGoldToken()
  return kitGoldToken.transfer(toAddress, amount.toString()).send({
    from: fromAddress,
    chainId: numberToHex(txOptions.chainId || 0),
    gas: txOptions.gas,
    gasPrice: txOptions.gasPrice,
    feeCurrency: txOptions.feeCurrency || undefined,
    gatewayFeeRecipient: txOptions.gatewayFeeRecipient,
    gatewayFee: txOptions.gatewayFee,
    nonce: txOptions.nonce,
  })
}

export const transferCeloDollars = async (
  kit: ContractKit,
  fromAddress: string,
  toAddress: string,
  amount: BigNumber,
  _?: string,
  txOptions: {
    chainId?: number
    gas?: number
    gasPrice?: string
    feeCurrency?: string
    gatewayFeeRecipient?: string
    gatewayFee?: string
    nonce?: number
  } = {}
) => {
  const kitStableToken = await kit.contracts.getStableToken()
  return kitStableToken.transfer(toAddress, amount.toString()).send({
    from: fromAddress,
    chainId: numberToHex(txOptions.chainId || 0),
    gas: txOptions.gas,
    gasPrice: txOptions.gasPrice,
    feeCurrency: txOptions.feeCurrency || undefined,
    gatewayFeeRecipient: txOptions.gatewayFeeRecipient,
    gatewayFee: txOptions.gatewayFee,
    nonce: txOptions.nonce,
  })
}

export const unlock = async (
  kit: ContractKit,
  address: string,
  password: string,
  unlockPeriod: number
) => {
  try {
    await kit.web3.eth.personal.unlockAccount(address, password, unlockPeriod)
  } catch (error) {
    console.error(`Unlock account ${address} failed:`, error)
  }
}

export enum TestMode {
  Mixed = 'mixed',
  Data = 'data',
  Transfer = 'transfer',
  StableTransfer = 'stable_transfer',
  ContractCall = 'contract_call',
  Ordinals = 'ordinals',
}

export const simulateClient = async (
  senderPK: string,
  recipientAddress: string,
  contractAddress: string,
  contractData: string,
  txPeriodMs: number, // time between new transactions in ms
  blockscoutUrl: string,
  blockscoutMeasurePercent: number, // percent of time in range [0, 100] to measure blockscout for a tx
  index: number,
  testMode: TestMode,
  thread: number,
  maxGasPrice: BigNumber = new BigNumber(0),
  totalTxGas: number = 500000, // aim for half million gas txs
  web3Provider: string = 'http://127.0.0.1:8545',
  chainId: number = 42220
) => {
  // Assume the node is accessible via localhost with senderAddress unlocked
  const kit = newKitFromWeb3(new Web3(web3Provider))

  let lastNonce: number = -1
  let lastTx: string = ''
  let lastGasPriceMinimum: BigNumber = new BigNumber(0)
  let nonce: number = 0
  let recipientAddressFinal: string = recipientAddress
  const useRandomRecipient = fetchEnvOrFallback(envVar.LOAD_TEST_USE_RANDOM_RECIPIENT, 'false')

  kit.connection.addAccount(senderPK)
  kit.defaultAccount = privateKeyToAddress(senderPK)

  const sleepTime = 5000
  while (await kit.connection.isSyncing()) {
    console.info(
      `LoadTestId ${index} waiting for web3Provider to be synced. Sleeping ${sleepTime}ms`
    )
    await sleep(sleepTime)
  }
  kit.addAccount(senderPK)
  kit.defaultAccount = privateKeyToAddress(senderPK)
  kit.connection.addAccount(senderPK)
  kit.connection.defaultAccount = privateKeyToAddress(senderPK)

  // sleep a random amount of time in the range [0, txPeriodMs) before starting so
  // that if multiple simulations are started at the same time, they don't all
  // submit transactions at the same time
  const randomSleep = Math.random() * txPeriodMs
  console.info(`Sleeping for ${randomSleep} ms`)
  await sleep(randomSleep)

  const txConf = await getTxConf(testMode)
  const intrinsicGas = txConf.feeCurrencyGold ? 21000 : 71000
  // const totalTxGas = 500000 // aim for half million gas txs
  const calldataGas = totalTxGas - intrinsicGas
  const calldataSize = calldataGas / 4 // 119750 < tx pool size limit (128k)
  let dataStr = testMode === TestMode.Data ? getBigData(calldataSize) : undefined // aim for half million gas txs
  // Also running below the 128kb limit from the tx pool
  let transferAmount = LOAD_TEST_TRANSFER_WEI

  if (testMode === TestMode.ContractCall) {
    if (!contractData || !contractAddress) {
      throw new Error('Contract address and data must be provided for TestMode.ContractCall')
    }
    dataStr = contractData
    recipientAddressFinal = contractAddress
    transferAmount = new BigNumber(0)
  }

  const baseLogMessage: any = {
    loadTestID: index,
    threadID: thread,
    sender: kit.defaultAccount,
    nonce: '',
    gasPrice: '',
    recipient: recipientAddressFinal,
    feeCurrency: '',
    txHash: '',
    tokenName: txConf.tokenName,
  }

  while (true) {
    const sendTransactionTime = Date.now()
    const txConf = await getTxConf(testMode)
    baseLogMessage.tokenName = txConf.tokenName

    // randomly choose the recipientAddress if configured
    if (useRandomRecipient === 'true') {
      recipientAddressFinal = `0x${randomBytes(20).toString('hex')}`
      baseLogMessage.recipient = recipientAddressFinal
    }

    let txOptions
    const feeCurrency = await getFeeCurrency(kit, txConf.feeCurrencyGold, baseLogMessage)

    baseLogMessage.feeCurrency = feeCurrency
    try {
      let gasPrice = await getGasPrice(kit, feeCurrency)

      // Check if last tx was mined. If not, reuse the same nonce
      const nonceResult = await getNonce(
        kit,
        kit.defaultAccount,
        lastTx,
        lastNonce,
        gasPrice,
        lastGasPriceMinimum
      )
      nonce = nonceResult.nonce
      gasPrice = nonceResult.newPrice
      baseLogMessage.nonce = nonce
      baseLogMessage.gasPrice = gasPrice.toString()
      if (maxGasPrice.isGreaterThan(0)) {
        gasPrice = BigNumber.min(gasPrice, maxGasPrice)
      }
      lastGasPriceMinimum = gasPrice
      txOptions = {
        chainId,
        gasPrice: gasPrice.toString(),
        feeCurrency,
        nonce,
      }
    } catch (error: any) {
      tracerLog({
        tag: LOG_TAG_CONTRACT_ADDRESS_ERROR,
        error: error.toString(),
        ...baseLogMessage,
      })
    }

    if (testMode === TestMode.ContractCall) {
      if (!contractData || !contractAddress) {
        throw new Error('Contract address and data must be provided for TestMode.ContractCall')
      }
      dataStr = contractData
      recipientAddressFinal = contractAddress
    }

    await txConf
      .transferFn(
        kit,
        kit.defaultAccount,
        recipientAddressFinal,
        transferAmount,
        dataStr,
        txOptions
      )
      .then(async (txResult: TransactionResult) => {
        lastTx = await txResult.getHash()
        lastNonce = (await kit.web3.eth.getTransaction(lastTx)).nonce
        await onLoadTestTxResult(
          kit,
          kit.defaultAccount!,
          txResult,
          sendTransactionTime,
          baseLogMessage,
          blockscoutUrl,
          blockscoutMeasurePercent
        )
      })
      .catch((error: any) => {
        console.error('Load test transaction failed with error:', error)
        tracerLog({
          tag: LOG_TAG_TRANSACTION_ERROR,
          error: error.toString(),
          ...baseLogMessage,
        })
      })
    if (sendTransactionTime + txPeriodMs > Date.now()) {
      await sleep(sendTransactionTime + txPeriodMs - Date.now())
    }
  }
}

const getBigData = (size: number) => {
  return '0x' + '00'.repeat(size)
}

const getTxConf = async (testMode: TestMode) => {
  switch (testMode) {
    case TestMode.Ordinals:
      return {
        feeCurrencyGold: true,
        tokenName: 'cGLD',
        transferFn: transferOrdinals,
      }
    case TestMode.Data:
      return {
        feeCurrencyGold: true,
        tokenName: 'cGLD.L',
        transferFn: transferCalldata,
      }
    case TestMode.Transfer:
      return {
        feeCurrencyGold: true,
        tokenName: 'cGLD',
        transferFn: transferCeloGold,
      }
    case TestMode.StableTransfer:
      return {
        feeCurrencyGold: false,
        tokenName: 'cUSD',
        transferFn: transferCeloDollars,
      }
    case TestMode.Mixed:
      // randomly choose which token to use
      const useGold = Boolean(Math.round(Math.random()))
      const _transferFn = useGold ? transferCeloGold : transferCeloDollars
      const _tokenName = useGold ? 'cGLD' : 'cUSD'

      // randomly choose which gas currency to use
      const _feeCurrencyGold = Boolean(Math.round(Math.random()))
      return {
        feeCurrencyGold: _feeCurrencyGold,
        tokenName: _tokenName,
        transferFn: _transferFn,
      }
    case TestMode.ContractCall:
      return {
        feeCurrencyGold: true,
        tokenName: 'contract', // For logging
        transferFn: transferCalldata,
      }
    default:
      throw new Error(`Unimplemented TestMode: ${testMode}`)
  }
}

const getNonce = async (
  kit: ContractKit,
  senderAddress: string,
  lastTx: any,
  lastNonce: any,
  gasPrice: BigNumber,
  lastGasPriceMinimum: BigNumber
) => {
  let _nonce, _newPrice
  _newPrice = gasPrice
  if (lastTx === '' || lastNonce === -1) {
    _nonce = await kit.web3.eth.getTransactionCount(senderAddress, 'latest')
  } else if ((await kit.connection.getTransactionReceipt(lastTx))?.blockNumber) {
    _nonce = await kit.web3.eth.getTransactionCount(senderAddress, 'latest')
  } else {
    _nonce = (await kit.web3.eth.getTransactionCount(senderAddress, 'latest')) - 1
    _newPrice = BigNumber.max(gasPrice.toNumber(), lastGasPriceMinimum.times(1.02)).dp(0)
    console.warn(
      `TX ${lastTx} was not mined. Replacing tx reusing nonce ${_nonce} and gasPrice ${_newPrice}`
    )
  }
  return {
    newPrice: _newPrice,
    nonce: _nonce,
  }
}

const getFeeCurrency = async (kit: ContractKit, feeCurrencyGold: boolean, baseLogMessage: any) => {
  try {
    return feeCurrencyGold ? '' : await kit.registry.addressFor(CeloContract.StableToken)
  } catch (error: any) {
    tracerLog({
      tag: LOG_TAG_CONTRACT_ADDRESS_ERROR,
      error: error.toString(),
      ...baseLogMessage,
    })
  }
}

const getGasPrice = async (kit: ContractKit, feeCurrency?: string) => {
  const gasPriceMinimum = await kit.contracts.getGasPriceMinimum()
  const gasPriceBase = feeCurrency
    ? await gasPriceMinimum.getGasPriceMinimum(feeCurrency)
    : await gasPriceMinimum.gasPriceMinimum()
  return new BigNumber(gasPriceBase).times(2).dp(0)
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

export async function faucetLoadTestThreads(
  index: number,
  threads: number,
  mnemonic: string,
  web3Provider: string = 'http://localhost:8545',
  chainId: number = 42220
) {
  const minimumEthBalance = 5
  const kit = newKitFromWeb3(new Web3(web3Provider))
  const privateKey = generatePrivateKey(mnemonic, AccountType.LOAD_TESTING_ACCOUNT, index)
  kit.addAccount(privateKey)
  const fundingAddress = privateKeyToAddress(privateKey)
  console.info(`Addind account ${fundingAddress} to kit`)
  kit.defaultAccount = privateKeyToAddress(privateKey)
  const sleepTime = 5000
  while ((await kit.connection.isSyncing()) || (await kit.connection.getBlockNumber()) < 1) {
    console.info(`Sleeping ${sleepTime}ms while waiting for web3Provider to be synced.`)
    await sleep(sleepTime)
  }
  const [goldToken, stableToken] = await Promise.all([
    kit.contracts.getGoldToken(),
    kit.contracts.getStableToken(),
  ])
  const [goldAmount, stableTokenAmount] = await Promise.all([
    convertToContractDecimals(minimumEthBalance, goldToken),
    convertToContractDecimals(minimumEthBalance, stableToken),
  ])
  for (let thread = 0; thread < threads; thread++) {
    const senderIndex = getIndexForLoadTestThread(index, thread)
    const threadPkey = generatePrivateKey(mnemonic, AccountType.LOAD_TESTING_ACCOUNT, senderIndex)
    const threadAddress = privateKeyToAddress(threadPkey)
    console.info(`Funding account ${threadAddress} using ${kit.defaultAccount}`)
    if ((await goldToken.balanceOf(threadAddress)).lt(goldAmount)) {
      console.log(`Sending gold to ${threadAddress}`)
      await goldToken
        .transfer(threadAddress, goldAmount.toFixed())
        .send({ from: fundingAddress, chainId: numberToHex(chainId) })
    } else {
      console.log(`Account ${threadAddress} already has enough gold`)
    }
    if ((await stableToken.balanceOf(threadAddress)).lt(stableTokenAmount)) {
      console.log(`Sending cusd to ${threadAddress} using ${kit.defaultAccount}`)
      await stableToken
        .transfer(threadAddress, stableTokenAmount.toFixed())
        .send({ from: fundingAddress, chainId: numberToHex(chainId) })
    } else {
      console.log(`Account ${threadAddress} already has enough cusd`)
    }
  }
}

/**
 * This method generates key derivation index for loadtest clients and threads
 *
 * @param pod the pod replica number
 * @param thread the thread number inside the pod
 */
export function getIndexForLoadTestThread(pod: number, thread: number) {
  if (thread > MAX_LOADTEST_THREAD_COUNT) {
    throw new Error(`thread count must be smaller than ${MAX_LOADTEST_THREAD_COUNT}`)
  }
  // max number of threads to avoid overlap is [0, MAX_LOADTEST_THREAD_COUNT)
  return pod * MAX_LOADTEST_THREAD_COUNT + thread
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
  onReceipt?: (receipt: CeloTxReceipt) => void,
  onError?: (error: any) => void
) => {
  txParams.from = from
  await unlockAccount(kit.connection.web3, 0, password, from)

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
  const gethBinaryPath = path.join(
    (gethConfig.repository && gethConfig.repository.path) || '',
    'build/bin/geth'
  )

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
    console.info('Validators', JSON.stringify(validatorAddresses, null, 2))
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
  await initGeth(gethConfig, gethBinaryPath, instance, verbose)
  return startGeth(gethConfig, gethBinaryPath, instance, verbose)
}

export async function initGeth(
  gethConfig: GethRunConfig,
  gethBinaryPath: string,
  instance: GethInstanceConfig,
  verbose: boolean
) {
  const datadir = getDatadir(gethConfig.runPath, instance)
  const genesisPath = path.join(gethConfig.runPath, 'genesis.json')
  if (verbose) {
    console.info(`geth:${instance.name}: init datadir ${datadir}`)
    console.info(`init geth with genesis at ${genesisPath}`)
  }

  await spawnCmdWithExitOnFailure('rm', ['-rf', datadir], { silent: !verbose })
  await spawnCmdWithExitOnFailure(gethBinaryPath, ['--datadir', datadir, 'init', genesisPath], {
    silent: !verbose,
  })
  if (instance.privateKey) {
    await importPrivateKey(gethConfig, gethBinaryPath, instance, verbose)
  }
}

export async function importPrivateKey(
  getConfig: GethRunConfig,
  gethBinaryPath: string,
  instance: GethInstanceConfig,
  verbose: boolean
) {
  const keyFile = path.join(getDatadir(getConfig.runPath, instance), 'key.txt')
  if (!instance.privateKey) {
    throw new Error('Unexpected empty private key')
  }
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
    console.info(gethBinaryPath, ...args)
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
    console.info(`Writing static peers to ${staticPeersPath}`)
  }

  const enodes = await Promise.all(peers.map((peer) => getEnode(peer)))
  const enodesString = JSON.stringify(enodes, null, 2)

  if (verbose) {
    console.info('eNodes', enodesString)
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
    console.info('starting geth with config', JSON.stringify(instance, null, 2))
  } else {
    console.info(`${instance.name}: starting.`)
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
  const minerValidator = instance.minerValidator
  if (instance.validating && !minerValidator) {
    throw new Error('miner.validator address from the instance is required')
  }
  const verbosity = gethConfig.verbosity ? gethConfig.verbosity : '3'

  instance.args = [
    '--datadir',
    datadir,
    '--syncmode',
    syncmode,
    '--log.debug',
    '--metrics',
    '--port',
    port.toString(),
    '--networkid',
    gethConfig.networkId.toString(),
    `--verbosity=${verbosity}`,
    '--consoleoutput=stdout', // Send all logs to stdout
    '--consoleformat=term',
    '--nat',
    'extip:127.0.0.1',
    '--allow-insecure-unlock', // geth1.9 to use http w/unlocking
    '--gcmode=archive', // Needed to retrieve historical state
    '--rpc.gasinflationrate=1', // InflationRate=1 (no inflation)
  ]

  if (minerValidator) {
    const txFeeRecipient = instance.txFeeRecipient || minerValidator
    instance.args.push('--miner.validator', minerValidator, '--tx-fee-recipient', txFeeRecipient)
  }

  if (rpcport) {
    instance.args.push(
      '--http',
      '--http.port',
      rpcport.toString(),
      '--http.corsdomain=*',
      '--http.vhosts=*',
      '--http.api=eth,net,web3,debug,admin,personal,txpool,istanbul'
    )
  }

  if (wsport) {
    instance.args.push(
      '--ws',
      '--ws.origins=*',
      '--ws.port',
      wsport.toString(),
      '--ws.api=eth,net,web3,debug,admin,personal,txpool,istanbul'
    )
  }

  if (lightserv) {
    instance.args.push('--light.serve=90')
    instance.args.push('--light.maxpeers=10')
  } else if (syncmode === 'full' || syncmode === 'fast') {
    instance.args.push('--light.serve=0')
  }

  if (instance.nodekey) {
    instance.args.push(`--nodekeyhex=${instance.nodekey}`)
  } else if (!validating || !replica) {
    instance.args.push(`--nodekeyhex=${privateKey}`)
  }

  if (gatewayFee) {
    instance.args.push(`--light.gatewayfee=${gatewayFee.toString()}`)
  }

  if (validating) {
    instance.args.push('--mine')

    if (validatingGasPrice) {
      instance.args.push(`--miner.gasprice=${validatingGasPrice}`)
    }

    if (isProxied) {
      instance.args.push('--proxy.proxied')
    }
    if (replica) {
      instance.args.push('--istanbul.replica')
    }
  } else if (isProxy) {
    instance.args.push('--proxy.proxy')
    if (proxyport) {
      instance.args.push(`--proxy.internalendpoint=:${proxyport.toString()}`)
    }
    instance.args.push(`--proxy.proxiedvalidatoraddress=${instance.proxiedValidatorAddress}`)
  }

  if (bootnodeEnode) {
    instance.args.push(`--bootnodes=${bootnodeEnode}`)
  } else {
    instance.args.push('--nodiscover')
  }

  if (isProxied && instance.proxies) {
    if (proxyAllowPrivateIp) {
      instance.args.push('--proxy.allowprivateip=true')
    }
    instance.args.push(`--proxy.proxyenodeurlpairs=${instance.proxies[0]!};${instance.proxies[1]!}`)
  }

  if (privateKey || ethstats) {
    instance.args.push('--password=/dev/null', `--unlock=0`)
  }

  if (ethstats) {
    instance.args.push(`--ethstats=${instance.name}@${ethstats}`, '--etherbase=0')
  }

  const gethProcess = spawnWithLog(gethBinaryPath, instance.args, `${datadir}/logs.txt`, verbose)
  instance.pid = gethProcess.pid

  gethProcess.on('error', (err: Error) => {
    throw new Error(`geth:${instance.name} failed to start! ${err}`)
  })

  gethProcess.on('exit', (code: number) => {
    if (code === 0) {
      console.info(`geth:${instance.name} exited`)
    } else {
      console.error(`geth:${instance.name} exited with code ${code}`)
    }
    instance.pid = undefined
  })

  // Give some time for geth to come up
  const secondsToWait = 30
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

  // Geth startup isn't fully done even when the port is open, so check until it responds
  const maxTries = 5
  let tries = 0
  while (tries < maxTries) {
    tries++
    let block = null
    try {
      block = await new Web3('http://localhost:8545').eth.getBlock('latest')
    } catch (e) {
      console.info(`Failed to fetch test block: ${e}`)
    }
    if (block) {
      break
    }
    console.info('Could not fetch test block. Wait one second, then retry.')
    await sleep(1000)
  }
  if (tries === maxTries) {
    throw new Error(`Geth did not start within ${tries} seconds`)
  }

  console.info(
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
    blockTime: 1,
    epoch: 10,
    lookbackwindow: 3,
    requestTimeout: 3000,
    chainId: gethConfig.networkId,
    ...gethConfig.genesisConfig,
  })

  const genesisPath = path.join(gethConfig.runPath, 'genesis.json')

  if (verbose) {
    console.info('writing genesis')
  }

  fs.writeFileSync(genesisPath, genesis)

  if (verbose) {
    console.info(`wrote genesis to ${genesisPath}`)
  }
}

export async function writeGenesisWithMigrations(
  gethConfig: GethRunConfig,
  gethRepoPath: string,
  mnemonic: string,
  numValidators: number,
  verbose: boolean = false
) {
  const genesis: string = await generateGenesisWithMigrations({
    gethRepoPath,
    mnemonic,
    numValidators,
    verbose,
    genesisConfig: {
      blockTime: 1,
      epoch: 10,
      lookbackwindow: 3,
      requestTimeout: 3000,
      chainId: gethConfig.networkId,
      ...gethConfig.genesisConfig,
    },
  })

  const genesisPath = path.join(gethConfig.runPath, 'genesis.json')

  if (verbose) {
    console.info('writing genesis')
  }

  fs.writeFileSync(genesisPath, genesis)

  if (verbose) {
    console.info(`wrote genesis to ${genesisPath}`)
  }
}

export async function snapshotDatadir(
  runPath: string,
  instance: GethInstanceConfig,
  verbose: boolean
) {
  if (verbose) {
    console.info('snapshotting data dir')
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

export async function buildGethAll(gethPath: string) {
  await spawnCmdWithExitOnFailure('make', ['all'], { cwd: gethPath })
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
    console.info(cmd, ...args)
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

// Create a fully connected clique of peer connections with the given instances.
export async function connectPeers(instances: GethInstanceConfig[], verbose: boolean = false) {
  await connectBipartiteClique(instances, instances, verbose)
}

// Fully connect all peers in the "left" set to all peers in the "right" set, forming a bipartite clique.
export async function connectBipartiteClique(
  left: GethInstanceConfig[],
  right: GethInstanceConfig[],
  verbose: boolean = false
) {
  const admins = (instances: GethInstanceConfig[]) =>
    instances.map(
      ({ wsport, rpcport }) =>
        new Admin(`${rpcport ? 'http' : 'ws'}://localhost:${rpcport || wsport}`)
    )

  const connect = async (sources: GethInstanceConfig[], targets: GethInstanceConfig[]) => {
    const targetEnodes = await Promise.all(
      admins(targets).map(async (a) => (await a.getNodeInfo()).enode)
    )

    await Promise.all(
      admins(sources).map(async (admin) => {
        const sourceEnode = (await admin.getNodeInfo()).enode
        await Promise.all(
          targetEnodes.map(async (enode) => {
            if (sourceEnode === enode) {
              return
            }
            if (verbose) {
              console.info(`connecting ${sourceEnode} with ${enode}`)
            }
            const success = await admin.addPeer(enode)
            if (!success) {
              throw new Error('Connecting geth peers failed!')
            }
          })
        )
      })
    )
  }

  await connect(left, right)
  await connect(right, left)
}

// Add validator 0 as a peer of each other validator.
export async function connectValidatorPeers(instances: GethInstanceConfig[]) {
  const validators = instances.filter(
    (node) => (node.validating && !node.isProxied) || node.isProxy
  )
  // Determine which validators are isolated (i.e. currently just that they are not using a bootnode)
  const isolated = validators.filter((node) => !node.bootnodeEnode)
  if (isolated.length <= 0) {
    return
  }

  // Determine the root node to connect other validators to. It should be able to join the whole network of validators.
  const root = validators.find((node) => node.bootnodeEnode) ?? validators[0]
  await connectBipartiteClique([root], isolated)
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
      blockchainParameters: {
        uptimeLookbackWindow: 3, // same as our default in `writeGenesis()`
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
