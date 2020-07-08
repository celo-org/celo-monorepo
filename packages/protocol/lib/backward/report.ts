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
    const codeReport = new ASTCodeCompatibilityReport(this.code.changes.filter(r => included(r.getContract())))
    const storageReports = this.storage.filter(r => included(r.contract))
    return new ASTReports(codeReport, storageReports)
  }
}

export class CategorizedChanges {

  static fromReports(
    reports: ASTReports,
    categorizer: Categorizer): CategorizedChanges {
    const storage = reports.storage.filter(r => !r.compatible)
    const c = categorize(reports.code.changes, categorizer)
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

}

/**
 * Backward compatibility report, based on both the abstract syntax tree analysis of
 * both the storage layout, and code API.
 */
export class ASTVersionedReport {
  
  static create = (fullReports: ASTReports, categorizer: Categorizer): ASTVersionedReport => {
    const changes = CategorizedChanges.fromReports(fullReports, categorizer)
    const versionDelta = ContractVersionDelta.fromChanges(
      changes.storage.length > 0,
      changes.major.length > 0,
      changes.minor.length > 0,
      changes.patch.length > 0
    )
    return new ASTVersionedReport(fullReports, changes, versionDelta)
  }
  constructor(
    public readonly fullReports: ASTReports, 
    public readonly changes: CategorizedChanges,
    public readonly versionDelta: ContractVersionDelta) {}
}
