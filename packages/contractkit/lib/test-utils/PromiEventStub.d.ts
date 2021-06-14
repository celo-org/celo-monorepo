/// <reference types="node" />
import { EventEmitter } from 'events';
import { PromiEvent, TransactionReceipt } from 'web3-core';
interface PromiEventStub<T> extends PromiEvent<T> {
    emitter: EventEmitter;
    resolveHash(hash: string): void;
    resolveReceipt(receipt: TransactionReceipt): void;
    rejectHash(error: any): void;
    rejectReceipt(receipt: TransactionReceipt, error: any): void;
}
export declare function promiEventSpy<T>(): PromiEventStub<T>;
export {};
