import { stripMetadata } from '@celo/protocol/lib/bytecode'
import {
  Change,
  ContractKindChange, DeployedBytecodeChange, MethodAddedChange,
  MethodMutabilityChange, MethodRemovedChange, MethodReturnChange,
  MethodVisibilityChange, NewContractChange
} from '@celo/protocol/lib/compatibility/change'
import { makeZContract } from '@celo/protocol/lib/compatibility/internal'
import {
  BuildArtifacts,
  Contract as ZContract
} from '@openzeppelin/upgrades'
import ContractAST from '@openzeppelin/upgrades/lib/utils/ContractAST'

export enum Visibility {
  NONE = "",
  EXTERNAL = "external",
  PUBLIC = "public",
  INTERNAL = "internal",
  PRIVATE = "private"
}

export enum Mutability {
  NONE = "",
  PURE = "pure",
  VIEW = "view",
  PAYABLE = "payable"
}

enum StorageLocation {
  NONE = "",
  // Default gets replaced to None when comparing parameter storage locations
  DEFAULT = "default",

  STORAGE = "storage",
  MEMORY = "memory",
  CALLDATA = "calldata",
}

const CONTRACT_KIND_CONTRACT = 'contract'
const OUT_VOID_PARAMETER_STRING = 'void'

/**
 * A compatibility report with all the detected changes from two compiled
 * contract folders.
 */
export class ASTCodeCompatibilityReport {
  constructor(private readonly changes: Change[]) { }
  push(...changes: Change[]) {
    this.changes.push(...changes)
  }
  include(other: ASTCodeCompatibilityReport) {
    this.push(...other.changes)
  }
  getChanges = (): Change[] => {
    return this.changes
  }
}

// Types used by the Method interface
// OpenZep uses 'any' for methods so we
// define our own here

interface TypeDescriptions {
  typeString: string
}

interface Parameter {
  storageLocation: StorageLocation
  typeDescriptions: TypeDescriptions
}

interface Parameters {
  parameters: Parameter[]
}

interface Method {
  selector: string
  visibility: Visibility
  stateMutability: Mutability
  parameters: Parameters
  returnParameters: Parameters
}

// Implementation

function getSignature(method: Method): string {
  // This is used as the ID of a method
  return method.selector
}

interface MethodIndex {
  [signature: string]: Method;
}

/**
 * @returns A method index where {key: signature => value: method}
 */
function createMethodIndex(methods: Method[]): MethodIndex {
  const asPairs = methods.map(m => ({ [`${getSignature(m)}`]: m }))
  return Object.assign({}, ...asPairs)
}

function mergeReports(reports: ASTCodeCompatibilityReport[]): ASTCodeCompatibilityReport {
  const report = new ASTCodeCompatibilityReport([])
  reports.forEach((r: ASTCodeCompatibilityReport): void => {
    report.include(r)
  })
  return report
}

function parametersSignature(parameters: Parameter[]): string {
  if (parameters.length === 0) {
    return OUT_VOID_PARAMETER_STRING
  }
  const singleSignature = (p: Parameter): string => {
    const storage = p.storageLocation === StorageLocation.DEFAULT ? StorageLocation.NONE : `${p.storageLocation} `
    return `${storage}${p.typeDescriptions.typeString}`
  }
  return parameters.map(singleSignature).join(', ')
}


function checkMethodCompatibility(contract: string, m1: Method, m2: Method): ASTCodeCompatibilityReport {
  const report = new ASTCodeCompatibilityReport([])
  const signature = getSignature(m1)
  // Sanity check
  const signature2 = getSignature(m2)
  if (signature !== signature2) {
    throw new Error(`Signatures should be equal: ${signature} !== ${signature2}`)
  }
  // Visibility changes
  if (m1.visibility !== m2.visibility) {
    report.push(new MethodVisibilityChange(contract, signature, m1.visibility, m2.visibility))
  }

  // Return parameter changes
  const ret1 = parametersSignature(m1.returnParameters.parameters)
  const ret2 = parametersSignature(m2.returnParameters.parameters)
  if (ret1 !== ret2) {
    report.push(new MethodReturnChange(contract, signature, ret1, ret2))
  }

  // State mutability changes
  const state1 = m1.stateMutability
  const state2 = m2.stateMutability
  if (state1 !== state2) {
    report.push(new MethodMutabilityChange(contract, signature, state1, state2))
  }
  return report
}

