/// <reference types="node" />
import { RLPEncodedTx, Signer } from '@celo/connect';
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils';
import { Signature } from '@celo/wallet-hsm';
import { KeyManagementServiceClient } from '@google-cloud/kms';
import { BigNumber } from 'bignumber.js';
export declare class GcpHsmSigner implements Signer {
    private client;
    private versionName;
    private publicKey;
    constructor(client: KeyManagementServiceClient, versionName: string, publicKey: BigNumber);
    private findCanonicalSignature;
    private sign;
    signTransaction(addToV: number, encodedTx: RLPEncodedTx): Promise<Signature>;
    signPersonalMessage(data: string): Promise<Signature>;
    signTypedData(typedData: EIP712TypedData): Promise<Signature>;
    getNativeKey(): string;
    decrypt(_ciphertext: Buffer): Promise<Buffer>;
    computeSharedSecret(_publicKey: string): Promise<Buffer>;
}
