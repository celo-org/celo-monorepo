import { provider } from 'web3-core'
import { ABIDefinition, DecodedParamsObject } from 'web3-eth-abi'
import { Debug } from 'web3-eth-debug'
import Web3Utils from 'web3-utils'
import { getProviderUrl, stopProvider } from '../utils/provider-utils'

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
  defaultProvider: provider,
  transaction: string,
  tracer: string
): Promise<any[]> {
  const args: { [key: string]: string } = { tracer }
  const url = getProviderUrl(defaultProvider)
  const debug = new Debug(url)
  const trace: any = await debug.getTransactionTrace(transaction, args)
  stopProvider(debug.currentProvider as any)
  return trace
}

export async function traceBlock(
  defaultProvider: provider,
  blockNumber: number,
  tracer: string
): Promise<any[]> {
  const args: { [key: string]: string } = { tracer }
  const url = getProviderUrl(defaultProvider)
  const debug = new Debug(url)
  const trace: any = await debug.getBlockTraceByNumber(Web3Utils.toHex(blockNumber), args)
  stopProvider(debug.currentProvider as any)
  return trace.map((e: any) => e.result)
}
