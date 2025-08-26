import { Hex } from 'viem'

export interface ForgeArtifact {
  abi: any
  bytecode: {
    object: Hex
  }
  metadata: {
    sources: {
      [sourcePath: string]: {
        [key: string]: any
      }
    }
    compiler?: {
      version?: string
    }
  }
  contractName?: string
  deployedBytecode?: {
    object?: string
  }
  sourceMap?: string
  deployedSourceMap?: string
  sourcePath?: string
  ast?: any
  legacyAST?: any
  compiler?: {
    name: string
    version: string
  }
  networks?: {
    [networkId: string]: {
      events: any
      links: any
      address: string
      transactionHash: string
    }
  }
  schemaVersion?: string
  updatedAt?: string
  devdoc?: any
  userdoc?: any
  methodIdentifiers?: object
  gasEstimates?: object
  storageLayout?: {
    storage?: any
    types?: any
  }
}
