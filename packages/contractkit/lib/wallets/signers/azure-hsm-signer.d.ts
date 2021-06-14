/// <reference types="node" />
import { AzureKeyVaultClient } from '../../utils/azure-key-vault-client';
import { RLPEncodedTx } from '../../utils/signing-utils';
import { Signer } from './signer';
/**
 * Signs the EVM transaction using an HSM key in Azure Key Vault
 */
export declare class AzureHSMSigner implements Signer {
    private static keyVaultClient;
    private keyName;
    constructor(keyVaultClient: AzureKeyVaultClient, keyName: string);
    signTransaction(addToV: number, encodedTx: RLPEncodedTx): Promise<{
        v: number;
        r: Buffer;
        s: Buffer;
    }>;
    signPersonalMessage(data: string): Promise<{
        v: number;
        r: Buffer;
        s: Buffer;
    }>;
    getNativeKey(): string;
}
