import { PromiEvent, TransactionReceipt } from 'web3-core';
/**
 * Transforms a `PromiEvent` to a `TransactionResult`.
 *
 * PromiEvents are returned by web3 when we do a `contract.method.xxx.send()`
 */
export declare function toTxResult(pe: PromiEvent<any>): TransactionResult;
/**
 * Replacement interface for web3's `PromiEvent`. Instead of emiting events
 * to signal different stages, eveything is exposed as a promise. Which ends
 * up being nicer when doing promise/async based programming.
 */
export declare class TransactionResult {
    private hashFuture;
    private receiptFuture;
    constructor(pe: PromiEvent<any>);
    /** Get (& wait for) transaction hash */
    getHash(): Promise<string>;
    /** Get (& wait for) transaction receipt */
    waitReceipt(): Promise<TransactionReceipt>;
}
