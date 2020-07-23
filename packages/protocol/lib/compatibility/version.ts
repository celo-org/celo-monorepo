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
  public expectedVersion = (): ContractVersion => {
    return this.expectedDelta.appliedTo(this.oldVersion)
  }

  public isNewVersionExpected = (): boolean => {
    return this.newVersion.toString() === this.expectedVersion().toString()
  }

  constructor(
    public readonly oldVersion: ContractVersion,
    public readonly newVersion: ContractVersion,
    public readonly expectedDelta: ContractVersionDelta) {}
}

/**
 * A mapping {contract name => {@link ContractVersionDelta}}.
 */
export interface ContractVersionDeltaIndex {
  [contract: string]: ContractVersionDelta
}

/**
 * A mapping {contract name => {@link ContractVersion}}.
 */
export interface ContractVersionIndex {
  [contract: string]: ContractVersion;
}

/**
 * A mapping {contract name => {@link ContractVersion}}.
 */
export class ContractVersions {
  static fromArtifacts = (artifacts: BuildArtifacts): ContractVersions => {
    const contracts = {}

    artifacts.listArtifacts().map((artifact) => {
      contracts[artifact.contractName] = getContractVersion(makeZContract(artifact))
    })
    return new ContractVersions(contracts)
  }

  constructor(public readonly contracts: ContractVersionIndex) {}
}

function getContractVersion(contract: ZContract): ContractVersion {
  //const vm = new VM()
  const bytecode = contract.schema.deployedBytecode
  if (false) {
  console.log(bytecode)
  }
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
