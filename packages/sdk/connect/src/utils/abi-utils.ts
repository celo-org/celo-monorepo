import { ensureLeading0x } from '@celo/base/lib/address'
import { AbiCoder, ABIDefinition, AbiItem, DecodedParamsObject } from '../abi-types'

/** @internal */
export const getAbiByName = (abi: AbiItem[], methodName: string) =>
  abi.find((entry) => entry.name! === methodName)!

/** @internal */
export const parseDecodedParams = (params: DecodedParamsObject) => {
  const args = new Array(params.__length__)
  Object.keys(params).forEach((key) => {
    if (key === '__length__') {
      return
    }
    const argIndex = parseInt(key, 10)
    if (argIndex >= 0) {
      args[argIndex] = params[key]
      delete params[key]
    }
  })
  return { args, params }
}

/** @internal */
export const signatureToAbiDefinition = (fnSignature: string): ABIDefinition => {
  const matches = /(?<method>[^\(]+)\((?<args>.*)\)/.exec(fnSignature)
  if (matches == null) {
    throw new Error(`${fnSignature} is malformed`)
  }
  const method = matches.groups!['method']
  const args = matches.groups!['args'].split(',')

  return {
    name: method,
    signature: fnSignature,
    type: 'function',
    inputs: args.map((type, index) => {
      const parts = type
        .trim()
        .split(' ')
        .map((p) => p.trim())
      if (parts.length > 2) {
        throw new Error(`${fnSignature} is malformed`)
      }

      return {
        name: parts.length > 1 ? parts[1] : `a${index}`,
        type: parts[0],
      }
    }),
  }
}

/** @internal */
export const decodeStringParameter = (ethAbi: AbiCoder, str: string) =>
  ethAbi.decodeParameter('string', ensureLeading0x(str))
