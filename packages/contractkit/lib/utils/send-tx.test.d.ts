/// <reference types="jest" />
import { TransactionObject, Tx } from 'web3/eth/types';
import PromiEvent from 'web3/promiEvent';
import { TransactionReceipt } from 'web3/types';
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
