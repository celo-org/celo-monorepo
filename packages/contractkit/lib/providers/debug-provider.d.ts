import Web3 from 'web3';
import { Callback, JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers';
declare class DebugProvider implements Provider {
    private provider;
    constructor(provider: Provider);
    send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): any;
}
export declare function wrap(provider: Provider): DebugProvider;
export declare function injectDebugProvider(web3: Web3): void;
export {};
