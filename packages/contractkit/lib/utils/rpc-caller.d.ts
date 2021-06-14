import { provider } from 'web3-core';
import { Callback, JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';
export declare function rpcCallHandler(payload: JsonRpcPayload, handler: (p: JsonRpcPayload) => Promise<any>, callback: Callback<JsonRpcResponse>): void;
export declare function getRandomId(): number;
export interface RpcCaller {
    call: (method: string, params: any[]) => Promise<JsonRpcResponse>;
    send: (payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>) => void;
}
export declare class DefaultRpcCaller implements RpcCaller {
    readonly defaultProvider: provider;
    readonly jsonrpcVersion: string;
    constructor(defaultProvider: provider, jsonrpcVersion?: string);
    call(method: string, params: any[]): Promise<JsonRpcResponse>;
    send(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void;
}
