import BigNumber from 'bignumber.js';
import { TransactionObject } from 'web3-eth';
import { Address } from '../base';
import { MultiSig } from '../generated/MultiSig';
import { BaseWrapper, CeloTransactionObject } from './BaseWrapper';
export interface TransactionData {
    destination: string;
    value: BigNumber;
    data: string;
    executed: boolean;
    confirmations: string[];
}
/**
 * Contract for handling multisig actions
 */
export declare class MultiSigWrapper extends BaseWrapper<MultiSig> {
    /**
     * Allows an owner to submit and confirm a transaction.
     * If an unexecuted transaction matching `txObject` exists on the multisig, adds a confirmation to that tx ID.
     * Otherwise, submits the `txObject` to the multisig and add confirmation.
     * @param index The index of the pending withdrawal to withdraw.
     */
    submitOrConfirmTransaction(destination: string, txObject: TransactionObject<any>, value?: string): Promise<CeloTransactionObject<void> | CeloTransactionObject<string>>;
    isowner: (owner: Address) => Promise<boolean>;
    getOwners: () => Promise<string[]>;
    getRequired: () => Promise<BigNumber>;
    getInternalRequired: () => Promise<BigNumber>;
    getTransactionCount: () => Promise<number>;
    replaceOwner: (owner: Address, newOwner: Address) => CeloTransactionObject<void>;
    getTransaction(i: number): Promise<TransactionData>;
    getTransactions(): Promise<TransactionData[]>;
}