const getCheckableMethodsFromAST = (contract: ContractAST, id: string): any[] => {
  const checkableMethods = (method: Method) => method.visibility === Visibility.EXTERNAL || method.visibility === Visibility.PUBLIC
  try {
    return contract.getMethods().filter(checkableMethods)
  } catch (error) {
    throw {
      message: `Error in the @openzeppelin/.../ContractAST.getMethods() for the artifacts in the '${id}' folder. 
    Most likely this is due to a botched build, or a build on a non-cleaned folder.`,
      error
    }
  }
}

function doASTCompatibilityReport(
  contractName: string,
  oldAST: ContractAST,
  newAST: ContractAST): ASTCodeCompatibilityReport {
  const oldMethods = createMethodIndex(getCheckableMethodsFromAST(oldAST, 'old'))
  const newMethods = createMethodIndex(getCheckableMethodsFromAST(newAST, 'new'))

  const report = new ASTCodeCompatibilityReport([])

  // Check for modified or missing methods in the new version
  Object.keys(oldMethods).forEach((signature: string) => {
    const method: Method = oldMethods[signature]
    if (!newMethods.hasOwnProperty(signature)) {
      // Method deleted, major change
      report.push(new MethodRemovedChange(contractName, signature))
      // Continue
      return
    }
    const newMethod: Method = newMethods[signature]
    report.include(checkMethodCompatibility(contractName, method, newMethod))
  })
  // Check for added methods in the new version
  Object.keys(newMethods).forEach((signature: string) => {
    if (!oldMethods.hasOwnProperty(signature)) {
      // New method, minor change
      report.push(new MethodAddedChange(contractName, signature))
    }
  })
  return report
}

function generateASTCompatibilityReport(oldContract: ZContract, oldArtifacts: BuildArtifacts,
  newContract: ZContract, newArtifacts: BuildArtifacts): ASTCodeCompatibilityReport {
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
    if (newKind === CONTRACT_KIND_CONTRACT) {
      return new ASTCodeCompatibilityReport([new NewContractChange(contractName)])
    } else {
      // New contract added of a non-contract kind (library/interface)
      // therefore no functionality added
      return new ASTCodeCompatibilityReport([])
    }
  }

  // Name sanity check
  if (oldContract.schema.contractName !== contractName) {
    throw new Error(`Contract names should be equal: ${oldContract.schema.contractName} !== ${contractName}`)
  }

  const oldAST = new ContractAST(oldContract, oldArtifacts)
  const oldKind = oldAST.getContractNode().contractKind
  if (oldKind !== newKind) {
    // different contract kind (library/interface/contract)
    return new ASTCodeCompatibilityReport([new ContractKindChange(contractName, oldKind, newKind)])
  }

  const report = doASTCompatibilityReport(contractName, oldAST, newAST)
  // Check deployed byte code change
  const oldBytecodeStripped = stripMetadata(oldContract.schema.deployedBytecode)
  const newBytecodeStripped = stripMetadata(newContract.schema.deployedBytecode)

  if (oldBytecodeStripped !== newBytecodeStripped) {
    report.push(new DeployedBytecodeChange(contractName))
  }

  return report
}

/**
 * Runs an ast code comparison and returns the spotted changes from the built artifacts given.
 *
 * @param oldArtifactsSet
 * @param newArtifactsSets
 */
