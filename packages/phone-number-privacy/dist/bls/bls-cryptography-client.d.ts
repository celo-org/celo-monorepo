export declare class BLSCryptographyClient {
    static computeBlindedSignature(base64BlindedMessage: string): Promise<string>;
    private static privateKey;
    /**
     * Get singleton privateKey
     */
    private static getPrivateKey;
}
