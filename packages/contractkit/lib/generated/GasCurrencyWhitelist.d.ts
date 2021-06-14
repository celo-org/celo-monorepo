import Web3 from 'web3';
import { GasCurrencyWhitelist } from './types/GasCurrencyWhitelist';
export declare const ABI: ({
    constant: boolean;
    inputs: {
        name: string;
        type: string;
    }[];
    name: string;
    outputs: {
        name: string;
        type: string;
    }[];
    payable: boolean;
    stateMutability: string;
    type: string;
    anonymous?: undefined;
} | {
    anonymous: boolean;
    inputs: {
        indexed: boolean;
        name: string;
        type: string;
    }[];
    name: string;
    type: string;
    constant?: undefined;
    outputs?: undefined;
    payable?: undefined;
    stateMutability?: undefined;
})[];
export declare function newGasCurrencyWhitelist(web3: Web3, address: string): GasCurrencyWhitelist;
