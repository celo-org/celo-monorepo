export declare const DAPPKIT_BASE_HOST = "celo://wallet/dappkit";
export declare enum DappKitRequestTypes {
    ACCOUNT_ADDRESS = "account_address",
    SIGN_TX = "sign_tx"
}
export declare enum DappKitResponseStatus {
    SUCCESS = "200",
    UNAUTHORIZED = "401"
}
export interface DappKitRequestBase {
    type: DappKitRequestTypes;
    callback: string;
    requestId: string;
    dappName: string;
}
export interface DappKitRequestMeta {
    callback: string;
    requestId: string;
    dappName: string;
}
export interface AccountAuthRequest extends DappKitRequestBase {
    type: DappKitRequestTypes.ACCOUNT_ADDRESS;
}
export declare const AccountAuthRequest: (meta: DappKitRequestMeta) => AccountAuthRequest;
export interface AccountAuthResponseSuccess {
    type: DappKitRequestTypes.ACCOUNT_ADDRESS;
    status: DappKitResponseStatus.SUCCESS;
    address: string;
    phoneNumber: string;
}
export declare const AccountAuthResponseSuccess: (address: string, phoneNumber: string) => AccountAuthResponseSuccess;
export interface AccountAuthResponseFailure {
    type: DappKitRequestTypes.ACCOUNT_ADDRESS;
    status: DappKitResponseStatus.UNAUTHORIZED;
}
export declare type AccountAuthResponse = AccountAuthResponseSuccess | AccountAuthResponseFailure;
export interface SignTxResponseSuccess {
    type: DappKitRequestTypes.SIGN_TX;
    status: DappKitResponseStatus.SUCCESS;
    rawTxs: string[];
}
export declare const SignTxResponseSuccess: (rawTxs: string[]) => SignTxResponseSuccess;
export interface SignTxResponseFailure {
    type: DappKitRequestTypes.SIGN_TX;
    status: DappKitResponseStatus.UNAUTHORIZED;
}
export declare type SignTxResponse = SignTxResponseSuccess | SignTxResponseFailure;
export declare type DappKitResponse = AccountAuthResponse | SignTxResponse;
export declare function produceResponseDeeplink(request: DappKitRequest, response: DappKitResponse): string;
export interface TxToSignParam {
    txData: string;
    estimatedGas: number;
    from: string;
    to?: string;
    nonce: number;
    feeCurrencyAddress: string;
    value: string;
}
export interface SignTxRequest extends DappKitRequestBase {
    type: DappKitRequestTypes.SIGN_TX;
    txs: TxToSignParam[];
}
export declare const SignTxRequest: (txs: TxToSignParam[], meta: DappKitRequestMeta) => SignTxRequest;
export declare type DappKitRequest = AccountAuthRequest | SignTxRequest;
export declare function serializeDappKitRequestDeeplink(request: DappKitRequest): string;
export declare function parseDappkitResponseDeeplink(url: string): DappKitResponse & {
    requestId: string;
};
export declare function parseDappKitRequestDeeplink(url: string): DappKitRequest;
