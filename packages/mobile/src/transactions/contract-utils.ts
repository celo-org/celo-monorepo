import { values } from 'lodash'
import { estimateGas } from 'src/web3/utils'
import { Tx } from 'web3-core'
import { TransactionObject, TransactionReceipt } from 'web3-eth'

export type TxLogger = (event: SendTransactionLogEvent) => void

export function emptyTxLogger(_event: SendTransactionLogEvent) {
  return
}

interface TxPromiseResolvers {
  receipt: (receipt: TransactionReceipt) => void
  transactionHash: (transactionHash: string) => void
  confirmation: (confirmation: boolean) => void
}

type PromiseRejection = (error: Error) => void
interface TxPromiseReject {
  receipt: PromiseRejection
  transactionHash: PromiseRejection
  confirmation: PromiseRejection
}

export interface TxPromises {
  receipt: Promise<TransactionReceipt>
  transactionHash: Promise<string>
  confirmation: Promise<boolean>
}

export function awaitConfirmation(txPromises: TxPromises) {
  return txPromises.confirmation
}

// Couldn't figure out how to make it generic
export type SendTransaction<T> = (
  tx: TransactionObject<any>,
  account: string,
  txId?: string
) => Promise<T>

export enum SendTransactionLogEventType {
  Started,
  EstimatedGas,
  ReceiptReceived,
  TransactionHashReceived,
  Confirmed,
  Failed,
  Exception,
}

interface Started {
  type: SendTransactionLogEventType.Started
}
const Started: Started = { type: SendTransactionLogEventType.Started }

interface Confirmed {
  type: SendTransactionLogEventType.Confirmed
  number: number
}

function Confirmed(n: number): Confirmed {
  return { type: SendTransactionLogEventType.Confirmed, number: n }
}

export type SendTransactionLogEvent =
  | Started
  | EstimatedGas
  | ReceiptReceived
  | TransactionHashReceived
  | Confirmed
  | Failed
  | Exception

interface EstimatedGas {
  type: SendTransactionLogEventType.EstimatedGas
  gas: number
}

function EstimatedGas(gas: number): EstimatedGas {
  return { type: SendTransactionLogEventType.EstimatedGas, gas }
}

interface ReceiptReceived {
  type: SendTransactionLogEventType.ReceiptReceived
  receipt: TransactionReceipt
}

function ReceiptReceived(receipt: TransactionReceipt): ReceiptReceived {
  return { type: SendTransactionLogEventType.ReceiptReceived, receipt }
}

interface TransactionHashReceived {
  type: SendTransactionLogEventType.TransactionHashReceived
  hash: string
}

function TransactionHashReceived(hash: string): TransactionHashReceived {
  return { type: SendTransactionLogEventType.TransactionHashReceived, hash }
}

interface Failed {
  type: SendTransactionLogEventType.Failed
  error: Error
}

function Failed(error: Error): Failed {
  return { type: SendTransactionLogEventType.Failed, error }
}

interface Exception {
  type: SendTransactionLogEventType.Exception
  error: Error
}

function Exception(error: Error): Exception {
  return { type: SendTransactionLogEventType.Exception, error }
}

/**
 * sendTransactionAsync mainly abstracts the sending of a transaction in a promise like
 * interface. Use the higher-order sendTransactionFactory as a consumer to configure
 * logging and promise resolution
 * TODO: Should probably renamed to sendTransaction once we remove the current
 *       sendTransaction
 * @param tx The transaction object itself
 * @param account The address from which the transaction should be sent
 * @param feeCurrencyContract The contract instance of the Token in which to pay gas for
 * @param logger An object whose log level functions can be passed a function to pass
 *               a transaction ID
 */
export async function sendTransactionAsync<T>(
  tx: TransactionObject<T>,
  account: string,
  feeCurrencyAddress: string,
  logger: TxLogger = emptyTxLogger,
  estimatedGas?: number,
  gasPrice?: string,
  nonce?: number
): Promise<TxPromises> {
  // @ts-ignore
  const resolvers: TxPromiseResolvers = {}
  // @ts-ignore
  const rejectors: TxPromiseReject = {}

  const receipt: Promise<TransactionReceipt> = new Promise((resolve, reject) => {
    resolvers.receipt = resolve
    rejectors.receipt = reject
  })

  const transactionHash: Promise<string> = new Promise((resolve, reject) => {
    resolvers.transactionHash = resolve
    rejectors.transactionHash = reject
  })

  const confirmation: Promise<boolean> = new Promise((resolve, reject) => {
    resolvers.confirmation = resolve
    rejectors.confirmation = reject
  })

  const rejectAll = (error: Error) => {
    values(rejectors).map((reject) => {
      // @ts-ignore
      reject(error)
    })
  }

  try {
    logger(Started)
    const txParams: Tx = {
      from: account,
      feeCurrency: feeCurrencyAddress,
      // Hack to prevent web3 from adding the suggested gold gas price, allowing geth to add
      // the suggested price in the selected feeCurrency.
      gasPrice: gasPrice ? gasPrice : '0',
      nonce,
    }

    if (estimatedGas === undefined) {
      estimatedGas = (await estimateGas(tx, txParams)).toNumber()
      logger(EstimatedGas(estimatedGas))
    }

    tx.send({ ...txParams, gas: estimatedGas })
      // @ts-ignore
      .once('receipt', (r: TransactionReceipt) => {
        logger(ReceiptReceived(r))
        if (resolvers.receipt) {
          resolvers.receipt(r)
        }
      })
      .once('transactionHash', (txHash: string) => {
        logger(TransactionHashReceived(txHash))

        if (resolvers.transactionHash) {
          resolvers.transactionHash(txHash)
        }
      })
      .once('confirmation', (confirmationNumber: number) => {
        logger(Confirmed(confirmationNumber))
        resolvers.confirmation(true)
      })
      .once('error', (error: Error) => {
        logger(Failed(error))
        rejectAll(error)
      })
  } catch (error) {
    logger(Exception(error))
    rejectAll(error)
  }

  return {
    receipt,
    transactionHash,
    confirmation,
  }
}
