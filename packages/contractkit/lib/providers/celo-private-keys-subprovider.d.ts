import { Callback, ErrorCallback, PrivateKeyWalletSubprovider } from '@0x/subproviders';
import { JSONRPCRequestPayload } from 'ethereum-types';
import { CeloPartialTxParams } from '../utils/tx-signing';
export declare function generateAccountAddressFromPrivateKey(privateKey: string): string;
/**
 * This class supports storing multiple private keys for signing.
 * The base class PrivateKeyWalletSubprovider only supports one key.
 */
export declare class CeloPrivateKeysWalletProvider extends PrivateKeyWalletSubprovider {
    readonly privateKey: string;
    private readonly accountAddressToPrivateKey;
    private chainId;
    private gatewayFeeRecipient;
    constructor(privateKey: string);
    addAccount(privateKey: string): void;
    getAccounts(): string[];
    getAccountsAsync(): Promise<string[]>;
    handleRequest(payload: JSONRPCRequestPayload, next: Callback, end: ErrorCallback): Promise<void>;
    signTransactionAsync(txParamsInput: CeloPartialTxParams): Promise<string>;
    private canSign;
    private getPrivateKeyFor;
    private getChainId;
    private getNonce;
    private getCoinbase;
    private getGasPrice;
    private getGasPriceInCeloGold;
}
