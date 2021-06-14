import { provider } from 'web3-core';
import { Callback, JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';
import { Wallet } from '../wallets/wallet';
export declare class CeloProvider {
    readonly existingProvider: provider;
    private readonly rpcCaller;
    private readonly paramsPopulator;
    private alreadyStopped;
    wallet: Wallet;
    constructor(existingProvider: provider, wallet?: Wallet);
    addAccount(privateKey: string): void;
    getAccounts(): Promise<string[]>;
    isLocalAccount(address?: string): boolean;
    /**
     * Send method as expected by web3.js
     */
    send(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void;
    stop(): void;
    private handleAccounts;
    private handleSignTypedData;
    private handleSignPersonalMessage;
    private handleSignTransaction;
    private handleSendTransaction;
    private forwardSend;
    private checkPayloadWithAtLeastNParams;
    private addProviderDelegatedFunctions;
    get connected(): any;
    supportsSubscriptions(): any;
    private defaultOn;
    private defaultOnce;
    private defaultRemoveListener;
    private defaultRemoveAllListeners;
    private defaultReset;
}
