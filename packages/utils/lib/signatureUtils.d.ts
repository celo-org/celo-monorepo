import { NativeSigner, serializeSignature, Signer } from '@celo/base/lib/signatureUtils';
import { EIP712TypedData } from './sign-typed-data-utils';
export { NativeSigner, POP_SIZE, serializeSignature, Signature, Signer, } from '@celo/base/lib/signatureUtils';
export declare function hashMessageWithPrefix(message: string): any;
export declare function hashMessage(message: string): string;
export declare function addressToPublicKey(signer: string, signFn: (message: string, signer: string) => Promise<string>): Promise<string>;
export declare function LocalSigner(privateKey: string): Signer;
export declare function signedMessageToPublicKey(message: string, v: number, r: string, s: string): string;
export declare function signMessage(message: string, privateKey: string, address: string): {
    v: any;
    r: any;
    s: any;
};
export declare function signMessageWithoutPrefix(messageHash: string, privateKey: string, address: string): {
    v: any;
    r: any;
    s: any;
};
export declare function verifySignature(message: string, signature: string, signer: string): boolean;
export declare function parseSignature(message: string, signature: string, signer: string): {
    v: number;
    r: string;
    s: string;
};
export declare function parseSignatureWithoutPrefix(messageHash: string, signature: string, signer: string): {
    v: number;
    r: string;
    s: string;
};
export declare function recoverEIP712TypedDataSigner(typedData: EIP712TypedData, signature: string): string;
export declare function guessSigner(message: string, signature: string): string;
export declare const SignatureUtils: {
    NativeSigner: typeof NativeSigner;
    LocalSigner: typeof LocalSigner;
    signMessage: typeof signMessage;
    signMessageWithoutPrefix: typeof signMessageWithoutPrefix;
    parseSignature: typeof parseSignature;
    parseSignatureWithoutPrefix: typeof parseSignatureWithoutPrefix;
    serializeSignature: typeof serializeSignature;
    recoverEIP712TypedDataSigner: typeof recoverEIP712TypedDataSigner;
};
