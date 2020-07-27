// tslint:disable: max-classes-per-file
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

// Exported classes

/**
 * A compatibility report with all the detected changes from two compiled
 * contract folders.
 */
export class ASTCodeCompatibilityReport {
  constructor(private readonly changes: Change[]) {}
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

/**
 * A code change detected from an old to a new version of a contract.
 */
export interface Change {
  getContract(): string
  accept<T>(visitor: ChangeVisitor<T>): T
}

/**
 * Visitor pattern implementation for the {@link Change} hierarchy.
 */
export interface ChangeVisitor<T> {
  onMethodMutability(change: MethodMutabilityChange): T
  onMethodParameters(change: MethodParametersChange): T
  onMethodReturn(change: MethodReturnChange): T
  onMethodVisibility(change: MethodVisibilityChange): T
  onMethodAdded(change: MethodAddedChange): T
  onMethodRemoved(change: MethodRemovedChange): T
  onContractKind(change: ContractKindChange): T
  onNewContract(change: NewContractChange): T
  onDeployedBytecode(change: DeployedBytecodeChange): T
}

/**
 * Abstract implementation for the {@link Change} interface.
 */
abstract class ContractChange implements Change {
  type: string
  constructor(private readonly contract: string) {
    this.contract = contract
  }
  getContract() {
    return this.contract
  }

  abstract accept<T>(visitor: ChangeVisitor<T>): T
}

/**
 * A 'New Contract' change detected during the compatibility report. A
 * contract was found in the new folder that was not present in the old
 * folder. The id which is used to do this comparison is the name of the
 * contract, therefore not only adding a contract, but a name change
 * would produce this change.
 */
export class NewContractChange extends ContractChange {
  type = "NewContract"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onNewContract(this)
  }
}

/**
 * Abstract class providing standard 'old value => new value' functionality
 * for {@link ContractChange}
 */
abstract class ContractValueChange extends ContractChange {
  constructor(
    contract: string, 
    public readonly oldValue: string, 
    public readonly newValue: string) {
    super(contract)
  }
}

/**
 * The deployedBytecode field in the built json artifact has changed
 * from the old folder to the new one. This is, barring metadata
 * differences (e.ge source folder full path), due to an implementation
 * change.
 *
 * To avoid false positives, compile both old and new folders in the same
 * full path.
 * 
 * This is currently not stripping any compiler metadata from the bytecode.
 */
export class DeployedBytecodeChange extends ContractChange {
  type = "DeployedBytecode"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onDeployedBytecode(this)
  }
}

/**
 * The Kind of a contract changed. Kind examples are
 * 'contract' or 'library'.
 */
export class ContractKindChange extends ContractValueChange {
  type = "ContractKind"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onContractKind(this)
  }
}

/**
 * Abstract implementation for the {@link Change} interface for
 * method changes.
 *
 * Since we use the {@link signature} as the id of the method, it's
 * the same value for the old and the new contract.
 */
abstract class MethodChange extends ContractChange {
  constructor(contract: string, private readonly signature: string) {
    super(contract)
  }
  getSignature() {
    return this.signature
  }
}

/**
 * A new method was found in the new version of the contract.
 */
export class MethodAddedChange extends MethodChange {
  type = "MethodAdded"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodAdded(this)
  }
}

/**
 * A method from the old version is not present in the new version.
 */
export class MethodRemovedChange extends MethodChange {
  type = "MethodRemoved"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodRemoved(this)
  }
}

/**
 * Abstract class providing standard 'old value => new value' functionality
 * for {@link MethodChange}
 */
abstract class MethodValueChange extends MethodChange {
  constructor(contract: string, signature: string,
    public readonly oldValue: string,
    public readonly newValue: string) {
    super(contract, signature)
  }
}

/**
 * The visibility (public/external) of a method changed.
 */
export class MethodVisibilityChange extends MethodValueChange {
  type = "MethodVisibility"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodVisibility(this)
  }
}

/**
 * The mutability (payable/pure/view...) of a method changed.
 */
export class MethodMutabilityChange extends MethodValueChange {
  type = "MethodMutability"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodMutability(this)
  }
}

/**
 * The input parameters of a method changed. Since the input parameters
 * are used as the id of a method, this should probably never appear.
 */
export class MethodParametersChange extends MethodValueChange {
  type = "MethodParameters"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodParameters(this)
  }
}

/**
 * The return parameters of a method changed.
 */
export class MethodReturnChange extends MethodValueChange {
  type = "MethodReturn"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodReturn(this)
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

function mergeReports(reports: ASTCodeCompatibilityReport[]): ASTCodeCompatibilityReport{
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
  // Parameters signature (types are already equal, but this will check for storage locations)
  const par1 = parametersSignature(m1.parameters.parameters)
  const par2 = parametersSignature(m2.parameters.parameters)
  if (par1 !== par2) {
    report.push(new MethodParametersChange(contract, signature, par1, par2))
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
  if (oldContract.schema.deployedBytecode !== newContract.schema.deployedBytecode) {
    report.push(new DeployedBytecodeChange(contractName))
  }
  return report
}

/**
 * Runs an ast code comparison and returns the spotted changes from the built artifacts given.
 *
 * @param oldArtifacts
 * @param newArtifacts
 */
export function reportASTIncompatibilities(
  oldArtifacts: BuildArtifacts,
  newArtifacts: BuildArtifacts): ASTCodeCompatibilityReport {
  const reports = newArtifacts.listArtifacts()
  .map((newArtifact) => {
    const oldArtifact = oldArtifacts.getArtifactByName(newArtifact.contractName)
    const oldZContract = oldArtifact ? makeZContract(oldArtifact) : null
    return generateASTCompatibilityReport(oldZContract, oldArtifacts, makeZContract(newArtifact), newArtifacts)
  })
  return mergeReports(reports)
}