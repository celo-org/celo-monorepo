import debugFactory from 'debug'
import { Callback, JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers'

const debugRpcPayload = debugFactory('rpc:payload')
const debugRpcResponse = debugFactory('rpc:response')
const debugRpcCallback = debugFactory('rpc:callback:exception')

export function rpcCallHandler(
  payload: JsonRPCRequest,
  handler: (p: JsonRPCRequest) => Promise<any>,
  callback: Callback<JsonRPCResponse>
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
        debugRpcCallback('Callback for handling the JsonRPCResponse fails')
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

function toRPCResponse(payload: JsonRPCRequest, result: any, error?: Error): JsonRPCResponse {
  const response: JsonRPCResponse = {
    id: payload.id,
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
  call: (method: string, params: any[]) => Promise<JsonRPCResponse>
  send: (payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>) => void
}
export class DefaultRpcCaller implements RpcCaller {
  constructor(readonly provider: Provider, readonly jsonrpcVersion: string = '2.0') {}

  public async call(method: string, params: any[]): Promise<JsonRPCResponse> {
    return new Promise((resolve, reject) => {
      const payload: JsonRPCRequest = {
        id: getRandomId(),
        jsonrpc: this.jsonrpcVersion,
        method,
        params,
      }
      this.send(payload, ((err: any, response: JsonRPCResponse) => {
        if (err != null) {
          reject(err)
        } else {
          resolve(response)
        }
      }) as Callback<JsonRPCResponse>)
    })
  }

  public send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>) {
    debugRpcPayload('%O', payload)

    const decoratedCallback = ((error: Error, result: JsonRPCResponse) => {
      debugRpcResponse('%O', result)
      callback(error as any, result)
    }) as Callback<JsonRPCResponse>

    this.provider.send(payload, decoratedCallback)
  }
}
