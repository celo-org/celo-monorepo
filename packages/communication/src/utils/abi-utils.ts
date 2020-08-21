import { AbiCoder, AbiItem, DecodedParamsObject } from '@celo/sdk-types/abi'
import { ensureLeading0x } from '@celo/utils/lib/address'

export const getAbiTypes = (abi: AbiItem[], methodName: string) =>
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

export const decodeStringParameter = (ethAbi: AbiCoder, str: string) =>
  ethAbi.decodeParameter('string', ensureLeading0x(str))
