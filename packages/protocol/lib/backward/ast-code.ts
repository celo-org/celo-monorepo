// tslint:disable: max-classes-per-file
import { makeZContract } from '@celo/protocol/lib/backward/internal';
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

export class ASTCodeCompatibilityReport {
  changes: Change[];
  constructor(changes: Change[]) {
    this.changes = changes;
  }
  public push(...changes: Change[]) {
    this.changes.push(...changes)
  }
  public include(other: ASTCodeCompatibilityReport) {
    this.push(...other.changes)
  }
}

export interface Change {
  getContract(): string;
  accept<T>(visitor: ChangeVisitor<T>): T;
}

export enum ChangeType { Patch, Minor, Major };

export interface ChangeVisitor<T> {
  visitMethodMutability(change: MethodMutabilityChange): T;
  visitMethodParameters(change: MethodParametersChange): T;
  visitMethodReturn(change: MethodReturnChange): T;
  visitMethodVisibility(change: MethodVisibilityChange): T;
  visitMethodAdded(change: MethodAddedChange): T;
  visitMethodRemoved(change: MethodRemovedChange): T;
  visitContractType(change: ContractTypeChange): T;
  visitNewContract(change: NewContractChange): T;
  visitDeployedBytecode(change: DeployedBytecodeChange): T;
}

export abstract class DefaultChangeVisitor<T> implements ChangeVisitor<T> {
  abstract visitDefault(change: Change): T;
  visitMethodMutability = (change: MethodMutabilityChange): T => this.visitDefault(change);
  visitMethodParameters = (change: MethodParametersChange): T => this.visitDefault(change);
  visitMethodReturn = (change: MethodReturnChange): T => this.visitDefault(change);
  visitMethodVisibility = (change: MethodVisibilityChange): T => this.visitDefault(change);
  visitMethodAdded = (change: MethodAddedChange): T => this.visitDefault(change);
  visitMethodRemoved = (change: MethodRemovedChange): T => this.visitDefault(change);
  visitContractType = (change: ContractTypeChange): T => this.visitDefault(change);
  visitNewContract = (change: NewContractChange): T => this.visitDefault(change);
  visitDeployedBytecode = (change: DeployedBytecodeChange): T => this.visitDefault(change);
}

export class CategorizerChangeVisitor extends DefaultChangeVisitor<ChangeType> {
  constructor() { super(); }
  // By default assume all are major changes
  visitDefault = (_change: Change): ChangeType => ChangeType.Major;

  visitMethodAdded = (_change: MethodAddedChange): ChangeType => ChangeType.Minor;
  visitNewContract = (_change: NewContractChange): ChangeType => ChangeType.Minor;
  visitMethodVisibility = (change: MethodVisibilityChange): ChangeType => {
    if (change.oldValue === VISIBILITY_PUBLIC && change.newValue === VISIBILITY_EXTERNAL) {
      // Broader visibility, minor change
      return ChangeType.Minor;
    }
    return ChangeType.Major;
  }
  visitDeployedBytecode = (_change: DeployedBytecodeChange): ChangeType => ChangeType.Patch;
}

export class EnglishToStringVisitor implements ChangeVisitor<string> {
  visitMethodMutability(change: MethodMutabilityChange): string {
    return `Mutability of method ${change.contract}.${change.signature} changed from '${change.oldValue}' to '${change.newValue}'`;
  }
  visitMethodParameters(change: MethodParametersChange): string {
    return `Parameters of method ${change.contract}.${change.signature} changed from '${change.oldValue}' to '${change.newValue}'`;
  }
  visitMethodReturn(change: MethodReturnChange): string {
    return `Return parameters of method ${change.contract}.${change.signature} changed from '${change.oldValue}' to '${change.newValue}'`;
  }
  visitMethodVisibility(change: MethodVisibilityChange): string {
    return `Visibility of method ${change.contract}.${change.signature} changed from '${change.oldValue}' to '${change.newValue}'`;
  }
  visitMethodAdded(change: MethodAddedChange): string {
    return `Contract '${change.contract}' has a new method: '${change.signature}'`;
  }
  visitMethodRemoved(change: MethodRemovedChange): string {
    return `Contract '${change.contract}' deleted a method: '${change.signature}'`;
  }
  visitContractType(change: ContractTypeChange): string {
    return `Contract '${change.contract}' changed its type from '${change.oldValue}' to '${change.newValue}'`;
  }
  visitNewContract(change: NewContractChange): string {
    return `Contract '${change.contract}' was created`;
  }
  visitDeployedBytecode(change: DeployedBytecodeChange): string {
    return `Contract '${change.contract}' has a modified 'deployedBytecode' binary property`;
  }
}

abstract class ContractChange implements Change {
  type: string;
  contract: string;
  constructor(contract: string) {
    this.contract = contract;
  }
  getContract() {
    return this.contract;
  }

  abstract accept<T>(visitor: ChangeVisitor<T>): T;
}

export class NewContractChange extends ContractChange {
  type = "NewContract";
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.visitNewContract(this);
  }
}

abstract class ContractValueChange extends ContractChange {
  oldValue: string;
  newValue: string;
  constructor(contract: string, oldValue: string, newValue: string) {
    super(contract);
    this.oldValue = oldValue;
    this.newValue = newValue;
  }
}

