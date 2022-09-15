/// <reference types="node" />
import { Address } from '@celo/base';
import { CeloTx } from '@celo/connect';
import { EIP712TypedData } from '@celo/utils/src/sign-typed-data-utils';
export declare function parsePersonalSign(params: any): {
    from: string;
    payload: string;
};
export declare function parseSignTypedData(params: any): {
    from: string;
    payload: EIP712TypedData;
};
export declare function parseSignTransaction(params: any): CeloTx;
export declare function parseComputeSharedSecret(params: any): {
    from: Address;
    publicKey: string;
};
export declare function parseDecrypt(params: any): {
    from: string;
    payload: Buffer;
};
export declare const testWallet: import("@celo/connect").ReadOnlyWallet;
export declare const testPrivateKey = "04f9d516be49bb44346ca040bdd2736d486bca868693c74d51d274ad92f61976";
export declare const testAddress: string;
