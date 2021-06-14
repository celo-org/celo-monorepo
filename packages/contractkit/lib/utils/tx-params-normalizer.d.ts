import { Tx } from 'web3-core';
import { RpcCaller } from './rpc-caller';
export declare class TxParamsNormalizer {
    readonly rpcCaller: RpcCaller;
    private chainId;
    private gatewayFeeRecipient;
    constructor(rpcCaller: RpcCaller);
    populate(celoTxParams: Tx): Promise<Tx>;
    private getChainId;
    private getNonce;
    private getEstimateGas;
    private getCoinbase;
    private getGasPrice;
    private getGasPriceInCeloGold;
}
