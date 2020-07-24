// tslint:disable: max-classes-per-file
import { makeZContract } from '@celo/protocol/lib/compatibility/internal'
import {
  BuildArtifacts,
  Contract as ZContract
} from '@openzeppelin/upgrades'
const VM = require('ethereumjs-vm').default
const abi = require('ethereumjs-abi')

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

  static fromBuffer = (version: Buffer): ContractVersion => {
    if (version.length !== 4 * 32) {
      throw new Error(`Invalid version buffer: ${version}`)
    }
    const storage = version.slice(0, 32)
    const major = version.slice(32, 64)
    const minor = version.slice(64, 96)
    const patch = version.slice(96, 128)
    return ContractVersion.fromString(`${storage.toString('hex')}.${major.toString('hex')}.${minor.toString('hex')}.${patch.toString('hex')}`)
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
  static fromArtifacts = async (artifacts: BuildArtifacts): Promise<ContractVersions>=> {
    const contracts = {}

    await Promise.all(artifacts.listArtifacts().map(async (artifact) => {
      contracts[artifact.contractName] = await getContractVersion(makeZContract(artifact))
    }))
    return new ContractVersions(contracts)
  }

  constructor(public readonly contracts: ContractVersionIndex) {}
}

async function getContractVersion(contract: ZContract): Promise<ContractVersion> {
  const vm = new VM()
  const bytecode = contract.schema.deployedBytecode
  const data = '0x' + abi.methodID('getVersionNumber', []).toString('hex')
  const nullAddress = '0000000000000000000000000000000000000000'
  // Artificially link all libraries to the null address.
  const linkedBytecode = bytecode.split(/[_]+[A-Za-z0-9]+[_]+/).join(nullAddress)
  const result = await vm.runCall({
    to: Buffer.from('756F45E3FA69347A9A973A725E3C98bC4db0b5a0', 'hex'),
    caller: Buffer.from('756F45E3FA69347A9A973A725E3C98bC4db0b5a0', 'hex'),
    code: Buffer.from(linkedBytecode.slice(2), 'hex'),
    static: true,
    data: Buffer.from(data.slice(2), 'hex')
  })
  if (result.execResult.exceptionError === undefined) {
    const value = result.execResult.returnValue
    if (value.length === 4 * 32) {
      return ContractVersion.fromBuffer(value)
    }
  }
  // If we can't fetch the version number, assume version 1.0.0.0.
  return ContractVersion.fromString('1.0.0.0')
}
