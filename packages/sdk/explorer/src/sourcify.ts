import { AbiItem, Address } from '@celo/connect'

export interface Metadata {
  output?: {
    abi?: AbiItem[]
  }
  settings?: {
    compilationTarget?: Record<string, string>
  }
}

export const getAbi = (metadata: Metadata): AbiItem[] | undefined => {
  if (
    typeof metadata === 'object' &&
    typeof metadata['output'] === 'object' &&
    'abi' in metadata['output'] &&
    Array.isArray(metadata['output']['abi']) &&
    metadata['output']['abi'].length > 0
  ) {
    return metadata['output']['abi']
  }
}

export const getContractName = (metadata: Metadata): string | undefined => {
  if (
    typeof metadata['settings'] === 'object' &&
    typeof metadata['settings']['compilationTarget'] === 'object' &&
    Object.keys(metadata['settings']['compilationTarget']).length > 0
  ) {
    // XXX: Not sure when there are multiple compilationTargets and what should
    // happen then
    const contracts = Object.values(metadata['settings']['compilationTarget'])
    return contracts[0]
  }
}

const querySourcify = async (
  matchType: 'full_match' | 'partial_match',
  chainID: string,
  contract: Address
): Promise<Metadata | null> => {
  const resp = await fetch(
    `https://repo.sourcify.dev/contracts/${matchType}/${chainID}/${contract}/metadata.json`
  )
  if (resp.ok) {
    return (await resp.json()) as Metadata
  }
  return null
}

export const getContractMetadataFromSourcify = async (
  chainID: string,
  contract: Address,
  strict = false
): Promise<Metadata | null> => {
  const fullMatchMetadata = await querySourcify('full_match', chainID, contract)
  if (fullMatchMetadata !== null) {
    return fullMatchMetadata
  } else if (strict) {
    return null
  } else {
    return querySourcify('partial_match', chainID, contract)
  }
}
