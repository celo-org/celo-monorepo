/* eslint-disable max-classes-per-file: 0 */
import { BuildArtifacts } from '@openzeppelin/upgrades'
import ContractAST from '@openzeppelin/upgrades/lib/utils/ContractAST'

import { ASTCodeCompatibilityReport } from '@celo/protocol/lib/compatibility/ast-code'
import { ASTStorageCompatibilityReport } from '@celo/protocol/lib/compatibility/ast-layout'
import { categorize, Categorizer, ChangeType } from '@celo/protocol/lib/compatibility/categorizer'
import { Change } from '@celo/protocol/lib/compatibility/change'
import { makeZContract } from '@celo/protocol/lib/compatibility/internal'
import { ContractVersionDelta, ContractVersionDeltaIndex } from '@celo/protocol/lib/compatibility/version'
/**
 * Value object holding all uncategorized storage and code reports.
 */
export class ASTReports {
  constructor(
    public readonly code: ASTCodeCompatibilityReport,
    public readonly storage: ASTStorageCompatibilityReport[],
    public readonly libraryLinking: Change[]
  ) {}

  /**
   * @return a new {@link ASTReports} with the same storage and code
   * reports, excluding all contract names that match the {@param exclude}
   * parameter.
   */
  excluding = (exclude: RegExp): ASTReports => {
    const included = (contract: string): boolean => {
      if (exclude != null) {
        return !exclude.test(contract)
      }
      return true
    }
    const codeReport = new ASTCodeCompatibilityReport(this.code.getChanges().filter(r => included(r.getContract())))
    const storageReports = this.storage.filter(r => included(r.contract))

    const libraryLinkingReport = this.libraryLinking.filter(change => included(change.getContract()))

    return new ASTReports(codeReport, storageReports, libraryLinkingReport)
  }
}

/**
 * A mapping {contract name => {@link CategorizedChanges}}.
 */
export interface CategorizedChangesIndex {
  [contract: string]: CategorizedChanges;
}

/**
 * A {@link CategorizedChanges} builder pattern implementation.
 */
class CategorizedChangesBuilder {
  public storage: ASTStorageCompatibilityReport[] = []
  public major: Change[] = []
  public minor: Change[] = []
  public patch: Change[] = []
  build = (): CategorizedChanges => {
    return new CategorizedChanges(this.storage, this.major, this.minor, this.patch)
  }
}

/**
 * A semantic versioning categorization of a list of contract storage
 * and code changes.
 */
export class CategorizedChanges {

  /**
   * @returns a new {@link CategorizedChanges} according to
   * the {@link Categorizer} given.
   */
  static fromReports(
    reports: ASTReports,
    categorizer: Categorizer): CategorizedChanges {
    const storage = reports.storage.filter(r => !r.compatible)
    const storageExpandedReports = reports.storage.filter(r => r.expanded)
    const c = categorize(reports.code.getChanges().concat(reports.libraryLinking), categorizer)
    const major = [...c[ChangeType.Major], ...storageExpandedReports.map(r => ({ getContract: () => r.contract, accept: () => null}))]
    const minor = c[ChangeType.Minor]
    const patch = c[ChangeType.Patch]
    return new CategorizedChanges(storage, major, minor, patch)
  }

  constructor(
    public readonly storage: ASTStorageCompatibilityReport[],
    public readonly major: Change[],
    public readonly minor: Change[],
    public readonly patch: Change[]) {}

  /**
   * @returns a mapping {contract name => {@link CategorizedChanges}}
   */
  byContract = (): CategorizedChangesIndex => {
    const builders: {[contract: string]: CategorizedChangesBuilder} = {}
    const builder = (contract: string) => {
      if (!builders.hasOwnProperty(contract)) {
        builders[contract] = new CategorizedChangesBuilder()
      }
      return builders[contract]
    }
    this.storage.forEach((r: ASTStorageCompatibilityReport) => builder(r.contract).storage.push(r))
    this.major.forEach((c: Change) => builder(c.getContract()).major.push(c))
    this.minor.forEach((c: Change) => builder(c.getContract()).minor.push(c))
    this.patch.forEach((c: Change) => builder(c.getContract()).patch.push(c))
    const ret: CategorizedChangesIndex = {}
    Object.keys(builders).forEach((contract: string) => {
      ret[contract] = builders[contract].build()
    })
    return ret
  }
}

