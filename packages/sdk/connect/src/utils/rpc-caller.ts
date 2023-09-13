import debugFactory from 'debug'
import { Callback, Error, HttpProvider, JsonRpcPayload, JsonRpcResponse } from '../types'

const debugRpcPayload = debugFactory('rpc:payload')
const debugRpcResponse = debugFactory('rpc:response')
const debugRpcCallback = debugFactory('rpc:callback:exception')

export function rpcCallHandler(
  payload: JsonRpcPayload,
  handler: (p: JsonRpcPayload) => Promise<any>,
  callback: Callback<JsonRpcResponse>
) {
  try {
    handler(payload)
      .then(
        (result) => {
          callback(null, toRPCResponse(payload, result))
        },
        // Called if the Promise of the 'handler' fails
        (error) => {
          callback(error, toRPCResponse(payload, null, error))
        }
      )
      .catch((error) => {
        // Called if the 'callback' fails
        debugRpcCallback('Callback for handling the JsonRpcResponse fails')
        debugRpcCallback('%O', error)
      })
  } catch (error) {
    // Called if the handler fails before making the promise
    callback(error instanceof Error ? error : null)
  }
}

// Ported from: https://github.com/MetaMask/provider-engine/blob/master/util/random-id.js
export function getRandomId(): number {
  const extraDigits = 3
  const baseTen = 10
  // 13 time digits
  const datePart = new Date().getTime() * Math.pow(baseTen, extraDigits)
  // 3 random digits
  const extraPart = Math.floor(Math.random() * Math.pow(baseTen, extraDigits))
  // 16 digits
  return datePart + extraPart
}

function toRPCResponse(payload: JsonRpcPayload, result: any, error?: Error): JsonRpcResponse {
  const response: JsonRpcResponse = {
    id: Number(payload.id),
    jsonrpc: payload.jsonrpc,
    result,
  }

  if (error != null) {
    response.error = {
      message: error.message || error.toString(),
      code: -32000,
    }
  }
  return response
}

export interface RpcCaller {
  call: (method: string, params: any[]) => Promise<JsonRpcResponse>
  send: (
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ) => void
}

export class HttpRpcCaller implements RpcCaller {
  constructor(readonly httpProvider: HttpProvider, readonly jsonrpcVersion: string = '2.0') {}

  public async call(method: string, params: any[]): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
      const payload: JsonRpcPayload = {
        id: getRandomId(),
        jsonrpc: this.jsonrpcVersion,
        method,
        params,
      }
      this.send(payload, (err: any, response?: JsonRpcResponse) => {
        if (err != null || !response) {
          reject(err)
        } else {
          resolve(response)
        }
      })
    })
  }

  public send(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): void {
    debugRpcPayload('%O', payload)

    const decoratedCallback: Callback<JsonRpcResponse> = (
      error: Error | null,
      result?: JsonRpcResponse
    ): void => {
      let err: Error | null = null
      // error could be false
      if (error) {
        err = error
      }
      debugRpcResponse('%O', result)
      // The provider send call will not provide an error to the callback if
      // the result itself specifies an error. Here, we extract the error in the
      // result.
      if (
        result &&
        result.error != null &&
        typeof result.error !== 'string' &&
        result.error.message != null
      ) {
        err = new Error(result.error.message)
      }
      callback(err, result)
    }

    if (this.httpProvider && typeof this.httpProvider !== 'string') {
      this.httpProvider.send!(payload, decoratedCallback)
    }
  }
}
