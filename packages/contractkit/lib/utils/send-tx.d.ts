import { TransactionObject } from 'web3/eth/types';
import { Address } from '../base';
import { TransactionResult } from './tx-result';
export interface TxOptions {
    gasInflationFactor?: number;
    gasFeeRecipient?: Address;
    gasCurrency?: Address | undefined;
    from?: Address;
    estimatedGas?: number | undefined;
}
/**
 * sendTransaction mainly abstracts the sending of a transaction in a promise like
 * interface.
 */
export declare function sendTransaction<T>(tx: TransactionObject<T>, txOptions?: TxOptions): Promise<TransactionResult>;
