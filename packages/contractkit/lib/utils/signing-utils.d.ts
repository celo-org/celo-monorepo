/// <reference types="node" />
import { EncodedTransaction, Tx } from 'web3-core';
import { EIP712TypedData } from './sign-typed-data-utils';
export interface RLPEncodedTx {
    transaction: Tx;
    rlpEncode: any;
}
export declare function chainIdTransformationForSigning(chainId: number): number;
export declare function getHashFromEncoded(rlpEncode: string): string;
export declare function rlpEncodedTx(tx: Tx): RLPEncodedTx;
export declare function encodeTransaction(rlpEncoded: RLPEncodedTx, signature: {
    v: number;
    r: Buffer;
    s: Buffer;
}): Promise<EncodedTransaction>;
export declare function recoverTransaction(rawTx: string): [Tx, string];
export declare function recoverMessageSigner(signingDataHex: string, signedData: string): string;
export declare function verifyEIP712TypedDataSigner(typedData: EIP712TypedData, signedData: string, expectedAddress: string): boolean;
