import { CeloContract, ContractKit, newKit } from '@celo/contractkit'
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import BigNumber from 'bignumber.js'
import sleep from 'sleep-promise'
import {
  checkBlockscoutResponse,
  fetchBlockscoutTxInfo,
  LOG_TAG_CONTRACT_ADDRESS_ERROR,
  LOG_TAG_GETH_RPC_ERROR,
  LOG_TAG_TRANSACTION_ERROR,
  LOG_TAG_TRANSACTION_VALIDATION_ERROR,
  LOG_TAG_TX_TIME_MEASUREMENT,
  tracerLog,
  validateGethRPC,
  validateTransactionAndReceipt,
} from 'src/lib/geth'

// for log messages which indicate that blockscout where not able to provide
// information about transaction in a "timely" (15s for now) manner
export const LOG_TAG_BLOCKSCOUT_TIMEOUT = 'blockscout_timeout'
// for log messages which show time (+- 150-200ms) needed for blockscout to
// fetch and publish information about transaction
export const LOG_TAG_BLOCKSCOUT_TIME_MEASUREMENT = 'blockscout_time_measurement'
// for log messages which show the error about validating transaction receipt
export const LOG_TAG_BLOCKSCOUT_VALIDATION_ERROR = 'validate_blockscout_error'

// Maximal time given for blockscout to provide info about tx
// If the transaction does not appear in blockscout within 15 seconds,
// blockscout is considered to be not working in a timely manner
const BLOCKSCOUT_TIMEOUT_MAX_MS = 15000

// Try to fetch info about transaction every 150 ms
const BLOCKSCOUT_FETCH_RETRY_MS = 150

const TRANSFER_AMOUNT_WEI = new BigNumber(10000)

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
    gasCurrency: '',
    txHash: '',
  }

  while (true) {
    const sendTransactionTime = Date.now()

    // randomly choose which token to use
    const transferGold = Boolean(Math.round(Math.random()))
    const transferFn = transferGold ? transferCeloGold : transferCeloDollars
    baseLogMessage.tokenName = transferGold ? 'cGLD' : 'cUSD'

    // randomly choose which gas currency to use
    const gasCurrencyGold = Boolean(Math.round(Math.random()))

    let gasCurrency
    if (!gasCurrencyGold) {
      try {
        gasCurrency = await kit.registry.addressFor(CeloContract.StableToken)
      } catch (error) {
        tracerLog({
          tag: LOG_TAG_CONTRACT_ADDRESS_ERROR,
          error: error.toString(),
          ...baseLogMessage,
        })
      }
    }
    baseLogMessage.gasCurrency = gasCurrency || ''

    // We purposely do not use await syntax so we sleep after sending the transaction,
    // not after processing a transaction's result
    transferFn(kit, senderAddress, recipientAddress, TRANSFER_AMOUNT_WEI, {
      gasCurrency,
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

export const transferCeloGold = async (
  kit: ContractKit,
  fromAddress: string,
  toAddress: string,
  amount: BigNumber,
  txOptions: {
    gasCurrency?: string
  } = {}
) => {
  const kitGoldToken = await kit.contracts.getGoldToken()
  return transferToken(kitGoldToken, fromAddress, toAddress, amount, txOptions)
}

export const transferCeloDollars = async (
  kit: ContractKit,
  fromAddress: string,
  toAddress: string,
  amount: BigNumber,
  txOptions: {
    gasCurrency?: string
  } = {}
) => {
  const kitStableToken = await kit.contracts.getStableToken()
  return transferToken(kitStableToken, fromAddress, toAddress, amount, txOptions)
}

const transferToken = (
  kitToken: GoldTokenWrapper | StableTokenWrapper,
  fromAddress: string,
  toAddress: string,
  amount: BigNumber,
  txOptions: {
    gasCurrency?: string
  } = {}
) => {
  return kitToken.transfer(toAddress, amount.toString()).send({
    from: fromAddress,
    ...txOptions,
  })
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

// within MAXIMAL_BLOCKSCOUT_TIMEOUT ms
const getFirstValidBlockscoutResponse = async (url: string, txHash: string) => {
  const attempts = BLOCKSCOUT_TIMEOUT_MAX_MS / BLOCKSCOUT_FETCH_RETRY_MS
  for (let attemptId = 0; attemptId < attempts; attemptId++) {
    const json = await fetchBlockscoutTxInfo(url, txHash)
    if (json.status !== '1') {
      await sleep(BLOCKSCOUT_FETCH_RETRY_MS)
    } else {
      return [json, Date.now()]
    }
  }
  return [null, null]
}
