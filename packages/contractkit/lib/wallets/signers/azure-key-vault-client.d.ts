/// <reference types="node" />
import { BigNumber } from 'bignumber.js';
/**
 * Provides an abstraction on Azure Key Vault for performing signing operations
 */
export declare class AzureKeyVaultClient {
    private readonly vaultName;
    private readonly vaultUri;
    private readonly credential;
    private readonly keyClient;
    private readonly SIGNING_ALGORITHM;
    private readonly publicKeyPrefix;
    private readonly secp256k1Curve;
    private cryptographyClientSet;
    constructor(vaultName: string);
    getKeys(): Promise<string[]>;
    getPublicKey(keyName: string): Promise<BigNumber>;
    getKeyId(keyName: string): Promise<string>;
    signMessage(message: Buffer, keyName: string): Promise<Signature>;
    hasKey(keyName: string): Promise<boolean>;
    /**
     * Returns true if the signature is in the "bottom" of the curve
     */
    private static isCanonical;
    /**
     * Attempts each recovery key to find a match
     */
    private static recoverKeyIndex;
    private getKey;
    private static bufferToBigNumber;
    private static bigNumberToBuffer;
    /**
     * Provides the CryptographyClient for the requested key
     * Creates a new client if it doesn't already exist
     */
    private getCryptographyClient;
}
export declare class Signature {
    v: number;
    r: Buffer;
    s: Buffer;
    constructor(v: number, r: Buffer, s: Buffer);
}
