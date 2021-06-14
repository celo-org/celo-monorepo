import { Counter, Histogram } from 'prom-client';
export declare const transactionGasUsed: Histogram;
export declare const Counters: {
    blockheader: Counter;
    transaction: Counter;
    transactionLogs: Counter;
    parsedTransaction: Counter;
    transactionParsedLogs: Counter;
    transactionGasUsed: Histogram;
};
