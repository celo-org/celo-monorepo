"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prom_client_1 = require("prom-client");
var TransactionLabels = ['to', 'status', 'methodId'];
var bucket = function (x, y) { return x * Math.pow(10, y); };
exports.transactionGasUsed = new prom_client_1.Histogram({
    name: 'transactions_gas_used',
    help: 'Histogram for how much gas is used with dimensions of the receiving address, status of the transaction as well as the methodId',
    labelNames: TransactionLabels,
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
});
exports.Counters = {
    blockheader: new prom_client_1.Counter({
        name: 'block_headers_received',
        help: 'Counter for block headers that were received with a mining address dimension',
        labelNames: ['miner'],
    }),
    transaction: new prom_client_1.Counter({
        name: 'transactions_received',
        help: 'Counter for transactions received with dimensions of the receiving address, status of the transaction as well as the methodId',
        labelNames: TransactionLabels,
    }),
    transactionLogs: new prom_client_1.Counter({
        name: 'transaction_logs_received',
        help: 'Counter for transaction logs received with dimensions of the receiving address, status of the transaction as well as the methodId',
        labelNames: TransactionLabels,
    }),
    parsedTransaction: new prom_client_1.Counter({
        name: 'parsed_transaction_received',
        help: 'Counter for parsed transactions received with dimensions of the contract and function name',
        labelNames: ['contract', 'function'],
    }),
    transactionParsedLogs: new prom_client_1.Counter({
        name: 'transaction_parsed_logs_received',
        help: 'Counter for parsed transaction logs received with dimensions of the contract and event name',
        labelNames: ['contract', 'function', 'log'],
    }),
    transactionGasUsed: exports.transactionGasUsed,
};
//# sourceMappingURL=metrics.js.map