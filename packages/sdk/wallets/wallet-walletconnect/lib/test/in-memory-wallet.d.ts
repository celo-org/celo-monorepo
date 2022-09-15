export declare const testPrivateKey = "04f9d516be49bb44346ca040bdd2736d486bca868693c74d51d274ad92f61976";
export declare const testAddress: string;
export declare function getTestWallet(): {
    init: (uri: string) => Promise<void>;
    close(): Promise<void>;
};
