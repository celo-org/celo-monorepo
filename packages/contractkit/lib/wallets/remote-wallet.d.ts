import { EncodedTransaction, Tx } from 'web3-core';
import { Address } from '../base';
import { EIP712TypedData } from '../utils/sign-typed-data-utils';
import { Signer } from './signers/signer';
import { Wallet, WalletBase } from './wallet';
/**
 * Abstract class representing a remote wallet that requires async initialization
 */
export declare abstract class RemoteWallet extends WalletBase implements Wallet {
    private setupFinished;
    private setupLocked;
    private INIT_TIMEOUT_IN_MS;
    /**
     * Discovers wallet accounts and caches results in memory
     * Idempotent to ensure multiple calls are benign
     */
    init(): Promise<void>;
    /**
     * Monitor the initialization state until it reaches completion or time out
     */
    private initCompleted;
    /**
     * Discover accounts and store mapping in accountSigners
     */
    protected abstract loadAccountSigners(): Promise<Map<Address, Signer>>;
    /**
     * Get a list of accounts in the remote wallet
     */
    getAccounts(): Address[];
    /**
     * Returns true if account is in the remote wallet
     * @param address Account to check
     */
    hasAccount(address?: Address): boolean;
    /**
     * Signs the EVM transaction using the signer pulled from the from field
     * @param txParams EVM transaction
     */
    signTransaction(txParams: Tx): Promise<EncodedTransaction>;
    /**
     * @param address Address of the account to sign with
     * @param data Hex string message to sign
     * @return Signature hex string (order: rsv)
     */
    signPersonalMessage(address: Address, data: string): Promise<string>;
    /**
     * @param address Address of the account to sign with
     * @param typedData the typed data object
     * @return Signature hex string (order: rsv)
     */
    signTypedData(address: Address, typedData: EIP712TypedData): Promise<string>;
    protected initializationRequired(): void;
}