export class DeployedBytecodeChange extends ContractChange {
  type = "DeployedBytecode";
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.visitDeployedBytecode(this);
  }
}

export class ContractTypeChange extends ContractValueChange {
  type = "ContractType";
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.visitContractType(this);
  }
}

abstract class MethodChange extends ContractChange {
  signature: string;
  constructor(contract: string, signature: string) {
    super(contract);
    this.signature = signature;
  }
  getSignature() {
    return this.signature;
  }
}

export class MethodAddedChange extends MethodChange {
  type = "MethodAdded";
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.visitMethodAdded(this);
  }
}

export class MethodRemovedChange extends MethodChange {
  type = "MethodRemoved";
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.visitMethodRemoved(this);
  }
}

abstract class MethodValueChange extends MethodChange {
  oldValue: string;
  newValue: string;
  constructor(contract: string, signature: string, oldValue: string, newValue: string) {
    super(contract, signature);
    this.oldValue = oldValue;
    this.newValue = newValue;
  }
}

export class MethodVisibilityChange extends MethodValueChange {
  type = "MethodVisibility";
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.visitMethodVisibility(this);
  }
}

export class MethodMutabilityChange extends MethodValueChange {
  type = "MethodMutability";
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.visitMethodMutability(this);
  }
}

export class MethodParametersChange extends MethodValueChange {
  type = "MethodParameters";
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.visitMethodParameters(this);
  }
}

export class MethodReturnChange extends MethodValueChange {
  type = "MethodReturn";
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.visitMethodReturn(this);
  }
}

export interface ASTError {
  message: string,
  wrapped: Error
}

export const createIndexByChangeType = (changes: Change[], categorizer: ChangeVisitor<ChangeType>): Change[][] => {
  const byCategory = []
  for (const ct of Object.values(ChangeType)) {
    byCategory[ct] = []
  }
  changes.map(c => byCategory[c.accept(categorizer)].push(c));
  return byCategory;
}

const getSignature = (method: any): string => {
  // This is used as the ID of a method
  return `${method.selector}`
}


const createMethodIndex = (methods: any[]): any[] => {
  const asPairs = methods.map(m => ({ [`${getSignature(m)}`]: m }))
  return Object.assign({}, ...asPairs)
}

const mergeReports = (reports: ASTCodeCompatibilityReport[]): ASTCodeCompatibilityReport => {
  const report = new ASTCodeCompatibilityReport([])
  reports.forEach((r: ASTCodeCompatibilityReport): void => {
    report.include(r)
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

const checkMethodCompatibility = (contract: string, m1: any, m2: any): ASTCodeCompatibilityReport => {
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
    report.push(new MethodParametersChange(contract, signature, ret1, ret2))
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
  const checkableMethods = (method: any) => method.visibility === VISIBILITY_EXTERNAL || method.visibility === VISIBILITY_PUBLIC
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

const doASTCompatibilityReport = (contractName: string, oldAST: ContractAST, newAST: ContractAST): ASTCodeCompatibilityReport => {
  const oldMethods = createMethodIndex(getCheckableMethodsFromAST(oldAST, 'old'))
  const newMethods = createMethodIndex(getCheckableMethodsFromAST(newAST, 'new'))

  const report = new ASTCodeCompatibilityReport([])

  // Check for modified or missing methods in the new version
  Object.keys(oldMethods).forEach((signature: string) => {
    const method = oldMethods[signature]
    if (!newMethods.hasOwnProperty(signature)) {
      // Method deleted, major change
      report.push(new MethodRemovedChange(contractName, signature))
      // Continue
      return
    }
    const newMethod = newMethods[signature]
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

const generateASTCompatibilityReport = (oldContract: ZContract, oldArtifacts: BuildArtifacts,
  newContract: ZContract, newArtifacts: BuildArtifacts): ASTCodeCompatibilityReport => {
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
    if (newKind === CONTRACT_TYPE_CONTRACT) {
      return new ASTCodeCompatibilityReport([new NewContractChange(contractName)])
    } else {
      // New contract added of a non-contract type (library/interface)
      // therefore no functionality added
      return new ASTCodeCompatibilityReport([])
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
    return new ASTCodeCompatibilityReport([new ContractTypeChange(contractName, kind, newKind)])
  }

  const report = doASTCompatibilityReport(contractName, oldAST, newAST)
  // Check deployed byte code change
  if (oldContract.schema.deployedBytecode !== newContract.schema.deployedBytecode) {
    report.push(new DeployedBytecodeChange(contractName))
  }
  return report
}

export const reportASTIncompatibilities = (oldArtifacts: BuildArtifacts, newArtifacts: BuildArtifacts): ASTCodeCompatibilityReport => {
  const reports = newArtifacts.listArtifacts()
  .map((newArtifact) => {
    const oldArtifact = oldArtifacts.getArtifactByName(newArtifact.contractName)
    const oldZContract = oldArtifact ? makeZContract(oldArtifact) : null
    return generateASTCompatibilityReport(oldZContract, oldArtifacts, makeZContract(newArtifact), newArtifacts)
  })
  return mergeReports(reports)
}