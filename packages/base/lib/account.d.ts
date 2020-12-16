/// <reference types="node" />
export declare const CELO_DERIVATION_PATH_BASE = "m/44'/52752'/0'";
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
export declare type RandomNumberGenerator = (size: number, callback: (err: Error | null, buf: Buffer) => void) => void;
export interface Bip39 {
    mnemonicToSeedSync: (mnemonic: string, password?: string) => Buffer;
    mnemonicToSeed: (mnemonic: string, password?: string) => Promise<Buffer>;
    generateMnemonic: (strength?: number, rng?: RandomNumberGenerator, wordlist?: string[]) => Promise<string>;
    validateMnemonic: (mnemonic: string, wordlist?: string[]) => boolean;
}
