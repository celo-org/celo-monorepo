// tslint:disable: max-classes-per-file
import {
  BuildArtifacts,
} from '@openzeppelin/upgrades'
import { ContractVersion, ContractVersions, ContractVersionDelta, ContractVersionDeltaIndex } from '@celo/protocol/lib/compatibility/version'

/**
 * A version report for a specific contract.
 */
export class ASTContractVersionReport {
  constructor(public readonly oldVersion: ContractVersion, public readonly newVersion: ContractVersion, public readonly expectedDelta: ContractVersionDelta) {}

  public expectedVersion = (): ContractVersion => {
    return this.expectedDelta.appliedTo(this.oldVersion)
  }

  public matches = (): boolean => {
    return this.newVersion.toString() === this.expectedVersion().toString()
  }
}

/**
 * A mapping {contract name => {@link ASTVersionReport}}.
 */
export interface ASTContractVersionReportIndex {
  [contract: string]: ASTContractVersionReport
}

export class ASTContractVersionsReport {
  static create = async (oldArtifacts: BuildArtifacts, newArtifacts: BuildArtifacts, expectedVersionDeltas: ContractVersionDeltaIndex): Promise<ASTContractVersionsReport> => {
    const oldVersions = await ContractVersions.fromArtifacts(oldArtifacts)
    const newVersions = await ContractVersions.fromArtifacts(newArtifacts)
    const contracts = {}
    Object.keys(newVersions.contracts).map((contract:string) => {
      const versionDelta = expectedVersionDeltas[contract] === undefined ? ContractVersionDelta.fromChanges(false, false, false, false) : expectedVersionDeltas[contract]
      const oldVersion = oldVersions.contracts[contract] === undefined ? ContractVersion.fromString('0.0.0.0') : oldVersions.contracts[contract]
      contracts[contract] = new ASTContractVersionReport(oldVersion, newVersions.contracts[contract], versionDelta)
    })
    return new ASTContractVersionsReport(contracts)
  }
  constructor(public readonly contracts: ASTContractVersionReportIndex) {}

  /**
   * @return a new {@link ASTContractVersionsResport} with the same version 
   * reports, excluding all contract names that match the {@param exclude}
   * parameter.
   */
  excluding = (exclude: RegExp): ASTContractVersionsReport => {
    const included = (contract: string): boolean => {
      if (exclude != null) {
        return !exclude.test(contract)
      }
      return true
    }
    const contracts = {}
    Object.keys(this.contracts).filter(included).map((contract: string) => {
      contracts[contract] = this.contracts[contract]
    })
    return new ASTContractVersionsReport(contracts)
  }


  public mismatches = () : ASTContractVersionsReport => {
    const mismatches = {}
    Object.keys(this.contracts).map((contract: string) => {
      if (!this.contracts[contract].matches()) {
        mismatches[contract] = this.contracts[contract]
      }
    })
    return new ASTContractVersionsReport(mismatches)
  }

  public isEmpty = (): boolean => {
    return Object.keys(this.contracts).length === 0
  }
}
