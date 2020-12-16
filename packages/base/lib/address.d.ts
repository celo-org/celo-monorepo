/// <reference types="node" />
export declare type Address = string;
export declare const eqAddress: (a: string, b: string) => boolean;
export declare const normalizeAddress: (a: string) => string;
export declare const isNullAddress: (a: string) => boolean;
export declare const normalizeAddressWith0x: (a: string) => string;
export declare const trimLeading0x: (input: string) => string;
export declare const ensureLeading0x: (input: string) => string;
export declare const getAddressChunks: (input: string) => string[];
export declare const isHexString: (input: string) => boolean;
export declare const hexToBuffer: (input: string) => Buffer;
export declare const bufferToHex: (buf: Buffer) => string;
export declare const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
export declare const findAddressIndex: (address: string, addresses: string[]) => number;
export declare const mapAddressListOnto: (oldAddress: string[], newAddress: string[]) => any[];
export declare function mapAddressListDataOnto<T>(data: T[], oldAddress: Address[], newAddress: Address[], initialValue: T): T[];
