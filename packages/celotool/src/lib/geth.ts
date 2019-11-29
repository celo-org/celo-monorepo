/* tslint:disable: no-console */
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
import fs from 'fs'
import { range } from 'lodash'
import fetch from 'node-fetch'
import path from 'path'
import Web3Type from 'web3'
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
import { spawn } from 'child_process'
import { Admin } from 'web3-eth-admin'

type HandleErrorCallback = (isError: boolean, data: { location: string; error: string }) => void

export interface GethRunConfig {
  // migration
  migrate?: boolean
  migrateTo?: number
  migrationOverrides?: any
  // ??
  useBootnode?: boolean
  // genesis config
  genesisPath: string
  genesisConfig?: any
  // network
  networkId: number
  // where to run
  runPath: string
  gethRepoPath: string
  // running instances
  instances: GethInstanceConfig[]
}

export interface GethInstanceConfig {
  gethRunConfig: GethRunConfig
  name: string
  validating: boolean
  syncmode: string
  port: number
  proxyport?: number
  rpcport?: number
  wsport?: number
  lightserv?: boolean
  privateKey?: string
  etherbase?: string
  peers?: string[]
  proxies?: string[2][]
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

const GETH_IPC = 'geth.ipc'
const DISCOVERY_PORT = 30303

const BLOCKSCOUT_TIMEOUT = 12000 // ~ 12 seconds needed to see the transaction in the blockscout

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
  // We couldn't use our updated docker image, so for now the bootnodes id is based upon the load_testing account
  const privateKey = generatePrivateKey(
    fetchEnv(envVar.MNEMONIC),
    AccountType.LOAD_TESTING_ACCOUNT,
    0
  )
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
  const enodes = Promise.all(
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
  return enodes
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

const getRandomlyChoseToken = (goldToken: GoldTokenType, stableToken: StableTokenType) => {
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
  if (!transaction.from || transaction.from.toLowerCase() !== from.toLowerCase()) {
    handleError(!transaction.from || transaction.from.toLowerCase() !== from.toLowerCase(), {
      location: '[GethRPC]',
      error: `Expected "from" to equal ${from}, but found ${transaction.from}`,
    })
  }
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
  handleError(json.result.from !== from, {
    location,
    error: `Expected "from" to equal ${from}, but found ${json.result.from}`,
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
  handleError(txReceipt.from !== from, {
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

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

  const token = getRandomlyChoseToken(goldToken, stableToken)
  const feeCurrencyToken = getRandomlyChoseToken(goldToken, stableToken)

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

// for log messages which show time needed to receive the receipt after
// the transaction has been sent
export const LOG_TAG_TX_TIME_MEASUREMENT = 'tx_time_measurement'
// for log messages which show time (+- 150-200ms) needed for blockscout to
// fetch and publish information about transaction
export const LOG_TAG_BLOCKSCOUT_TIME_MEASUREMENT = 'blockscout_time_measurement'
// for log messages which show the error occurred when the transaction has
// been sent
export const LOG_TAG_TRANSACTION_ERROR = 'transaction_error'
// for log messages which show the error about validating transaction receipt
export const LOG_TAG_TRANSACTION_VALIDATION_ERROR = 'validate_transaction_error'
// for log messages which indicate that blockscout where not able to provide
// information about transaction in a "timely" (15s for now) manner
export const LOG_TAG_BLOCKSCOUT_TIMEOUT = 'blockscout_timeout'
// for log messages which show the error about validating transaction receipt
export const LOG_TAG_BLOCKSCOUT_VALIDATION_ERROR = 'validate_blockscout_error'
// for log messages which show the error while validating geth rpc response
export const LOG_TAG_GETH_RPC_ERROR = 'geth_rpc_error'
// message indicating that the tx hash has been received in callback within sendTransaction
export const LOG_TAG_TRANSACTION_HASH_RECEIVED = 'tx_hash_received'

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

export const simulateClient = async (
  web3: Web3Type,
  goldToken: GoldTokenType,
  stableToken: StableTokenType,
  senderAddress: string,
  recipientAddress: string,
  blockscoutUrl: string,
  delay: number,
  blockscoutProbability: number,
  loadTestID: string,
  password: string = ''
) => {
  while (true) {
    const baseLogMessage: any = {
      loadTestID,
      sender: senderAddress,
      recipient: recipientAddress,
      txHash: '',
    }

    try {
      const token = getRandomlyChoseToken(goldToken, stableToken)
      const feeCurrencyToken = getRandomlyChoseToken(goldToken, stableToken)

      const [tokenSymbol] = await Promise.all([
        token.methods.symbol().call(),
        feeCurrencyToken.methods.symbol().call(),
      ])

      const txParams: any = {}
      // Fill txParams below
      baseLogMessage.token = tokenSymbol

      const sendTransactionTime = Date.now()

      const transferToken = new Promise(async (resolve: (data: any) => void) => {
        await transferERC20Token(
          web3,
          token,
          senderAddress,
          recipientAddress,
          DEFAULT_TRANSFER_AMOUNT,
          password,
          txParams,
          (txHash: any) => {
            tracerLog({
              txHash,
              tag: LOG_TAG_TRANSACTION_HASH_RECEIVED,
              ...baseLogMessage,
            })
            console.warn('tx hash from trasnfer', txHash)
          },
          (receipt2: any) => {
            resolve([receipt2, Date.now()])
          },
          undefined,
          (error: any) => {
            resolve([null, error])
          }
        )
      })

      const [receipt, obtainReceiptTimeOrError] = await transferToken
      if (receipt === null) {
        tracerLog({
          tag: LOG_TAG_TRANSACTION_ERROR,
          error: obtainReceiptTimeOrError,
          ...baseLogMessage,
        })
        process.exit(1)
      }

      baseLogMessage.txHash = receipt.transactionHash
      tracerLog({
        tag: LOG_TAG_TX_TIME_MEASUREMENT,
        p_time: obtainReceiptTimeOrError - sendTransactionTime,
        ...baseLogMessage,
      })

      // Continuing only with receipt received
      validateTransactionAndReceipt(senderAddress, receipt, (isError, data) => {
        if (isError) {
          tracerLog({
            tag: LOG_TAG_TRANSACTION_VALIDATION_ERROR,
            ...baseLogMessage,
            ...data,
          })
        }
      })

      if (getRandomInt(0, 99) < blockscoutProbability) {
        await measureBlockscout(
          blockscoutUrl,
          receipt.transactionHash,
          senderAddress,
          obtainReceiptTimeOrError,
          baseLogMessage
        )
      }

      await validateGethRPC(web3, receipt.transactionHash, senderAddress, (isError, data) => {
        if (isError) {
          tracerLog({
            tag: LOG_TAG_GETH_RPC_ERROR,
            ...data,
            ...baseLogMessage,
          })
        }
      })
    } catch (error) {
      tracerLog({
        tag: LOG_TAG_TRANSACTION_ERROR,
        error: error.toString(),
        ...baseLogMessage,
      })
      process.exit(1)
    }

    await sleep(delay * 1000 /* turning delay in seconds into delay in ms */)
  }
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
  keepData,
  validatorPrivateKeys,
  validators,
}: {
  gethConfig: GethRunConfig
  keepData: boolean
  validators: any
  validatorPrivateKeys: any
}) => {
  const validatorsFilePath = `${gethConfig.runPath}/validators.json`
  const validatorInstances = gethConfig.instances.filter((x: any) => x.validating)
  const validatorEnodes = validatorPrivateKeys.map((x: any, i: number) =>
    getEnodeAddress(privateKeyToPublicKey(x), '127.0.0.1', validatorInstances[i].port)
  )
  const gethBinaryPath = `${gethConfig.gethRepoPath}/build/bin/geth`

  if (!keepData && fs.existsSync(gethConfig.runPath)) {
    await resetDataDir(gethConfig.runPath)
  }

  if (!fs.existsSync(gethConfig.runPath)) {
    fs.mkdirSync(gethConfig.runPath, { recursive: true })
  }

  await writeGenesis(validators, gethConfig)

  console.log('Validator eNodes', JSON.stringify(validatorEnodes, null, 2))

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

    if (instance.privateKey) {
      await importPrivateKey(gethBinaryPath, instance)
    }

    if (instance.peers) {
      await addStaticPeers(getDatadir(instance), instance.peers)
    }

    if (gethConfig.migrate || gethConfig.migrateTo) {
      await initAndStartGeth(gethBinaryPath, instance)
    } else {
      await startGeth(gethBinaryPath, instance)
    }
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
  return path.join(getInstanceDir(instance), 'datadir')
}

/**
 * @returns Promise<number> the geth pid number
 */
export async function initAndStartGeth(gethBinaryPath: string, instance: GethInstanceConfig) {
  const datadir = getDatadir(instance)

  console.info(`geth:${instance.name}: init datadir ${datadir}`)

  // await init(gethBinaryPath, datadir, instance.gethRunConfig.genesisPath)

  return startGeth(gethBinaryPath, instance)
}

export async function init(gethBinaryPath: string, datadir: string, genesisPath: string) {
  await spawnCmdWithExitOnFailure('rm', ['-rf', datadir], { silent: true })
  await spawnCmdWithExitOnFailure(gethBinaryPath, ['--datadir', datadir, 'init', genesisPath], {
    silent: false,
  })
}

export async function importPrivateKey(gethBinaryPath: string, instance: GethInstanceConfig) {
  const keyFile = `${getDatadir(instance)}/key.txt`
  await init(gethBinaryPath, getDatadir(instance), instance.gethRunConfig.genesisPath)
  fs.writeFileSync(keyFile, instance.privateKey, { flag: 'a' })
  console.info(`geth:${instance.name}: import account`)
  await spawnCmdWithExitOnFailure(
    gethBinaryPath,
    ['account', 'import', '--datadir', getDatadir(instance), '--password', '/dev/null', keyFile],
    { silent: true }
  )
}

export async function addStaticPeers(datadir: string, enodes: string[]) {
  fs.writeFileSync(`${datadir}/static-nodes.json`, JSON.stringify(enodes))
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

export async function startGeth(gethBinaryPath: string, instance: GethInstanceConfig) {
  const datadir = getDatadir(instance)
  const {
    syncmode,
    port,
    rpcport,
    wsport,
    validating,
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
    '--rpcvhosts="*"',
    '--networkid',
    instance.gethRunConfig.networkId.toString(),
    '--verbosity',
    '5',
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
      '--rpccorsdomain="*"',
      '--rpcapi=eth,net,web3,debug,admin,personal,txpool,istanbul'
    )
  }

  if (wsport) {
    gethArgs.push(
      '--wsorigins="*"',
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

  if (!!ethstats) {
    gethArgs.push(`--ethstats=${instance.name}@${ethstats}`)
  }

  const gethProcess = spawnWithLog(gethBinaryPath, gethArgs, `${datadir}/logs.txt`)
  instance.pid = gethProcess.pid

  gethProcess.on('error', (err) => {
    throw new Error(`Geth crashed! Error: ${err}`)
  })

  // Give some time for geth to come up
  const waitForPort = wsport ? wsport : rpcport
  if (waitForPort) {
    const isOpen = await waitForPortOpen('localhost', waitForPort, 10)
    if (!isOpen) {
      console.error(`geth:${instance.name}: jsonRPC didn't open after 5 seconds`)
      process.exit(1)
    } else {
      console.info(`geth:${instance.name}: jsonRPC port open ${waitForPort}`)
    }
  }

  return instance
}

export function writeGenesis(validators: Validator[], gethConfig: GethRunConfig) {
  const genesis = generateGenesis({
    validators,
    blockTime: 0,
    epoch: 10,
    lookback: 2,
    requestTimeout: 3000,
    chainId: gethConfig.networkId,
    ...gethConfig.genesisConfig,
  })
  console.log('writing genesis')
  fs.writeFileSync(gethConfig.genesisPath, genesis)
  console.log(`wrote   genesis to ${gethConfig.genesisPath}`)
}

async function isPortOpen(host: string, port: number) {
  return (await spawnCmd('nc', ['-z', host, port.toString()], { silent: true })) === 0
}

async function waitForPortOpen(host: string, port: number, seconds: number) {
  const deadline = Date.now() + seconds * 1000
  do {
    if (await isPortOpen(host, port)) {
      return true
    }
  } while (Date.now() < deadline)
  return false
}

export async function snapshotDatadir(instance: GethInstanceConfig) {
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

export async function buildGeth(path: string) {
  await spawnCmdWithExitOnFailure('make', ['geth'], { cwd: path })
}

export async function resetDataDir(dataDir: string) {
  await spawnCmd('rm', ['-rf', dataDir], { silent: true })
  await spawnCmd('mkdir', [dataDir], { silent: true })
}

export async function checkoutGethRepo(branch: string, path: string) {
  await spawnCmdWithExitOnFailure('rm', ['-rf', path])
  await spawnCmdWithExitOnFailure('git', [
    'clone',
    '--depth',
    '1',
    'https://github.com/celo-org/celo-blockchain.git',
    path,
    '-b',
    branch,
  ])
  await spawnCmdWithExitOnFailure('git', ['checkout', branch], { cwd: path })
}

export function spawnWithLog(cmd: string, args: string[], logsFilepath: string) {
  try {
    fs.unlinkSync(logsFilepath)
  } catch (error) {
    // nothing to do
  }
  const logStream = fs.createWriteStream(logsFilepath, { flags: 'a' })
  console.log(cmd, ...args)
  const process = spawn(cmd, args)
  process.stdout.pipe(logStream)
  process.stderr.pipe(logStream)
  return process
}

// Add validator 0 as a peer of each other validator.
export async function connectValidatorPeers(gethConfig: GethRunConfig) {
  const admins = gethConfig.instances
    .filter(({ wsport, rpcport, validating }) => validating && (wsport || rpcport))
    .map(
      ({ wsport, rpcport }) =>
        new Admin(`${wsport ? 'ws' : 'http'}://localhost:${wsport || rpcport}`)
    )
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
