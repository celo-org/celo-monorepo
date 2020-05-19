import {
  BuildArtifacts,
  getStorageLayout,
  compareStorageLayouts,
  Contract as ZContract
} from '@openzeppelin/upgrades'
const  Web3 = require('web3')
import { Contract as Web3Contract } from 'web3-eth-contract';

const web3 = new Web3(null)

// Inlined from OpenZeppelin SDK since its not exported.
export interface Artifact {
  abi: any[];
  ast: any;
  bytecode: string;
  compiler: any;
  contractName: string;
  deployedBytecode: string;
  deployedSourceMap: string;
  fileName: string;
  legacyAST?: any;
  networks: any;
  schemaVersion: string;
  source: string;
  sourceMap: string;
  sourcePath: string;
  updatedAt: string;
}

// getStorageLayout needs an oz-sdk Contract class instance. This class is a
// subclass of Contract from web3-eth-contract, with an added .schema member and
// several methods.
//
// Couldn't find an easy way of getting one just from contract artifacts. But
// for getStorageLayout we really only need .schema.ast and .schema.contractName.
const addSchemaForLayoutChecking = (web3Contract: Web3Contract, artifact: any): ZContract => {
  // @ts-ignore
  const contract = web3Contract as Contract
  //@ts-ignore
  contract.schema = {}
  contract.schema.ast = artifact.ast
  contract.schema.contractName = artifact.contractName
  return contract
}

const makeZContract = (artifact: any): ZContract => {
  const contract = new web3.eth.Contract(artifact.abi)

  return addSchemaForLayoutChecking(contract, artifact)
}

export const getLayoutDiff = (oldArtifact: Artifact, oldArtifacts: BuildArtifacts,
                       newArtifact: Artifact, newArtifacts: BuildArtifacts) => {
  const oldContract = makeZContract(oldArtifact)
  const newContract = makeZContract(newArtifact)

  const oldLayout = getStorageLayout(oldContract, oldArtifacts)
  const newLayout = getStorageLayout(newContract, newArtifacts)

  return compareStorageLayouts(oldLayout, newLayout)
}
