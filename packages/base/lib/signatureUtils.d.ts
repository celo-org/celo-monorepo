export declare const POP_SIZE = 65;
export interface Signer {
    sign: (message: string) => Promise<string>;
}
export declare function NativeSigner(signFn: (message: string, signer: string) => Promise<string>, signer: string): Signer;
export interface Signature {
    v: number;
    r: string;
    s: string;
}
export declare function serializeSignature(signature: Signature): string;
export declare const SignatureBase: {
    NativeSigner: typeof NativeSigner;
    serializeSignature: typeof serializeSignature;
};
