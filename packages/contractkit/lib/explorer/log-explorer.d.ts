import { EventLog, Log, TransactionReceipt } from 'web3-core';
import { ContractKit } from '../kit';
import { ContractDetails } from './base';
export declare function newLogExplorer(kit: ContractKit): Promise<LogExplorer>;
export declare class LogExplorer {
    private kit;
    readonly contractDetails: ContractDetails[];
    private readonly addressMapping;
    constructor(kit: ContractKit, contractDetails: ContractDetails[]);
    fetchTxReceipt(txhash: string): Promise<TransactionReceipt>;
    getKnownLogs(tx: TransactionReceipt): EventLog[];
    tryParseLog(log: Log): null | EventLog;
}