export function reportASTIncompatibilities(
  // oldArtifacts also needs to be a set
  // https://github.com/celo-org/celo-monorepo/issues/10567
  oldArtifactsSet: BuildArtifacts[],
  newArtifactsSets: BuildArtifacts[]): ASTCodeCompatibilityReport {

  let out: ASTCodeCompatibilityReport[] = []

  // Helper function to get compiler version from artifacts
  const getCompilerVersion = (artifacts: BuildArtifacts): string => {
    const firstArtifact = artifacts.listArtifacts()[0]
    if (firstArtifact?.compiler?.version) {
      return firstArtifact.compiler.version
    }
    // Fallback: try to determine from artifact content
    return 'unknown'
  }

  // Process each new artifacts set and find matching old artifacts by compiler version
  for (const newArtifacts of newArtifactsSets) {
    const newCompilerVersion = getCompilerVersion(newArtifacts)
    console.log(`[INFO] Processing new artifacts with compiler version: ${newCompilerVersion}`)

    // Find matching old artifacts with same compiler version
    let matchingOldArtifacts: BuildArtifacts | null = null
    for (const oldArtifacts of oldArtifactsSet) {
      const oldCompilerVersion = getCompilerVersion(oldArtifacts)
      if (oldCompilerVersion === newCompilerVersion) {
        matchingOldArtifacts = oldArtifacts
        console.log(`[INFO] Found matching old artifacts with compiler version: ${oldCompilerVersion}`)
        break
      }
    }

    if (matchingOldArtifacts) {
      // Compare contracts from same compiler version
      const reports = newArtifacts.listArtifacts()
        .filter((newArtifact) => {
          // Matches all Truffle project artifacts (core contracts and test resource contracts)
          const truffleProjectContractPathPattern = /^project:/
          // Matches Foundry core contracts
          const foundryCoreContractPathPattern = /^contracts(-0\.8)?\//
          // Matches Foundry test resource contracts
          const foundryTestContractPathPattern = /^test-ts/
          const path = newArtifact.ast.absolutePath
          return truffleProjectContractPathPattern.test(path) || foundryCoreContractPathPattern.test(path) || foundryTestContractPathPattern.test(path)
        })
        .map((newArtifact) => {
          const oldArtifact = matchingOldArtifacts!.getArtifactByName(newArtifact.contractName)
          if (oldArtifact) {
            return generateASTCompatibilityReport(makeZContract(oldArtifact), matchingOldArtifacts!, makeZContract(newArtifact), newArtifacts)
          } else {
            // Contract doesn't exist in old artifacts of same version
            console.log(`[INFO] New contract detected: ${newArtifact.contractName} (compiler: ${newCompilerVersion})`)
            return generateASTCompatibilityReport(null, matchingOldArtifacts!, makeZContract(newArtifact), newArtifacts)
          }
        })
      out = [...out, ...reports]
    } else {
      // No matching old artifacts found - treat all contracts as new
      console.log(`[INFO] No matching old artifacts found for compiler version: ${newCompilerVersion}`)
      const fallbackOldArtifacts = oldArtifactsSet.length > 0 ? oldArtifactsSet[0] : null
      if (fallbackOldArtifacts) {
        const reports = newArtifacts.listArtifacts()
          .map((newArtifact) => {
            console.log(`[INFO] New contract (no matching old version): ${newArtifact.contractName} (compiler: ${newCompilerVersion})`)
            return generateASTCompatibilityReport(null, fallbackOldArtifacts!, makeZContract(newArtifact), newArtifacts)
          })
        out = [...out, ...reports]
      } else {
        console.log(`[WARNING] No old artifacts available for fallback comparison`)
      }
    }
  }

  // Check for potentially removed contracts by looking for old artifacts without matching new artifacts
  for (const oldArtifacts of oldArtifactsSet) {
    const oldCompilerVersion = getCompilerVersion(oldArtifacts)

    // Find if there's a matching new artifacts set
    let hasMatchingNewArtifacts = false
    for (const newArtifacts of newArtifactsSets) {
      const newCompilerVersion = getCompilerVersion(newArtifacts)
      if (oldCompilerVersion === newCompilerVersion) {
        hasMatchingNewArtifacts = true
        break
      }
    }

    if (!hasMatchingNewArtifacts) {
      console.log(`[INFO] Old artifacts with compiler ${oldCompilerVersion} have no matching new artifacts - contracts may have been removed`)
      const potentiallyRemovedContracts = oldArtifacts.listArtifacts().map(artifact => artifact.contractName)
      console.log(`[INFO] Potentially removed contracts: ${potentiallyRemovedContracts.join(', ')}`)
    }
  }

  return mergeReports(out)
}
