import { EncodedTransaction, Tx } from 'web3-core';
import { Address } from '../base';
import { EIP712TypedData } from '../utils/sign-typed-data-utils';
import { Signer } from './signers/signer';
export interface Wallet {
    getAccounts: () => Address[];
    hasAccount: (address?: Address) => boolean;
    signTransaction: (txParams: Tx) => Promise<EncodedTransaction>;
    signTypedData: (address: Address, typedData: EIP712TypedData) => Promise<string>;
    signPersonalMessage: (address: Address, data: string) => Promise<string>;
}
export declare abstract class WalletBase implements Wallet {
    private accountSigners;
    /**
     * Gets a list of accounts that have been registered
     */
    getAccounts(): Address[];
    /**
     * Returns true if account has been registered
     * @param address Account to check
     */
    hasAccount(address?: Address): boolean;
    /**
     * Adds the account-signer set to the internal map
     * @param address Account address
     * @param signer Account signer
     */
    protected addSigner(address: Address, signer: Signer): void;
    /**
     * Gets the signer based on the 'from' field in the tx body
     * @param txParams Transaction to sign
     */
    signTransaction(txParams: Tx): Promise<EncodedTransaction>;
    /**
     * Sign a personal Ethereum signed message.
     * @param address Address of the account to sign with
     * @param data Hex string message to sign
     * @return Signature hex string (order: rsv)
     */
    signPersonalMessage(address: Address, data: string): Promise<string>;
    /**
     * Sign an EIP712 Typed Data message.
     * @param address Address of the account to sign with
     * @param typedData the typed data object
     * @return Signature hex string (order: rsv)
     */
    signTypedData(address: Address, typedData: EIP712TypedData): Promise<string>;
    private getSigner;
}
