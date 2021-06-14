import Web3 from 'web3';
import { ReleaseGoldInstance } from './types/ReleaseGoldInstance';
export declare const ABI: ({
    constant: boolean;
    inputs: never[];
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
    constant: boolean;
    inputs: {
        name: string;
        type: string;
    }[];
    name: string;
    outputs: never[];
    payable: boolean;
    stateMutability: string;
    type: string;
    anonymous?: undefined;
} | {
    inputs: {
        name: string;
        type: string;
    }[];
    payable: boolean;
    stateMutability: string;
    type: string;
    constant?: undefined;
    name?: undefined;
    outputs?: undefined;
    anonymous?: undefined;
} | {
    payable: boolean;
    stateMutability: string;
    type: string;
    constant?: undefined;
    inputs?: undefined;
    name?: undefined;
    outputs?: undefined;
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
export declare function newReleaseGoldInstance(web3: Web3, address: string): ReleaseGoldInstance;
