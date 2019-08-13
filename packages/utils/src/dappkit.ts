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

export interface DappKitRequestBase {
  type: DappKitRequestTypes
  callback: string
  requestId: string
  dappName: string
}

export interface DappKitRequestMeta {
  callback: string
  requestId: string
  dappName: string
}

export interface AccountAuthRequest extends DappKitRequestBase {
  type: DappKitRequestTypes.ACCOUNT_ADDRESS
}

export const AccountAuthRequest = (meta: DappKitRequestMeta): AccountAuthRequest => ({
  type: DappKitRequestTypes.ACCOUNT_ADDRESS,
  ...meta,
})

export interface AccountAuthResponseSuccess {
  type: DappKitRequestTypes.ACCOUNT_ADDRESS
  status: DappKitResponseStatus.SUCCESS
  address: string
  phoneNumber: string
}

export const AccountAuthResponseSuccess = (
  address: string,
  phoneNumber: string
): AccountAuthResponseSuccess => ({
  type: DappKitRequestTypes.ACCOUNT_ADDRESS,
  status: DappKitResponseStatus.SUCCESS,
  address,
  phoneNumber,
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
  let params: any = { type: response.type, status: response.status, requestId: request.requestId }
  switch (response.type) {
    case DappKitRequestTypes.ACCOUNT_ADDRESS:
      if (response.status === DappKitResponseStatus.SUCCESS) {
        params.account = response.address
        params.phoneNumber = response.phoneNumber
      }
      break
    case DappKitRequestTypes.SIGN_TX:
      if (response.status === DappKitResponseStatus.SUCCESS) {
        params.rawTx = response.rawTx
      }
    default:
      break
  }

  return request.callback + '?' + stringify(params)
}

export interface SignTxRequest extends DappKitRequestBase {
  type: DappKitRequestTypes.SIGN_TX
  txData: string
  estimatedGas: number
  from: string
  to: string
  nonce: number
  gasCurrencyAddress: string
}

export const SignTxRequest = (
  txData: string,
  estimatedGas: number,
  from: string,
  to: string,
  nonce: number,
  gasCurrencyAddress: string,
  meta: DappKitRequestMeta
): SignTxRequest => ({
  type: DappKitRequestTypes.SIGN_TX,
  txData,
  estimatedGas,
  from,
  to,
  nonce,
  gasCurrencyAddress,
  ...meta,
})

export type DappKitRequest = AccountAuthRequest | SignTxRequest

export function serializeDappKitRequestDeeplink(request: DappKitRequest) {
  let params: any = {
    type: request.type,
    requestId: request.requestId,
    callback: request.callback,
    dappName: request.dappName,
  }
  switch (request.type) {
    case DappKitRequestTypes.SIGN_TX:
      params = {
        ...params,
        txData: request.txData,
        estimatedGas: request.estimatedGas,
        from: request.from,
        to: request.to,
        nonce: request.nonce,
        gasCurrencyAddress: request.gasCurrencyAddress,
      }
    default:
      break
  }

  return DAPPKIT_BASE_HOST + '?' + stringify(params)
}

// TODO: parsing query params yields broad types
// once interface stabilizes, properly type the parsing
export function parseDappkitResponseDepplink(url: string): DappKitResponse {
  const rawParams = parse(url, true)
  if (rawParams.query.type === undefined) {
    throw new Error('Invalid Deeplink: does not contain type:' + url)
  }

  switch (rawParams.query.type) {
    case DappKitRequestTypes.ACCOUNT_ADDRESS:
      if (rawParams.query.status === DappKitResponseStatus.SUCCESS) {
        // @ts-ignore
        return {
          type: DappKitRequestTypes.ACCOUNT_ADDRESS,
          status: DappKitResponseStatus.SUCCESS,
          address: rawParams.query.account,
          phoneNumber: rawParams.query.phoneNumber,
        }
      } else {
        return {
          type: DappKitRequestTypes.ACCOUNT_ADDRESS,
          status: DappKitResponseStatus.UNAUTHORIZED,
        }
      }
    case DappKitRequestTypes.SIGN_TX:
      if (rawParams.query.status === DappKitResponseStatus.SUCCESS) {
        // @ts-ignore
        return {
          type: DappKitRequestTypes.SIGN_TX,
          status: DappKitResponseStatus.SUCCESS,
          rawTx: rawParams.query.rawTx,
        }
      } else {
        return {
          type: DappKitRequestTypes.SIGN_TX,
          status: DappKitResponseStatus.UNAUTHORIZED,
        }
      }
    default:
      throw new Error('Invalid Deeplink: does not match defined requests')
  }
}

export function parseDappKitRequestDeeplink(url: string): DappKitRequest {
  const rawParams = parse(url, true)

  if (rawParams.query.type === undefined) {
    throw new Error('Invalid Deeplink: does not contain type:' + url)
  }

  if (!rawParams.query.dappName || !rawParams.query.callback || !rawParams.query.requestId) {
    throw new Error(`Invalid Deeplink: Does not contain meta parameters: ` + url)
  }

  const requestMeta: DappKitRequestMeta = {
    // @ts-ignore
    callback: rawParams.query.callback,
    // @ts-ignore
    requestId: rawParams.query.requestId,
    // @ts-ignore
    dappName: rawParams.query.dappName,
  }

  switch (rawParams.query.type) {
    case DappKitRequestTypes.ACCOUNT_ADDRESS:
      return AccountAuthRequest(requestMeta)
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
        ...requestMeta,
      }
    default:
      throw new Error('Invalid Deeplink: does not match defined requests')
  }
}
