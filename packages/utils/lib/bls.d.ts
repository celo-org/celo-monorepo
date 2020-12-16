export declare const BLS_PUBLIC_KEY_SIZE = 96;
export declare const BLS_POP_SIZE = 48;
export declare const blsPrivateKeyToProcessedPrivateKey: (privateKeyHex: string) => any;
export declare const getBlsPublicKey: (privateKeyHex: string) => string;
export declare const getBlsPoP: (address: string, privateKeyHex: string) => string;
