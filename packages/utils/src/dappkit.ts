import { stringify } from 'querystring'
import { parse } from 'url'

export const DAPPKIT_BASE_HOST = 'celo://wallet/dappkit'
export enum DappKitRequestTypes {
  ACCOUNT_ADDRESS = 'account_address',
  SIGN_TX = 'sign_tx',
}

export enum DappKitResponseStatus {
  SUCCESS = '200',
  UNAUTHORIZED = '401',
}

export interface AccountAuthRequest {
  type: DappKitRequestTypes.ACCOUNT_ADDRESS
  callback: string
}

export const AccountAuthRequest = (callback: string): AccountAuthRequest => ({
  type: DappKitRequestTypes.ACCOUNT_ADDRESS,
  callback,
})

export interface AccountAuthResponseSuccess {
  type: DappKitRequestTypes.ACCOUNT_ADDRESS
  status: DappKitResponseStatus.SUCCESS
  address: string
}

export const AccountAuthResponseSuccess = (address: string): AccountAuthResponseSuccess => ({
  type: DappKitRequestTypes.ACCOUNT_ADDRESS,
  status: DappKitResponseStatus.SUCCESS,
  address,
})

export interface AccountAuthResponseFailure {
  type: DappKitRequestTypes.ACCOUNT_ADDRESS
  status: DappKitResponseStatus.UNAUTHORIZED
}

export type AccountAuthResponse = AccountAuthResponseSuccess | AccountAuthResponseFailure

export interface SignTxResponseSuccess {
  type: DappKitRequestTypes.SIGN_TX
  status: DappKitResponseStatus.SUCCESS
  rawTx: string
}

export const SignTxResponseSuccess = (rawTx: string): SignTxResponseSuccess => ({
  type: DappKitRequestTypes.SIGN_TX,
  status: DappKitResponseStatus.SUCCESS,
  rawTx,
})

export interface SignTxResponseFailure {
  type: DappKitRequestTypes.SIGN_TX
  status: DappKitResponseStatus.UNAUTHORIZED
}

export type SignTxResponse = SignTxResponseSuccess | SignTxResponseFailure

export type DappKitResponse = AccountAuthResponse | SignTxResponse

export function produceResponseDeeplink(request: DappKitRequest, response: DappKitResponse) {
  return request.callback + '?' + serializeResponseParams(response)
}

export function serializeResponseParams(response: DappKitResponse) {
  switch (response.type) {
    case DappKitRequestTypes.ACCOUNT_ADDRESS:
      if (response.status === DappKitResponseStatus.SUCCESS) {
        return stringify({
          account: response.address,
          status: response.status,
          type: response.type,
        })
      } else {
        return stringify({ status: response.status, type: response.type })
      }
      break
    case DappKitRequestTypes.SIGN_TX:
      if (response.status === DappKitResponseStatus.SUCCESS) {
        return stringify({ rawTx: response.rawTx, status: response.status, type: response.type })
      } else {
        return stringify({ status: response.status, type: response.type })
      }
    default:
      break
  }
}

export interface SignTxRequest {
  type: DappKitRequestTypes.SIGN_TX
  txData: string
  estimatedGas: number
  from: string
  to: string
  nonce: number
  gasCurrencyAddress: string
  callback: string
}

export type DappKitRequest = AccountAuthRequest | SignTxRequest

export function serializeDappKitRequestDeeplink(request: DappKitRequest) {
  return DAPPKIT_BASE_HOST + serializeRequestParams(request)
}

export function serializeRequestParams(request: DappKitRequest) {
  switch (request.type) {
    case DappKitRequestTypes.ACCOUNT_ADDRESS:
      return stringify({ type: request.type, callback: request.callback })
      break
    default:
      break
  }
}

export function parseDappKitRequestDeeplink(url: string): DappKitRequest {
  const rawParams = parse(url, true)

  if (rawParams.query.type === undefined) {
    throw new Error('Invalid Deeplink: does not contain type' + 'url')
  }
  switch (rawParams.query.type) {
    case DappKitRequestTypes.ACCOUNT_ADDRESS:
      return {
        type: DappKitRequestTypes.ACCOUNT_ADDRESS,
        // @ts-ignore
        callback: rawParams.query.callback,
      }
      break
    case DappKitRequestTypes.SIGN_TX:
      // @ts-ignore
      return {
        type: DappKitRequestTypes.SIGN_TX,
        // @ts-ignore
        txData: rawParams.query.txData,
        // @ts-ignore
        estimatedGas: parseInt(rawParams.query.estimatedGas, 10),
        // @ts-ignore
        from: rawParams.query.from,
        // @ts-ignore
        to: rawParams.query.to,
        // @ts-ignore
        nonce: parseInt(rawParams.query.nonce, 10),
        // @ts-ignore
        gasCurrencyAddress: rawParams.query.gasCurrency,
        // @ts-ignore
        callback: rawParams.query.callback,
      }
    default:
      throw new Error('Invalid Deeplink: does not match defined requests')
  }
}
