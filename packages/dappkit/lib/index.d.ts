import { ContractKit } from '@celo/contractkit';
import { AccountAuthResponseSuccess, DappKitRequestMeta, SignTxResponseSuccess } from '@celo/utils';
import { ContractSendMethod } from 'web3-eth-contract';
export { AccountAuthRequest, DappKitRequestMeta, serializeDappKitRequestDeeplink, SignTxRequest, } from '@celo/utils/';
export declare function listenToAccount(callback: (account: string) => void): void;
export declare function waitForAccountAuth(requestId: string): Promise<AccountAuthResponseSuccess>;
export declare function waitForSignedTxs(requestId: string): Promise<SignTxResponseSuccess>;
export declare function listenToSignedTxs(callback: (signedTxs: string[]) => void): void;
export declare function requestAccountAddress(meta: DappKitRequestMeta): void;
export declare enum FeeCurrency {
    cUSD = "cUSD",
    cGLD = "cGLD"
}
export interface TxParams {
    tx: ContractSendMethod;
    from: string;
    to?: string;
    feeCurrency?: FeeCurrency;
    estimatedGas?: number;
    value?: string;
}
export declare function requestTxSig(kit: ContractKit, txParams: TxParams[], meta: DappKitRequestMeta): Promise<void>;
