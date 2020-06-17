import { makeZContract } from '@celo/protocol/lib/backward-utils';
import {
  BuildArtifacts,
  Contract as ZContract
} from '@openzeppelin/upgrades';
import ContractAST from '@openzeppelin/upgrades/lib/utils/ContractAST';

const VISIBILITY_PUBLIC = 'public'
const VISIBILITY_EXTERNAL = 'external'
const CONTRACT_TYPE_CONTRACT = 'contract'
const STORAGE_DEFAULT = 'default'

const OUT_VOID_PARAMETER_STRING = 'void'

export interface ASTCompatibilityReport {
  majorChanges: string[];
  minorChanges: string[];
}

export interface ASTError {
  message: string,
  wrapped: Error
}

const major = (change: string): ASTCompatibilityReport => {
  return {
    majorChanges: [change],
    minorChanges: []
  }
}

const getSignature = (method: any): string => {
  // This is used as the ID of a method
  return `${method.selector}`
}

const createMethodIndex = (methods: any[]): any[] => {
  const asPairs = methods.map(m => ({ [`${getSignature(m)}`]: m }))
  return Object.assign({}, ...asPairs)
}

const addAbiReport = (target: ASTCompatibilityReport, report: ASTCompatibilityReport): void => {
  target.majorChanges.push(...report.majorChanges)
  target.minorChanges.push(...report.minorChanges)
}

const mergeReports = (reports: ASTCompatibilityReport[]): ASTCompatibilityReport => {
  const report = {
    majorChanges: [],
    minorChanges: []
  }
  reports.forEach((r: ASTCompatibilityReport): void => {
    addAbiReport(report, r)
  })
  return report
}

const parametersSignature = (parameters: any[]): string => {
  if (parameters.length === 0) {
    return OUT_VOID_PARAMETER_STRING
  }
  const singleSignature = (p: any): string => {
    const storage = p.storageLocation === STORAGE_DEFAULT ? '' : `${p.storageLocation} `
    return `${storage}${p.typeDescriptions.typeString}`
  }
  return parameters.map(singleSignature).join(', ')
}

const checkMethodCompatibility = (signature: string, m1: any, m2: any): ASTCompatibilityReport => {
  const report = {
    majorChanges: [],
    minorChanges: []
  }
  // Visibility changes
  if (m1.visibility != m2.visibility) {
    if (m1.visibility == VISIBILITY_PUBLIC && m2.visibility == VISIBILITY_EXTERNAL) {
      // Granted more visibility, minor change
      report.minorChanges.push(`Method ${signature} was upgraded from '${VISIBILITY_PUBLIC}' to '${VISIBILITY_EXTERNAL}'`)
    } else {
      // Any other case, assume major change
      report.majorChanges.push(`Method ${signature} was modified from '${m1.visibility}' to '${m2.visibility}'`)
    }
  }
  // Parameters signature (types are already equal, but this will check for storage locations)
  const par1 = parametersSignature(m1.parameters.parameters)
  const par2 = parametersSignature(m2.parameters.parameters)
  if (par1 !== par2) {
    report.majorChanges.push(`Method ${signature} input parameters changed from (${par1}) to (${par2})`)
  }

  // Return parameter changes
  const ret1 = parametersSignature(m1.returnParameters.parameters)
  const ret2 = parametersSignature(m2.returnParameters.parameters)
  if (ret1 !== ret2) {
    report.majorChanges.push(`Method ${signature} return parameters changed from (${ret1}) to (${ret2})`)
  }

  // State mutability changes
  const state1 = m1.stateMutability
  const state2 = m2.stateMutability
  if (state1 !== state2) {
    report.majorChanges.push(`Method ${signature} state mutability changed from '${state1}' to '${state2}'`)
  }
  return report
}

