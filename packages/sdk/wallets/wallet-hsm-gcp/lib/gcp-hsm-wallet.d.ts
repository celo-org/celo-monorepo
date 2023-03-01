import { Address, ReadOnlyWallet } from '@celo/connect';
import { RemoteWallet } from '@celo/wallet-remote';
import { GcpHsmSigner } from './gcp-hsm-signer';
/**
 * A Cloud HSM wallet built on GCP.
 */
export declare class GcpHsmWallet extends RemoteWallet<GcpHsmSigner> implements ReadOnlyWallet {
    private readonly versionName;
    private client;
    constructor(versionName: string);
    private generateKmsClient;
    protected loadAccountSigners(): Promise<Map<Address, GcpHsmSigner>>;
    private getPublicKeyFromVersionName;
    /**
     * Converts key from PEM to DER encoding.
     *
     * DER (Distinguished Encoding Rules) is a binary encoding for X.509 certificates and private keys.
     * Unlike PEM, DER-encoded files do not contain plain text statements such as -----BEGIN CERTIFICATE-----
     *
     * https://www.ssl.com/guide/pem-der-crt-and-cer-x-509-encodings-and-conversions/#:~:text=DER%20(Distinguished%20Encoding%20Rules)%20is,commonly%20seen%20in%20Java%20contexts.
     */
    private pemToDerEncode;
    /**
     * Returns the EVM address for the given key
     * Useful for initially getting the 'from' field given a keyName
     * @param versionName GCP version name for the HSM
     */
    getAddressFromVersionName(versionName: string): Promise<Address>;
}
