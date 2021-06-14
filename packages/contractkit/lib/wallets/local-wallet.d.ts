import { Wallet, WalletBase } from './wallet';
export declare class LocalWallet extends WalletBase implements Wallet {
    /**
     * Register the private key as signer account
     * @param privateKey account private key
     */
    addAccount(privateKey: string): void;
}
