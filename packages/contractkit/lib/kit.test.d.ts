/// <reference types="jest" />
import { PromiEvent, TransactionReceipt, Tx } from 'web3-core';
import { TransactionObject } from 'web3-eth';
interface TransactionObjectStub<T> extends TransactionObject<T> {
    sendMock: jest.Mock<PromiEvent<any>, [Tx | undefined]>;
    estimateGasMock: jest.Mock<Promise<number>, []>;
    resolveHash(hash: string): void;
    resolveReceipt(receipt: TransactionReceipt): void;
    rejectHash(error: any): void;
    rejectReceipt(receipt: TransactionReceipt, error: any): void;
}
export declare function txoStub<T>(): TransactionObjectStub<T>;
export {};
