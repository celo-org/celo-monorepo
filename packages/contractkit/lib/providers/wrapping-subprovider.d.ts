import { Callback, ErrorCallback, JSONRPCRequestPayload, Subprovider } from '@0x/subproviders';
import { Provider } from 'web3/providers';
export declare class WrappingSubprovider extends Subprovider {
    readonly provider: Provider;
    constructor(provider: Provider);
    /**
     * @param payload JSON RPC request payload
     * @param next A callback to pass the request to the next subprovider in the stack
     * @param end A callback called once the subprovider is done handling the request
     */
    handleRequest(payload: JSONRPCRequestPayload, _next: Callback, end: ErrorCallback): Promise<void>;
}
