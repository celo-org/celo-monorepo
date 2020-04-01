import Web3 from 'web3'
import { provider } from 'web3-core'
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'
import { ABIDefinition, DecodedParamsObject } from 'web3-eth-abi'
import Web3Utils from 'web3-utils'

export const getAbiTypes = (abi: ABIDefinition[], methodName: string) =>
  abi.find((entry) => entry.name! === methodName)!.inputs!.map((input) => input.type)

export const parseDecodedParams = (params: DecodedParamsObject) => {
  const args = new Array(params.__length__)
  delete params.__length__
  Object.keys(params).forEach((key) => {
    const argIndex = parseInt(key, 10)
    if (argIndex >= 0) {
      args[argIndex] = params[key]
      delete params[key]
    }
  })
  return { args, params }
}

export async function traceTransaction(
  web3: Web3,
  transaction: string,
  tracer: string
): Promise<any[]> {
  const query: JsonRpcPayload = {
    jsonrpc: '2.0',
    method: 'debug_traceTransaction',
    id: new Date().getTime().toString(),
    params: [Web3Utils.toHex(transaction), { tracer }],
  }
  const trace = await providerRPC(web3.currentProvider, query)
  return trace.result
}

export async function traceBlock(web3: Web3, blockNumber: number, tracer: string): Promise<any[]> {
  const query: JsonRpcPayload = {
    jsonrpc: '2.0',
    method: 'debug_traceBlockByNumber',
    id: new Date().getTime().toString(),
    params: [Web3Utils.toHex(blockNumber), { tracer }],
  }
  const trace = await providerRPC(web3.currentProvider, query)
  return trace.result.map((e: any) => e.result)
}

async function providerRPC(
  defaultProvider: provider,
  query: JsonRpcPayload
): Promise<JsonRpcResponse> {
  if (defaultProvider == null || typeof defaultProvider === 'string') {
    throw Error('Existing provider is required')
  }
  return new Promise((resolve, reject) => {
    defaultProvider.send(query, (err: Error | null, result: JsonRpcResponse | undefined) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}
