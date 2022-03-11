/// <reference types="node" />
import { SessionTypes } from '@walletconnect/types';
import { EventEmitter } from 'events';
export declare class MockWalletConnectClient extends EventEmitter {
    init(): void;
    connect(): Promise<void>;
    request(event: SessionTypes.RequestEvent): Promise<string | import("@celo/connect").EncodedTransaction | undefined>;
    disconnect(): void;
}
