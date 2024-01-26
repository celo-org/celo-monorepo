/* eslint-disable max-classes-per-file: 0 */
export const DEFAULT_VERSION_STRING = '1.1.0.0'

export class ContractVersion {

  static isValid = (version: string): boolean => {
    const v = version.split(".")
    if (v.length !== 4) {
      return false
    }

    const isNonNegativeNumber = (versionComponent): boolean => {
      const number = Number(versionComponent)
      return !isNaN(number) && number >= 0
    }
    return v.every(isNonNegativeNumber)
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

  /**
   * @param version A 128 byte buffer containing the 32 byte storage, major, minor, and patch
   * version numbers.
   */
  static fromGetVersionNumberReturnValue = (version: Buffer): ContractVersion => {
    if (version.length !== 4 * 32) {
      throw new Error(`Invalid version buffer: ${version.toString('hex')}`)
    }
    const versions = [
      version.toString('hex', 0, 32),  // Storage
      version.toString('hex', 32, 64), // Major
      version.toString('hex', 64, 96), // Minor
      version.toString('hex', 96, 128) // Patch
    ]
    return ContractVersion.fromString(versions.map((x) => parseInt(x, 16)).join('.'))
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

  public isVersionIncremented = () : boolean => {
    return (
      this.storage === Delta.Increment ||
      this.major === Delta.Increment ||
      this.minor === Delta.Increment||
      this.patch === Delta.Increment
    )
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
 * A version checker for a specific contract.
 */
export class ContractVersionChecker {
  constructor(public readonly oldVersion: ContractVersion, public readonly newVersion: ContractVersion, public readonly expectedDelta: ContractVersionDelta) {}

  public expectedVersion = (): ContractVersion => {
    if (this.oldVersion === null) {
      // Newly added contracts should have version 1.1.0.0
      return ContractVersion.fromString(DEFAULT_VERSION_STRING)
    } else {
      return this.expectedDelta.appliedTo(this.oldVersion)
    }
  }

  public matches = (): boolean => {
    return this.newVersion.toString() === this.expectedVersion().toString()
  }
}

/**
 * A mapping {contract name => {@link ContractVersionChecker}}.
 */
export interface ContractVersionCheckerIndex {
  [contract: string]: ContractVersionChecker
}

