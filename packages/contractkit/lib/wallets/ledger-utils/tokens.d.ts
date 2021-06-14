/// <reference types="node" />
import { Address } from '@celo/utils/lib/address';
/**
 * Retrieve the token information by a given contract address and chainId if any
 */
export declare const tokenInfoByAddressAndChainId: (contract: string, chainId: number) => TokenInfo | null | undefined;
/**
 * list all the ERC20 tokens informations
 */
export declare const list: () => TokenInfo[];
export interface TokenInfo {
    contractAddress: Address;
    ticker: string;
    decimals: number;
    chainId: number;
    signature: Buffer;
    data: Buffer;
}
/**
 * @return
 * -1: version1 < version2,
 *  0: version1 == version2,
 *  1: version1 > version2
 */
export declare function compareLedgerAppVersions(version1: string, version2: string): number;
export interface API {
    byContractKey: (arg0: string) => TokenInfo | null | undefined;
    list: () => TokenInfo[];
}
