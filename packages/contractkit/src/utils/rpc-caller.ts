import { Callback, JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers'

export function rpcCallHandler(
  payload: JsonRPCRequest,
  handler: (p: JsonRPCRequest) => Promise<any>,
  callback: Callback<JsonRPCResponse>
) {
  // TODO q pasa si la function handler falla?
  // TODO q pasa si en el then callback falla?

  handler(payload)
    .then((result) => callback(null, toRPCResponse(payload, result)))
    .catch((error) => callback(error, toRPCResponse(payload, null, error)))
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

export class RpcCaller {
  constructor(readonly provider: Provider, readonly jsonrpcVersion: string = '2.0') {}

  public async call(method: string, params: any[]): Promise<JsonRPCResponse> {
    return new Promise((resolve, reject) => {
      const payload: JsonRPCRequest = {
        id: this.getRandomId(),
        jsonrpc: this.jsonrpcVersion,
        method,
        params,
      }
      this.provider.send(payload, ((err: any, response: JsonRPCResponse) => {
        if (err != null) {
          reject(err)
        } else {
          resolve(response)
        }
      }) as Callback<JsonRPCResponse>)
    })
  }

  // Ported from: https://github.com/MetaMask/provider-engine/blob/master/util/random-id.js
  public getRandomId(): number {
    const extraDigits = 3
    const baseTen = 10
    // 13 time digits
    const datePart = new Date().getTime() * Math.pow(baseTen, extraDigits)
    // 3 random digits
    const extraPart = Math.floor(Math.random() * Math.pow(baseTen, extraDigits))
    // 16 digits
    return datePart + extraPart
  }
}
