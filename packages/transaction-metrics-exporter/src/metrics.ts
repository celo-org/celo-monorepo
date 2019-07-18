import { Counter, Histogram } from 'prom-client'

export const blockheaderCounter = new Counter({
  name: 'block_headers_received',
  help: 'Counter for block headers that were received with a mining address dimension',
  labelNames: ['miner'],
})

const transactionLabelDefs = ['to', 'status', 'methodId']

export const transactionCounter = new Counter({
  name: 'transactions_received',
  help:
    'Counter for transactions received with dimensions of the receiving address, status of the transaction as well as the methodId',
  labelNames: transactionLabelDefs,
})

export const transactionLogsCounter = new Counter({
  name: 'transaction_logs_received',
  help:
    'Counter for transaction logs received with dimensions of the receiving address, status of the transaction as well as the methodId',
  labelNames: transactionLabelDefs,
})

export const parsedTransactionCounter = new Counter({
  name: 'parsed_transaction_received',
  help:
    'Counter for parsed transactions received with dimensions of the contract and function name',
  labelNames: ['contract', 'function'],
})

export const transactionParsedLogsCounter = new Counter({
  name: 'transaction_parsed_logs_received',
  help:
    'Counter for parsed transaction logs received with dimensions of the contract and event name',
  labelNames: ['contract', 'function', 'log'],
})

function bucket(x: number, y: number) {
  return x * Math.pow(10, y)
}

export const transactionGasUsed = new Histogram({
  name: 'transactions_gas_used',
  help:
    'Histogram for how much gas is used with dimensions of the receiving address, status of the transaction as well as the methodId',
  labelNames: transactionLabelDefs,
  buckets: [
    0,
    bucket(25, 3),
    bucket(50, 3),
    bucket(1, 5),
    bucket(2, 5),
    bucket(5, 5),
    bucket(1, 6),
    bucket(2, 6),
    bucket(4, 6),
  ],
})
