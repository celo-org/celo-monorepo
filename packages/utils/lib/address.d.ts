export { Address, bufferToHex, ensureLeading0x, eqAddress, findAddressIndex, getAddressChunks, hexToBuffer, isHexString, mapAddressListDataOnto, mapAddressListOnto, normalizeAddress, normalizeAddressWith0x, NULL_ADDRESS, trimLeading0x, } from '@celo/base/lib/address';
export { isValidChecksumAddress, toChecksumAddress } from 'ethereumjs-util';
export declare const privateKeyToAddress: (privateKey: string) => string;
export declare const privateKeyToPublicKey: (privateKey: string) => string;
export declare const publicKeyToAddress: (publicKey: string) => string;
export declare const isValidPrivateKey: (privateKey: string) => boolean;
export declare const isValidAddress: (input: string) => boolean;
