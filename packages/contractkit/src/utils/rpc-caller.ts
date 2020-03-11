import debugFactory from 'debug'
import { provider } from 'web3-core'
import { Callback, JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'

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
    callback(error)
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
    ;(response as any).error = {
      message: error.stack || error.message || error,
      code: -32000,
    }
  }
  return response
}

export interface RpcCaller {
  call: (method: string, params: any[]) => Promise<JsonRpcResponse>
  send: (payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>) => void
}
export class DefaultRpcCaller implements RpcCaller {
  constructor(readonly defaultProvider: provider, readonly jsonrpcVersion: string = '2.0') {}

  public async call(method: string, params: any[]): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
      const payload: JsonRpcPayload = {
        id: getRandomId(),
        jsonrpc: this.jsonrpcVersion,
        method,
        params,
      }
      this.send(payload, ((err: any, response: JsonRpcResponse) => {
        if (err != null) {
          reject(err)
        } else {
          resolve(response)
        }
      }) as Callback<JsonRpcResponse>)
    })
  }

  public send(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>) {
    debugRpcPayload('%O', payload)

    const decoratedCallback = ((error: Error, result: JsonRpcResponse): void => {
      debugRpcResponse('%O', result)
      callback(error as any, result)
    }) as Callback<JsonRpcResponse>

    if (this.defaultProvider && typeof this.defaultProvider !== 'string') {
      this.defaultProvider.send(payload, decoratedCallback)
    }
  }
}