const getCheckableMethodsFromAST = (contract: ContractAST, id: string): any[] => {
  const checkableMethods = (method: any) => method.visibility == VISIBILITY_EXTERNAL || method.visibility == VISIBILITY_PUBLIC
  try {
    return contract.getMethods().filter(checkableMethods)
  } catch (error) {
    throw {
      message: `Error in the @openzeppelin/.../ContractAST.getMethods() for the artifacts in the '${id}' folder. 
    Most likely this is due to a botched build, or a build on a non-cleaned folder.`,
      error: error
    }
  }
}

const doASTCompatibilityReport = (contractName: string, oldAST: ContractAST, newAST: ContractAST): ASTCompatibilityReport => {
  const oldMethods = createMethodIndex(getCheckableMethodsFromAST(oldAST, 'old'))
  const newMethods = createMethodIndex(getCheckableMethodsFromAST(newAST, 'new'))

  const report = {
    majorChanges: [],
    minorChanges: []
  }
  const fullSignature = (signature) => `${contractName}.${signature}`

  // Check for modified or missing methods in the new version
  Object.keys(oldMethods).forEach((signature: string) => {
    const fullSig = fullSignature(signature)
    const method = oldMethods[signature]
    if (!newMethods.hasOwnProperty(signature)) {
      // Method deleted, major change
      report.majorChanges.push(`Method ${fullSig} was deleted`)
      // Continue
      return
    }
    const newMethod = newMethods[signature]
    addAbiReport(report, checkMethodCompatibility(fullSig, method, newMethod))
  })
  // Check for added methods in the new version
  Object.keys(newMethods).forEach((signature: string) => {
    if (!oldMethods.hasOwnProperty(signature)) {
      // New method, minor change
      report.minorChanges.push(`Method ${fullSignature(signature)} was added`)
    }
  })
  return report
}

const generateASTCompatibilityReport = (oldContract: ZContract, oldArtifacts: BuildArtifacts,
  newContract: ZContract, newArtifacts: BuildArtifacts): ASTCompatibilityReport => {
  // Sanity checks
  if (newContract === null) {
    throw new Error('newContract cannot be null')
  }
  if (oldArtifacts === null) {
    throw new Error('oldArtifacts cannot be null')
  }
  if (newArtifacts === null) {
    throw new Error('newArtifacts cannot be null')
  }

  const contractName = newContract.schema.contractName

  // Need to manually use ContractAST since its internal use in ZContract
  // does not pass the artifacts parameter to the constructor, therefore
  // forcing a reloading of BuildArtifacts.
  const newAST = new ContractAST(newContract, newArtifacts)
  const newKind = newAST.getContractNode().contractKind
  if (oldContract === null) {
    if (newKind == CONTRACT_TYPE_CONTRACT) {
      return major(`Contract ${contractName} is a new Contract`)
    } else {
      // New contract added of a non-contract type (library/interface)
      // therefore no functionality added
      return {
        majorChanges: [],
        minorChanges: []
      }
    }
  }

  // Name sanity check
  if (oldContract.schema.contractName !== contractName) {
    throw new Error(`Contract names should be equal: ${oldContract.schema.contractName} !== ${contractName}`)
  }

  const oldAST = new ContractAST(oldContract, oldArtifacts)
  const kind = oldAST.getContractNode().contractKind
  if (kind !== newKind) {
    // different contract kind (library/interface/contract)
    return major(`Contract ${contractName} changed type from ${kind} to ${newKind}`)
  }

  return doASTCompatibilityReport(contractName, oldAST, newAST)
}

export const reportASTIncompatibilities = (oldArtifacts: BuildArtifacts, newArtifacts: BuildArtifacts): ASTCompatibilityReport => {
  const reports = newArtifacts.listArtifacts().map((newArtifact) => {
    const oldArtifact = oldArtifacts.getArtifactByName(newArtifact.contractName)
    const oldZContract = oldArtifact ? makeZContract(oldArtifact) : null
    return generateASTCompatibilityReport(oldZContract, oldArtifacts, makeZContract(newArtifact), newArtifacts)
  })
  return mergeReports(reports)
}