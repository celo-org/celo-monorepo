import {
  BuildArtifacts,
  compareStorageLayouts,
  Contract as ZContract,
  getStorageLayout,
  Operation,
} from '@openzeppelin/upgrades'
const  Web3 = require('web3')
import { Contract as Web3Contract } from 'web3-eth-contract';

const web3 = new Web3(null)

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

// getStorageLayout needs an oz-sdk Contract class instance. This class is a
// subclass of Contract from web3-eth-contract, with an added .schema member and
// several methods.
//
// Couldn't find an easy way of getting one just from contract artifacts. But
// for getStorageLayout we really only need .schema.ast and .schema.contractName.
const addSchemaForLayoutChecking = (web3Contract: Web3Contract, artifact: any): ZContract => {
  // @ts-ignore
  const contract = web3Contract as Contract
  // @ts-ignore
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

const selectIncompatibleOperations = (diff: Operation[]) =>
  diff.filter(operation => operation.action !== 'append')

export interface CompatibilityInfo {
  contract: string
  compatible: boolean
  errors: string[]
}

const generateErrorMessage = (operation: Operation) => {
  let message: string

  const updated = operation.updated
  const original = operation.original

  switch (operation.action) {
    case 'typechange':
      message = `variable ${updated.label} had type ${original.type}, now has type ${updated.type}`
      break
    case 'insert':
      message = `variable ${updated.label} was inserted`
      break
    case 'pop':
      message = `variable ${original.label} was removed`
      break
    case 'delete':
      message = `variable ${original.label} was removed`
      break
    case 'rename':
      message = `variable ${updated.label} was renamed from ${original.label}`
      break
    default:
      message = `unknown operation ${operation.action}`
  }

  return message
}

const generateCompatibilityReport = (diff: Operation[], contract: string): CompatibilityInfo => {
  const incompatibilities = selectIncompatibleOperations(diff)
  if (incompatibilities.length === 0) {
    return {
      contract,
      compatible: true,
      errors: []
    }
  } else {
    return {
      contract,
      compatible: false,
      errors: incompatibilities.map(generateErrorMessage)
    }
  }
}

export const reportLayoutIncompatibilities = (oldArtifacts: BuildArtifacts, newArtifacts: BuildArtifacts): CompatibilityInfo[] => {
  return newArtifacts.listArtifacts().map((newArtifact) => {
    const oldArtifact = oldArtifacts.getArtifactByName(newArtifact.contractName)
    if (oldArtifact !== undefined) {
      const layoutDiff = getLayoutDiff(oldArtifact, oldArtifacts, newArtifact, newArtifacts)
      return generateCompatibilityReport(layoutDiff, newArtifact.contractName)
    }
  })
}
