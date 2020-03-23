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
  rawTxs: string[]
}

export const SignTxResponseSuccess = (rawTxs: string[]): SignTxResponseSuccess => ({
  type: DappKitRequestTypes.SIGN_TX,
  status: DappKitResponseStatus.SUCCESS,
  rawTxs,
})

export interface SignTxResponseFailure {
  type: DappKitRequestTypes.SIGN_TX
  status: DappKitResponseStatus.UNAUTHORIZED
}

export type SignTxResponse = SignTxResponseSuccess | SignTxResponseFailure

export type DappKitResponse = AccountAuthResponse | SignTxResponse

export function produceResponseDeeplink(request: DappKitRequest, response: DappKitResponse) {
  const params: any = { type: response.type, status: response.status, requestId: request.requestId }
  switch (response.type) {
    case DappKitRequestTypes.ACCOUNT_ADDRESS:
      if (response.status === DappKitResponseStatus.SUCCESS) {
        params.account = response.address
        params.phoneNumber = response.phoneNumber
      }
      break
    case DappKitRequestTypes.SIGN_TX:
      if (response.status === DappKitResponseStatus.SUCCESS) {
        params.rawTxs = response.rawTxs
      }
    default:
      break
  }

  return request.callback + '?' + stringify(params)
}

export interface TxToSignParam {
  txData: string
  estimatedGas: number
  from: string
  to?: string
  nonce: number
  feeCurrencyAddress: string
  value: string
}

export interface SignTxRequest extends DappKitRequestBase {
  type: DappKitRequestTypes.SIGN_TX
  txs: TxToSignParam[]
}

export const SignTxRequest = (txs: TxToSignParam[], meta: DappKitRequestMeta): SignTxRequest => ({
  type: DappKitRequestTypes.SIGN_TX,
  txs: txs.map((tx) => ({
    txData: tx.txData,
    estimatedGas: tx.estimatedGas,
    from: tx.from,
    to: tx.to,
    nonce: tx.nonce,
    feeCurrencyAddress: tx.feeCurrencyAddress,
    value: tx.value,
  })),
  ...meta,
})

export type DappKitRequest = AccountAuthRequest | SignTxRequest

function assertString(objectName: string, key: string, value: any) {
  if (value === undefined) {
    throw new Error(`Expected ${objectName} to contain ${key}`)
  }

  if (typeof value !== 'string') {
    throw new Error(`Expected ${objectName}[${key}] to be a string, but is ${typeof value}`)
  }

  return
}

export function serializeDappKitRequestDeeplink(request: DappKitRequest) {
  // TODO: Probably use a proper validation library here
  assertString('request', 'type', request.type)
  assertString('request', 'requestId', request.requestId)
  assertString('request', 'callback', request.callback)
  assertString('request', 'dappName', request.dappName)

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
        txs: Buffer.from(JSON.stringify(request.txs), 'utf8').toString('base64'),
      }
      break
    case DappKitRequestTypes.ACCOUNT_ADDRESS:
      break
    default:
      throw new Error(`Invalid DappKitRequest type: ${JSON.stringify(request)}`)
  }

  return DAPPKIT_BASE_HOST + '?' + stringify(params)
}

// TODO: parsing query params yields broad types
// once interface stabilizes, properly type the parsing
export function parseDappkitResponseDeeplink(url: string): DappKitResponse & { requestId: string } {
  const rawParams = parse(url, true)
  if (rawParams.query.type === undefined) {
    throw new Error('Invalid Deeplink: does not contain type:' + url)
  }

  if (rawParams.query.requestId === undefined) {
    throw new Error('Invalid Deeplink: does not contain requestId')
  }

  const requestId = rawParams.query.requestId as string
  const address = rawParams.query.account as string
  const phoneNumber = rawParams.query.phoneNumber as string

  switch (rawParams.query.type) {
    case DappKitRequestTypes.ACCOUNT_ADDRESS:
      if (rawParams.query.status === DappKitResponseStatus.SUCCESS) {
        // @ts-ignore
        return {
          type: DappKitRequestTypes.ACCOUNT_ADDRESS,
          status: DappKitResponseStatus.SUCCESS,
          address,
          phoneNumber,
          requestId,
        }
      } else {
        return {
          type: DappKitRequestTypes.ACCOUNT_ADDRESS,
          status: DappKitResponseStatus.UNAUTHORIZED,
          requestId,
        }
      }
    case DappKitRequestTypes.SIGN_TX:
      if (rawParams.query.status === DappKitResponseStatus.SUCCESS) {
        let rawTxs = rawParams.query.rawTxs
        if (typeof rawTxs === 'string') {
          rawTxs = [rawTxs]
        }
        // @ts-ignore
        return {
          type: DappKitRequestTypes.SIGN_TX,
          status: DappKitResponseStatus.SUCCESS,
          rawTxs,
          requestId,
        }
      } else {
        return {
          type: DappKitRequestTypes.SIGN_TX,
          status: DappKitResponseStatus.UNAUTHORIZED,
          requestId,
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
        txs: JSON.parse(Buffer.from(rawParams.query.txs, 'base64').toString('utf8')),
        ...requestMeta,
      }
    default:
      throw new Error('Invalid Deeplink: does not match defined requests')
  }
}
