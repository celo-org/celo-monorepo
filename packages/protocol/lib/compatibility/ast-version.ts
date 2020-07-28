// tslint:disable: max-classes-per-file
import { makeZContract } from '@celo/protocol/lib/compatibility/internal'
import { ContractVersionChecker, ContractVersionCheckerIndex, ContractVersionDelta, ContractVersionDeltaIndex, ContractVersion, ContractVersionIndex } from '@celo/protocol/lib/compatibility/version'
import {
  BuildArtifacts,
  Contract as ZContract
} from '@openzeppelin/upgrades'
const VM = require('ethereumjs-vm').default
const abi = require('ethereumjs-abi')

/**
 * A mapping {contract name => {@link ContractVersion}}.
 */
export class ASTContractVersions {
  static fromArtifacts = async (artifacts: BuildArtifacts): Promise<ASTContractVersions>=> {
    const contracts = {}

    await Promise.all(artifacts.listArtifacts().map(async (artifact) => {
      contracts[artifact.contractName] = await getContractVersion(makeZContract(artifact))
    }))
    return new ASTContractVersions(contracts)
  }

  constructor(public readonly contracts: ContractVersionIndex) {}
}

/**
 * Gets the version of a contract by calling Contract.getVersionNumber() on
 * the contract deployed bytecode.
 *
 * If the contract version cannot be retrieved, returns version 1.0.0.0 by default.
 */
async function getContractVersion(contract: ZContract): Promise<ContractVersion> {
  const vm = new VM()
  const bytecode = contract.schema.deployedBytecode
  const data = '0x' + abi.methodID('getVersionNumber', []).toString('hex')
  const nullAddress = '0000000000000000000000000000000000000000'
  // Artificially link all libraries to the null address.
  const linkedBytecode = bytecode.split(/[_]+[A-Za-z0-9]+[_]+/).join(nullAddress)
  const result = await vm.runCall({
    to: Buffer.from(nullAddress, 'hex'),
    caller: Buffer.from(nullAddress, 'hex'),
    code: Buffer.from(linkedBytecode.slice(2), 'hex'),
    static: true,
    data: Buffer.from(data.slice(2), 'hex')
  })
  if (result.execResult.exceptionError === undefined) {
    const value = result.execResult.returnValue
    if (value.length === 4 * 32) {
      return ContractVersion.fromGetVersionNumberReturnValue(value)
    }
  }
  // If we can't fetch the version number, assume version 1.0.0.0.
  return ContractVersion.fromString('1.0.0.0')
}

export class ASTContractVersionsChecker {
  static create = async (oldArtifacts: BuildArtifacts, newArtifacts: BuildArtifacts, expectedVersionDeltas: ContractVersionDeltaIndex): Promise<ASTContractVersionsChecker> => {
    const oldVersions = await ASTContractVersions.fromArtifacts(oldArtifacts)
    const newVersions = await ASTContractVersions.fromArtifacts(newArtifacts)
    const contracts = {}
    Object.keys(newVersions.contracts).map((contract:string) => {
      const versionDelta = expectedVersionDeltas[contract] === undefined ? ContractVersionDelta.fromChanges(false, false, false, false) : expectedVersionDeltas[contract]
      // For new contracts, the expected version delta is no change. Defaulting to an old version
      // of 1.0.0.0 will thus imply a version of 1.0.0.0 for added contracts.
      const oldVersion = oldVersions.contracts[contract] === undefined ? ContractVersion.fromString('1.0.0.0') : oldVersions.contracts[contract]
      contracts[contract] = new ContractVersionChecker(oldVersion, newVersions.contracts[contract], versionDelta)
    })
    return new ASTContractVersionsChecker(contracts)
  }
  constructor(public readonly contracts: ContractVersionCheckerIndex) {}

  /**
   * @return a new {@link ASTContractVersionsChecker} with the same contracts
   * excluding all those whose names match the {@param exclude} parameters.
   */
  excluding = (exclude: RegExp): ASTContractVersionsChecker => {
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
    return new ASTContractVersionsChecker(contracts)
  }


  public mismatches = () : ASTContractVersionsChecker => {
    const mismatches = {}
    Object.keys(this.contracts).map((contract: string) => {
      if (!this.contracts[contract].matches()) {
        mismatches[contract] = this.contracts[contract]
      }
    })
    return new ASTContractVersionsChecker(mismatches)
  }

  public isEmpty = (): boolean => {
    return Object.keys(this.contracts).length === 0
  }
}
