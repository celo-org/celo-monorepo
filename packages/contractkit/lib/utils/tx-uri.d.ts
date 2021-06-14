import { Tx } from 'web3-core';
export declare function parseUri(uri: string): Tx;
export declare function buildUri(tx: Tx, functionName?: string, abiTypes?: string[]): string;
export declare function QrFromUri(uri: string, type: 'svg' | 'terminal' | 'utf8'): Promise<string>;
