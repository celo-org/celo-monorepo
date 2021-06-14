/// <reference types="node" />
export declare const CELO_DERIVATION_PATH_BASE = "m/44'/52752'/0'/0";
export declare enum MnemonicStrength {
    s128_12words = 128,
    s256_24words = 256
}
export declare enum MnemonicLanguages {
    chinese_simplified = 0,
    chinese_traditional = 1,
    english = 2,
    french = 3,
    italian = 4,
    japanese = 5,
    korean = 6,
    spanish = 7
}
declare type RandomNumberGenerator = (size: number, callback: (err: Error | null, buf: Buffer) => void) => void;
interface Bip39 {
    mnemonicToSeedSync: (mnemonic: string, password?: string) => Buffer;
    mnemonicToSeed: (mnemonic: string, password?: string) => Promise<Buffer>;
    generateMnemonic: (strength?: number, rng?: RandomNumberGenerator, wordlist?: string[]) => Promise<string>;
    validateMnemonic: (mnemonic: string, wordlist?: string[]) => boolean;
}
export declare function generateMnemonic(strength?: MnemonicStrength, language?: MnemonicLanguages, bip39ToUse?: Bip39): Promise<string>;
export declare function validateMnemonic(mnemonic: string, language?: MnemonicLanguages, bip39ToUse?: Bip39): boolean;
export declare function generateKeys(mnemonic: string, password?: string, addressIndex?: number, bip39ToUse?: Bip39, derivationPath?: string): Promise<{
    privateKey: string;
    publicKey: string;
}>;
export declare function generateKeysSync(mnemonic: string, password?: string, addressIndex?: number, bip39ToUse?: Bip39): {
    privateKey: string;
    publicKey: string;
};
export declare const AccountUtils: {
    generateMnemonic: typeof generateMnemonic;
    validateMnemonic: typeof validateMnemonic;
    generateKeys: typeof generateKeys;
    generateKeysSync: typeof generateKeysSync;
};
export {};
