import {
  awaitConfirmation,
  getStableTokenContract,
  sendTransactionAsync,
  sendTransactionAsyncWithWeb3Signing,
  SendTransactionLogEvent,
  SendTransactionLogEventType,
} from '@celo/walletkit'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { DEFAULT_INFURA_URL } from 'src/config'
import Logger from 'src/utils/Logger'
import { isZeroSyncMode, web3 } from 'src/web3/contracts'
import { TransactionObject } from 'web3/eth/types'

// As per https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + x)
}

const getLogger = (tag: string, txId: string) => {
  return (event: SendTransactionLogEvent) => {
    switch (event.type) {
      case SendTransactionLogEventType.Confirmed:
        Logger.debug(tag, `Transaction confirmed with id: ${txId}`)
        break
      case SendTransactionLogEventType.EstimatedGas:
        Logger.debug(tag, `Transaction with id ${txId} estimated gas: ${event.gas}`)
        CeloAnalytics.track(CustomEventNames.transaction_send_gas_estimated, { txId })
        break
      case SendTransactionLogEventType.ReceiptReceived:
        Logger.debug(
          tag,
          `Transaction id ${txId} received receipt: ${JSON.stringify(event.receipt)}`
        )
        CeloAnalytics.track(CustomEventNames.transaction_send_gas_receipt, { txId })
        break
      case SendTransactionLogEventType.TransactionHashReceived:
        Logger.debug(tag, `Transaction id ${txId} hash received: ${event.hash}`)
        break
      case SendTransactionLogEventType.Started:
        Logger.debug(tag, `Sending transaction with id ${txId}`)
        CeloAnalytics.track(CustomEventNames.transaction_send_start, { txId })
        break
      case SendTransactionLogEventType.Failed:
        Logger.error(tag, `Transaction failed: ${txId}`, event.error)
        break
      case SendTransactionLogEventType.Exception:
        Logger.error(tag, `Transaction Exception caught ${txId}: `, event.error)
        break
      default:
        assertNever(event)
    }
  }
}

// Sends a transaction and async returns promises for the txhash, confirmation, and receipt
// Only use this method if you need more granular control of the different events
export const sendTransactionPromises = async (
  tx: TransactionObject<any>,
  account: string,
  tag: string,
  txId: string,
  staticGas?: number | undefined
) => {
  Logger.debug(
    'transactions/send@sendTransactionPromises',
    `Going to send a transaction with id ${txId}`
  )
  const stableToken = await getStableTokenContract(web3)
  // This if-else case is temprary and will disappear once we move from `walletkit` to `contractkit`.
  if (isZeroSyncMode()) {
    // In dev mode, verify that we are actually able to connect to the network. This
    // ensures that we get a more meaningful error if the infura server is down, which
    // can happen with networks without SLA guarantees like `integration`.
    if (__DEV__) {
      await verifyUrlWorksOrThrow(DEFAULT_INFURA_URL)
    }
    Logger.debug(
      'transactions/send@sendTransactionPromises',
      `Sending transaction with id ${txId} using web3 signing`
    )
    return sendTransactionAsyncWithWeb3Signing(
      web3,
      tx,
      account,
      stableToken,
      getLogger(tag, txId),
      staticGas
    )
  } else {
    Logger.debug(
      'transactions/send@sendTransactionPromises',
      `Sending transaction with id ${txId} using geth signing`
    )
    return sendTransactionAsync(tx, account, stableToken, getLogger(tag, txId), staticGas)
  }
}

// Send a transaction and await for its confirmation
// Use this method for sending transactions and awaiting them to be confirmed
export const sendTransaction = async (
  tx: TransactionObject<any>,
  account: string,
  tag: string,
  txId: string,
  staticGas?: number | undefined
) => {
  return sendTransactionPromises(tx, account, tag, txId, staticGas).then(awaitConfirmation)
}

async function verifyUrlWorksOrThrow(url: string) {
  try {
    await fetch(url)
  } catch (e) {
    Logger.error(
      'contracts@verifyUrlWorksOrThrow',
      `Failed to perform HEAD request to url: \"${url}\"`,
      e
    )
    throw new Error(`Failed to perform HEAD request to url: \"${url}\", is it working?`)
  }
}
