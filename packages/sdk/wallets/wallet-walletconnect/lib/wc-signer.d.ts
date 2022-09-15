/// <reference types="node" />
import { CeloTx, EncodedTransaction, Signer } from '@celo/connect';
import { EIP712TypedData } from '@celo/utils/src/sign-typed-data-utils';
import WalletConnect from '@walletconnect/client';
import { SessionTypes } from '@walletconnect/types';
/**
 * Implements the signer interface on top of the WalletConnect interface.
 */
export declare class WalletConnectSigner implements Signer {
    protected client: WalletConnect;
    protected session: SessionTypes.Settled;
    protected account: string;
    protected chainId: string;
    /**
     * Construct a new instance of a WalletConnectSigner
     */
    constructor(client: WalletConnect, session: SessionTypes.Settled, account: string, chainId: string);
    signTransaction(): Promise<{
        v: number;
        r: Buffer;
        s: Buffer;
    }>;
    private request;
    signRawTransaction(tx: CeloTx): Promise<EncodedTransaction>;
    signTypedData(data: EIP712TypedData): Promise<{
        v: number;
        r: Buffer;
        s: Buffer;
    }>;
    signPersonalMessage(data: string): Promise<{
        v: number;
        r: Buffer;
        s: Buffer;
    }>;
    getNativeKey: () => string;
    decrypt(data: Buffer): Promise<Buffer>;
    computeSharedSecret(publicKey: string): Promise<Buffer>;
}