/**
 * A mapping {contract name => {@link ASTVersionedReport}}.
 */
export interface ContractReports {
  [contract: string]: ASTVersionedReport
}

export interface ASTVersionedReportIndex {
  contracts: ContractReports
  libraries: CategorizedChangesIndex
}

export const isLibrary = (contract: string, artifactsSet: BuildArtifacts[]) => {
  for (const artifacts of artifactsSet){

    const artifact = artifacts.getArtifactByName(contract)
    if (artifact === undefined){
      // EAFP
      // the library may be in another package
      continue
    }
    const zContract = makeZContract(artifact)
    const ast = new ContractAST(zContract, artifacts)
    const kind = ast.getContractNode().contractKind
    return kind === 'library'
  }
}

/**
 * Backward compatibility report for a set of changes, based on
 * the abstract syntax tree analysis of both the storage layout, and code API.
 *
 * Holds {@link CategorizedChanges} and the calculated {@link ContractVersionDelta}.
 */
export class ASTVersionedReport {

  /**
   * @returns a new {@link ASTVersionedReport} with the provided
   * {@link CategorizedChanges} and a calculated version delta
   * according to {@link ContractVersionDelta.fromChanges}.
   */
  static create = (changes: CategorizedChanges): ASTVersionedReport => {
    const versionDelta = ContractVersionDelta.fromChanges(
      changes.storage.length > 0,
      changes.major.length > 0,
      changes.minor.length > 0,
      changes.patch.length > 0
    )
    return new ASTVersionedReport(changes, versionDelta)
  }

  /**
   * @return a new {@link ASTVersionedReportIndex} defined by
   * {contract name => {@link ASTVersionedReport}}, each built
   * by the {@link CategorizedChanges} for each contract.
   */
  static createByContract = (changes: CategorizedChanges, artifactsSet: BuildArtifacts[]): ASTVersionedReportIndex => {
    const changesByContract = changes.byContract()
    const reportIndex: ASTVersionedReportIndex = {
      contracts: {},
      libraries: {}
    }
    Object.keys(changesByContract).forEach((contract: string) => {
      if (isLibrary(contract, artifactsSet)) {
        reportIndex.libraries[contract] = changesByContract[contract]
      } else {
        const report = ASTVersionedReport.create(changesByContract[contract])
        reportIndex.contracts[contract] = report
      }
    })
    return reportIndex
  }

  constructor(
    public readonly changes: CategorizedChanges,
    public readonly versionDelta: ContractVersionDelta) {}
}

/**
 * A report holding detailed {@link ASTVersionedReport} for each contract and library.
 */
export class ASTDetailedVersionedReport {

  static create = (fullReports: ASTReports, newArtifactsSet: BuildArtifacts[], categorizer: Categorizer): ASTDetailedVersionedReport => {
    const changes = CategorizedChanges.fromReports(fullReports, categorizer)
    const reportIndex: ASTVersionedReportIndex = ASTVersionedReport.createByContract(changes, newArtifactsSet)
    return new ASTDetailedVersionedReport(reportIndex.contracts, reportIndex.libraries)
  }

  constructor(
    public readonly contracts: ContractReports,
    public readonly libraries: CategorizedChangesIndex
  ) {}

  versionDeltas = (): ContractVersionDeltaIndex => {
    const deltas = {}
    Object.keys(this.contracts).map((contract: string) => {
      deltas[contract] = this.contracts[contract].versionDelta
    })
    return deltas
  }
}
