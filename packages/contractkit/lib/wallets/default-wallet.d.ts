import { EncodedTransaction, Tx } from 'web3-core';
import { Address } from '../base';
import { EIP712TypedData } from '../utils/sign-typed-data-utils';
import { Wallet } from './wallet';
export declare class DefaultWallet implements Wallet {
    private readonly privateKeys;
    addAccount(privateKey: string): void;
    getAccounts(): Address[];
    hasAccount(address?: string): boolean;
    signTransaction(txParams: Tx): Promise<EncodedTransaction>;
    /**
     * Sign a personal Ethereum signed message.
     * The address must be provided it must match the address calculated from the private key.
     * @param address Address of the account to sign with
     * @param data Hex string message to sign
     * @return Signature hex string (order: rsv)
     */
    signPersonalMessage(address: string, data: string): Promise<string>;
    /**
     * Sign an EIP712 Typed Data message. The signing address will be calculated from the private key.
     * The address must be provided it must match the address calculated from the private key.
     * @param address Address of the account to sign with
     * @param data the typed data object
     * @return Signature hex string (order: rsv)
     */
    signTypedData(address: Address, typedData: EIP712TypedData): Promise<string>;
    private getPrivateKeyFor;
}
