import { Contract as ZContract } from '@openzeppelin/upgrades'
const Web3 = require('web3')
const web3 = new Web3(null)

// Foundry build artifacts do not have a `.contractName` field, so we get it from the
// `ContractDefinition` expression in the AST.
const getContractNameFromDefinition = (artifact: any): string => {
  for (let i = 0; i < artifact.ast.nodes.length; i++) {
    const node = artifact.ast.nodes[i]
    if (node.nodeType === 'ContractDefinition') {
      return node.name
    }
  }
  console.error("Name not found in artifact AST")
  return ''
}

export const getContractName = (artifact: any): string => {
  if (artifact.contractName) {
    return artifact.contractName
  } else {
    return getContractNameFromDefinition(artifact)
  }
}

// getStorageLayout needs an oz-sdk Contract class instance. This class is a
// subclass of Contract from web3-eth-contract, with an added .schema member and
// several methods.
//
// Couldn't find an easy way of getting one just from contract artifacts. But
// for getStorageLayout we really only need .schema.ast and .schema.contractName.
export function makeZContract(artifact: any): ZContract {
  const web3Contract = new web3.eth.Contract(artifact.abi)
  // @ts-ignore
  const contract = web3Contract as Contract
  // @ts-ignore
  contract.schema = {}
  contract.schema.ast = artifact.ast
  contract.contractName = getContractName(artifact)
  contract.schema.contractName = contract.contractName
  contract.schema.deployedBytecode = artifact.deployedBytecode.object || artifact.deployedBytecode
  return contract
}

// Inlined from OpenZeppelin SDK since its not exported.
export interface Artifact {
  abi: any[]
  ast: any
  bytecode: string
  compiler: any
  contractName: string
  deployedBytecode: string
  deployedSourceMap: string
  fileName: string
  legacyAST?: any
  networks: any
  schemaVersion: string
  source: string
  sourceMap: string
  sourcePath: string
  updatedAt: string
}

// Inlined from OpenZeppelin SDK since its not exported.
export interface TypeInfo {
  id: string;
  kind: string;
  label: string;
  valueType?: string;
  length?: number;
  members?: StorageInfo[];
  src?: any;
}

// Inlined from OpenZeppelin SDK since its not exported.
export interface StorageInfo {
  label: string;
  astId: number;
  type: any;
  src: string;
  path?: string;
  contract?: string;
}

