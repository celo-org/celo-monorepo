/// <reference types="node" />
import { Bip39 } from './account';
/**
 * Turns a private key to a compressed public key (hex string with hex leader).
 *
 * @param {Buffer} privateKey Private key.
 * @returns {string} Corresponding compessed public key in hex encoding with '0x' leader.
 */
export declare function compressedPubKey(privateKey: Buffer): string;
/**
 * Decompresses a public key and strips out the '0x04' leading constant. This makes
 * any public key suitable to be used with this ECIES implementation.
 *
 * @param publicKey Public key in standard form (with 0x02, 0x03, or 0x04 prefix)
 * @returns Decompresssed public key without prefix.
 */
export declare function decompressPublicKey(publicKey: Buffer): Buffer;
/**
 * Derives a data encryption key from the mnemonic
 *
 * @param {string} privateKey Hex encoded private account key.
 * @returns {Buffer} Comment Encryption Private key.
 */
export declare function deriveDek(mnemonic: string, bip39ToUse?: Bip39): Promise<{
    privateKey: string;
    publicKey: string;
    address: string;
}>;
export declare const DataEncryptionKeyUtils: {
    compressedPubKey: typeof compressedPubKey;
    decompressPublicKey: typeof decompressPublicKey;
    deriveDek: typeof deriveDek;
};
