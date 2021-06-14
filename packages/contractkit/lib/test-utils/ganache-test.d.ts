import Web3 from 'web3';
export declare const NetworkConfig: any;
export declare function jsonRpcCall<O>(web3: Web3, method: string, params: any[]): Promise<O>;
export declare function evmRevert(web3: Web3, snapId: string): Promise<void>;
export declare function evmSnapshot(web3: Web3): Promise<string>;
export declare function testWithGanache(name: string, fn: (web3: Web3) => void): void;
