/// <reference types="node" />
import { Bip39, MnemonicLanguages, MnemonicStrength } from '@celo/base/lib/account';
export { Bip39, CELO_DERIVATION_PATH_BASE, MnemonicLanguages, MnemonicStrength, RandomNumberGenerator, } from '@celo/base/lib/account';
export declare function generateMnemonic(strength?: MnemonicStrength, language?: MnemonicLanguages, bip39ToUse?: Bip39): Promise<string>;
export declare function validateMnemonic(mnemonic: string, language?: MnemonicLanguages, bip39ToUse?: Bip39): boolean;
export declare function generateKeys(mnemonic: string, password?: string, changeIndex?: number, addressIndex?: number, bip39ToUse?: Bip39, derivationPath?: string): Promise<{
    privateKey: string;
    publicKey: string;
    address: string;
}>;
export declare function generateDeterministicInviteCode(recipientPhoneHash: string, recipientPepper: string, addressIndex?: number, changeIndex?: number, derivationPath?: string): {
    privateKey: string;
    publicKey: string;
};
export declare function generateSeed(mnemonic: string, password?: string, bip39ToUse?: Bip39, keyByteLength?: number): Promise<Buffer>;
export declare function generateKeysFromSeed(seed: Buffer, changeIndex?: number, addressIndex?: number, derivationPath?: string): {
    privateKey: string;
    publicKey: string;
    address: string;
};
export declare const AccountUtils: {
    generateMnemonic: typeof generateMnemonic;
    validateMnemonic: typeof validateMnemonic;
    generateKeys: typeof generateKeys;
    generateSeed: typeof generateSeed;
    generateKeysFromSeed: typeof generateKeysFromSeed;
};
