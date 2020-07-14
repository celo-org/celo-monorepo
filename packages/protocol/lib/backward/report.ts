// tslint:disable: max-classes-per-file
import {
  ASTCodeCompatibilityReport,
  Change
} from '@celo/protocol/lib/backward/ast-code'
import { ASTStorageCompatibilityReport } from '@celo/protocol/lib/backward/ast-layout'
import { categorize, Categorizer, ChangeType } from '@celo/protocol/lib/backward/categorizer'
import { ContractVersionDelta } from '@celo/protocol/lib/backward/version'


export class ASTReports {
  
  constructor(
    public readonly code: ASTCodeCompatibilityReport,
    public readonly storage: ASTStorageCompatibilityReport[]) {}

  excluding = (exclude: RegExp): ASTReports => {
    const included = (contract: string): boolean => {
      if (exclude != null) {
        return !exclude.test(contract)
      }
      return true
    }
    const codeReport = new ASTCodeCompatibilityReport(this.code.getChanges().filter(r => included(r.getContract())))
    const storageReports = this.storage.filter(r => included(r.contract))
    return new ASTReports(codeReport, storageReports)
  }
}

export interface CategorizedChangesIndex {
  [contract: string]: CategorizedChanges;
}

class CategorizedChangesBuilder {
  public storage: ASTStorageCompatibilityReport[] = []
  public major: Change[] = []
  public minor: Change[] = []
  public patch: Change[] = []
  build = (): CategorizedChanges => {
    return new CategorizedChanges(this.storage, this.major, this.minor, this.patch)
  }
}

export class CategorizedChanges {

  static fromReports(
    reports: ASTReports,
    categorizer: Categorizer): CategorizedChanges {
    const storage = reports.storage.filter(r => !r.compatible)
    const c = categorize(reports.code.getChanges(), categorizer)
    const major = c[ChangeType.Major]
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
  explode = (): CategorizedChangesIndex => {
    const builders: {[k: string]: CategorizedChangesBuilder} = {}
    const builder = (k: string) => {
      if (!builders.hasOwnProperty(k)) {
        builders[k] = new CategorizedChangesBuilder()
      }
      return builders[k]
    }
    this.storage.forEach((r: ASTStorageCompatibilityReport) => builder(r.contract).storage.push(r))
    this.major.forEach((c: Change) => builder(c.getContract()).major.push(c))
    this.minor.forEach((c: Change) => builder(c.getContract()).minor.push(c))
    this.patch.forEach((c: Change) => builder(c.getContract()).patch.push(c))
    const ret: CategorizedChangesIndex = {}
    Object.keys(builders).forEach((k: string) => {
      ret[k] = builders[k].build()
    })
    return ret
  }
}

export interface ASTVersionedReportIndex {
  [contract: string]: ASTVersionedReport
}

/**
 * Backward compatibility report, based on both the abstract syntax tree analysis of
 * both the storage layout, and code API.
 */
export class ASTVersionedReport {
  
  static create = (changes: CategorizedChanges): ASTVersionedReport => {
    const versionDelta = ContractVersionDelta.fromChanges(
      changes.storage.length > 0,
      changes.major.length > 0,
      changes.minor.length > 0,
      changes.patch.length > 0
    )
    return new ASTVersionedReport(changes, versionDelta)
  }

  static createByContract = (changes: CategorizedChanges): ASTVersionedReportIndex => {
    const changesIndex = changes.explode()
    const ret: ASTVersionedReportIndex = {}
    Object.keys(changesIndex).forEach((contract: string) => {
      ret[contract] = ASTVersionedReport.create(changesIndex[contract])
    })
    return ret
  }

  constructor(
    public readonly changes: CategorizedChanges,
    public readonly versionDelta: ContractVersionDelta) {}
}

export class ASTDetailedVersionedReport {

  static create = (fullReports: ASTReports, categorizer: Categorizer): ASTDetailedVersionedReport => {
    const changes = CategorizedChanges.fromReports(fullReports, categorizer)
    const global = ASTVersionedReport.create(changes)
    const contracts: ASTVersionedReportIndex = ASTVersionedReport.createByContract(changes)
    return new ASTDetailedVersionedReport(global, contracts)
  }

  constructor(
    public readonly global: ASTVersionedReport,
    public readonly contracts: ASTVersionedReportIndex
  ) {}

}