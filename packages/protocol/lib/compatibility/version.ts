// tslint:disable: max-classes-per-file

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
