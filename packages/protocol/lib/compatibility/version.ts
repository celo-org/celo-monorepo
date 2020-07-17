// tslint:disable: max-classes-per-file
import { makeZContract } from '@celo/protocol/lib/compatibility/internal'
import {
  BuildArtifacts,
  Contract as ZContract
} from '@openzeppelin/upgrades'
// const VM = require('ethereumjs-vm')

export class ContractVersion {

  static isValid = (version: string): boolean => {
    const v = version.split(".")
    if (v.length !== 4) {
      return false
    }
    const isNumber = (versionDigit) => !isNaN(Number(versionDigit))
    return v.every(isNumber)
  }

  static fromString = (version: string): ContractVersion => {
    if (!ContractVersion.isValid(version)) {
      throw new Error(`Invalid version format: ${version}`)
    }
    const v = version.split(".")
    return new ContractVersion(
      Number(v[0]),
      Number(v[1]),
      Number(v[2]),
      Number(v[3])
    )
  }

  constructor(
    public readonly storage: number,
    public readonly major: number,
    public readonly minor: number,
    public readonly patch: number) {}

  public toString = () : string => {
    const deltas = [this.storage, this.major, this.minor, this.patch]
    return deltas.join('.')
  }

  public getDelta = (fromVersion: ContractVersion): ContractVersionDelta => {
    const difference = [this.storage - fromVersion.storage, this.major - fromVersion.major, this.minor - fromVersion.minor, this.patch - fromVersion.patch]
    // ContractVersionDeltas require at most one version number be incremented.
    const nonZero = difference.filter(x => x !== 0)
    if (nonZero.length > 1 || nonZero.some(x => x !== 1)) {
      throw new Error(`Invalid delta between versions: ${fromVersion.toString()} -> ${this.toString()}`)
    }
    return ContractVersionDelta.fromChanges.apply(null, difference.map(x => x != 0))
  }
}

export enum Delta {
  None = "=",
  Increment = "+1",
  Reset = "0"
}

export class DeltaUtil {

  static applyToNumber = (delta: Delta, n: number): number => {
    if (delta === Delta.None) {
      return n
    }
    if (delta === Delta.Reset) {
      return 0
    }
    if (delta === Delta.Increment) {
      return n + 1
    }
    throw new Error(`Unexpected Delta instance: ${delta}`)
  }
}

export class ContractVersionDelta {

  static fromChanges = (
    storageChanged: boolean,
    majorChanged: boolean,
    minorChanged: boolean,
    patchChanged: boolean): ContractVersionDelta => {
    const r = Delta.Reset
    const n = Delta.None
    if (storageChanged) {
      return new ContractVersionDelta(Delta.Increment, r, r, r)
    }
    if (majorChanged) {
      return new ContractVersionDelta(n, Delta.Increment, r, r)
    }
    if (minorChanged) {
      return new ContractVersionDelta(n, n, Delta.Increment, r)
    }
    if (patchChanged) {
      return new ContractVersionDelta(n, n, n, Delta.Increment)
    }
    return new ContractVersionDelta(n, n, n, n)
  }

  constructor(
    public readonly storage: Delta,
    public readonly major: Delta,
    public readonly minor: Delta,
    public readonly patch: Delta) {}

  appliedTo = (version: ContractVersion): ContractVersion => {
    return new ContractVersion(
      DeltaUtil.applyToNumber(this.storage, version.storage),
      DeltaUtil.applyToNumber(this.major, version.major),
      DeltaUtil.applyToNumber(this.minor, version.minor),
      DeltaUtil.applyToNumber(this.patch, version.patch)
      )
  }

  public toString = () : string => {
    const deltas = [this.storage, this.major, this.minor, this.patch]
    return deltas.map(d => d.toString()).join('.')
  }
}

export class ContractVersionReport {
  constructor(
    public readonly contract: string,
    public readonly oldVersion: ContractVersion,
    public readonly newVersion: ContractVersion) {}
  delta = (): ContractVersionDelta => {
    return this.newVersion.getDelta(this.oldVersion)
  }
}

/**
 * A compatibility report with all the detected changes from two compiled
 * contract folders.
 */
export class ContractVersionsReport {
  constructor(private readonly versions: ContractVersionReport[]) {}
  push(...versions: ContractVersionReport[]) {
    this.versions.push(...versions)
  }
  include(other: ContractVersionsReport) {
    this.push(...other.versions)
  }
  getVersions = (): ContractVersionReport[] => {
    return this.versions
  }
}

function mergeReports(reports: ContractVersionsReport[]): ContractVersionsReport {
  const report = new ContractVersionsReport([])
  reports.forEach((r: ContractVersionsReport): void => {
    report.include(r)
  })
  return report
}

function getContractVersion(contract: ZContract): ContractVersion {
  //const vm = new VM()
  const bytecode = contract.schema.deployedBytecode
  console.log(bytecode)
  /*
  const version = await new Promise((resolve, reject) => {
    vm.runCode(
      {
        code: Buffer.from(bytecode.slice(2), 'hex'),
      },
      (err: any, results: any) => {
        if (err) {
          reject(err)
        } else {
          resolve('0x' + results.return.toString('hex'))
        }
      }
    )
  })
  */
  // TODO(asa): This is wrong!
  return ContractVersion.fromString('1.0.0.0')
}

function generateContractVersionsReport(oldContract: ZContract, newContract: ZContract): ContractVersionsReport {
  // Sanity checks
  if (newContract === null) {
    throw new Error('newContract cannot be null')
  }
  const contractName = newContract.schema.contractName


  let oldVersion = ContractVersion.fromString('0.0.0.0')
  if (oldContract !== null) {
    oldVersion = getContractVersion(oldContract)
    // Name sanity check
    if (oldContract.schema.contractName !== contractName) {
      throw new Error(`Contract names should be equal: ${oldContract.schema.contractName} !== ${contractName}`)
    }
  }

  const newVersion = getContractVersion(newContract)
  return new ContractVersionsReport([new ContractVersionReport(contractName, oldVersion, newVersion)])
}

/**
 * Extracts contract versions from the provided artifacts.
 *
 * @param oldArtifacts
 * @param newArtifacts
 */
export function reportContractVersions(
  oldArtifacts: BuildArtifacts,
  newArtifacts: BuildArtifacts): ContractVersionsReport {
  const reports = newArtifacts.listArtifacts()
  .map((newArtifact) => {
    const oldArtifact = oldArtifacts.getArtifactByName(newArtifact.contractName)
    const oldZContract = oldArtifact ? makeZContract(oldArtifact) : null
    return generateContractVersionsReport(oldZContract, makeZContract(newArtifact))
  })
  return mergeReports(reports)
}
