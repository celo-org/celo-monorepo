/// <reference types="node" />
import { RLPEncodedTx } from '../../utils/signing-utils';
import { Signer } from './signer';
/**
 * Signs the EVM transaction using the provided private key
 */
export declare class LocalSigner implements Signer {
    private privateKey;
    constructor(privateKey: string);
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
}
