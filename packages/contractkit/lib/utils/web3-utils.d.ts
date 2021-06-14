import { Tx } from 'web3-core';
import { ABIDefinition, DecodedParamsObject } from 'web3-eth-abi';
export declare const getAbiTypes: (abi: ABIDefinition[], methodName: string) => string[];
export declare const parseDecodedParams: (params: DecodedParamsObject) => {
    args: any[];
    params: DecodedParamsObject;
};
export declare const estimateGas: (tx: Tx, gasEstimator: (tx: Tx) => Promise<number>, caller: (tx: Tx) => Promise<string>) => Promise<number>;
