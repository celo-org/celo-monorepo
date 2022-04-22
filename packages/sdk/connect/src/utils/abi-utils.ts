import { ensureLeading0x } from '@celo/base/lib/address'
import { AbiCoder, AbiItem, DecodedParamsObject } from '../abi-types'

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
export const decodeStringParameter = (ethAbi: AbiCoder, str: string) =>
  ethAbi.decodeParameter('string', ensureLeading0x(str))
