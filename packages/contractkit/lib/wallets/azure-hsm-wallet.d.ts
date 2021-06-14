import { Address } from '@celo/utils/lib/address';
import { RemoteWallet } from './remote-wallet';
import { Signer } from './signers/signer';
import { Wallet } from './wallet';
export declare class AzureHSMWallet extends RemoteWallet implements Wallet {
    private readonly vaultName;
    private keyVaultClient;
    constructor(vaultName: string);
    protected loadAccountSigners(): Promise<Map<Address, Signer>>;
    private generateNewKeyVaultClient;
    /**
     * Returns the EVM address for the given key
     * Useful for initially getting the 'from' field given a keyName
     * @param keyName Azure KeyVault key name
     */
    getAddressFromKeyName(keyName: string): Promise<Address>;
}
