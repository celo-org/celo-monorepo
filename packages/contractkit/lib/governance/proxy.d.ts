import Web3 from 'web3';
import { ABIDefinition } from 'web3-eth-abi';
export declare const PROXY_ABI: ABIDefinition[];
export declare const getImplementationOfProxy: (web3: Web3, proxyContractAddress: string) => Promise<string>;
export declare const setImplementationOnProxy: (address: string) => any;
