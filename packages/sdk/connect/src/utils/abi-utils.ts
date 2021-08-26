import { ensureLeading0x } from '@celo/base/lib/address'
import { AbiCoder, AbiItem, DecodedParamsObject } from '../abi-types'

export const getAbiByName = (abi: AbiItem[], methodName: string) =>
  abi.find((entry) => entry.name! === methodName)!

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

export const decodeStringParameter = (ethAbi: AbiCoder, str: string) =>
  ethAbi.decodeParameter('string', ensureLeading0x(str))
