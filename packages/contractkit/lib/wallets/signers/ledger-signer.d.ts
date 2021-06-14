/// <reference types="node" />
import { EIP712TypedData } from '../../utils/sign-typed-data-utils';
import { RLPEncodedTx } from '../../utils/signing-utils';
import { AddressValidation } from '../ledger-wallet';
import { Signer } from './signer';
/**
 * Signs the EVM transaction with a Ledger device
 */
export declare class LedgerSigner implements Signer {
    private ledger;
    private derivationPath;
    private validated;
    private ledgerAddressValidation;
    private appConfiguration;
    constructor(ledger: any, derivationPath: string, ledgerAddressValidation: AddressValidation, appConfiguration?: {
        arbitraryDataEnabled: number;
        version: string;
    });
    getNativeKey(): string;
    signTransaction(addToV: number, encodedTx: RLPEncodedTx): Promise<{
        v: number;
        r: Buffer;
        s: Buffer;
    }>;
    signPersonalMessage(data: string): Promise<{
        v: number;
        r: Buffer;
        s: Buffer;
    }>;
    signTypedData(typedData: EIP712TypedData): Promise<{
        v: number;
        r: Buffer;
        s: Buffer;
    }>;
    private getValidatedDerivationPath;
    private validationRequired;
    /**
     * Display ERC20 info on ledger if contract is well known
     * @param rlpEncoded Encoded transaction
     */
    private checkForKnownToken;
}
