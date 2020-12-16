export declare const stringToBoolean: (inputString: string) => boolean;
/**
 * Parses an "array of strings" that is returned from a Solidity function
 *
 * @param stringLengths length of each string in bytes
 * @param data 0x-prefixed, hex-encoded string data in utf-8 bytes
 */
export declare const parseSolidityStringArray: (stringLengths: number[], data: string) => string[];
