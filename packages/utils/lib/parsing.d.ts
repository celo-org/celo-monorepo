import BigNumber from 'bignumber.js';
export declare const stringToBoolean: (inputString: string) => boolean;
export declare const parseInputAmount: (inputString: string, decimalSeparator?: string) => BigNumber;
/**
 * Parses an "array of strings" that is returned from a Solidity function
 *
 * @param stringLengths length of each string in bytes
 * @param data 0x-prefixed, hex-encoded string data in utf-8 bytes
 */
export declare const parseSolidityStringArray: (stringLengths: number[], data: string) => string[];
