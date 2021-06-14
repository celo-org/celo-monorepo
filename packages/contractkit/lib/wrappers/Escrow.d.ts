import { Escrow } from '../generated/Escrow';
import { BaseWrapper } from './BaseWrapper';
/**
 * Contract for handling reserve for stable currencies
 */
export declare class EscrowWrapper extends BaseWrapper<Escrow> {
    escrowedPayments: (arg0: string) => Promise<{
        recipientIdentifier: string;
        sender: string;
        token: string;
        value: string;
        sentIndex: string;
        receivedIndex: string;
        timestamp: string;
        expirySeconds: string;
        minAttestations: string;
        0: string;
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
        6: string;
        7: string;
        8: string;
    }>;
    receivedPaymentIds: (arg0: string | number[], arg1: string | number) => Promise<string>;
    sentPaymentIds: (arg0: string, arg1: string | number) => Promise<string>;
    getReceivedPaymentIds: (identifier: string | number[]) => Promise<string[]>;
    getSentPaymentIds: (sender: string) => Promise<string[]>;
    transfer: (identifier: string | number[], token: string, value: string | number, expirySeconds: string | number, paymentId: string, minAttestations: string | number) => import("./BaseWrapper").CeloTransactionObject<boolean>;
    withdraw: (paymentId: string, v: string | number, r: string | number[], s: string | number[]) => import("./BaseWrapper").CeloTransactionObject<boolean>;
    revoke: (paymentId: string) => import("./BaseWrapper").CeloTransactionObject<boolean>;
}
