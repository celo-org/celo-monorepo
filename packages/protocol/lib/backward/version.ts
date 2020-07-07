// tslint:disable: max-classes-per-file
const V_STORAGE = 's'
const V_MAJOR = 'x'
const V_MINOR = 'y'
const V_PATCH = 'z'

const applyDelta = (n: number, d: string, c: string): number => {
  if (d === "0") {
    return 0
  }
  if (d === (c + "+1")) {
    return (n + 1)
  }
  if (d === (c)) {
    return n
  }
  throw new Error(`Invalid delta singular format: ${d} for character ${c}`)
}

export class ContractVersion {
  storage: number
  major: number
  minor: number
  patch: number
  
  constructor(storage: number, major: number, minor: number, patch: number) {
    this.storage = storage
    this.major = major
    this.minor = minor
    this.patch = patch
  }
  
  with = (delta: ContractVersionDelta): ContractVersion => {
    return new ContractVersion(
      applyDelta(this.storage, delta.storage, V_STORAGE),
      applyDelta(this.major, delta.major, V_MAJOR),
      applyDelta(this.minor, delta.minor, V_MINOR),
      applyDelta(this.patch, delta.patch, V_PATCH)
      )
  }

  public toString = () : string => {
    return `${this.storage}.${this.major}.${this.minor}.${this.patch}`;
  }
}

export class ContractVersionDelta {
  storage: string
  major: string
  minor: string
  patch: string
  
  constructor(storage: string, major: string, minor: string, patch: string) {
    this.storage = storage
    this.major = major
    this.minor = minor
    this.patch = patch
  }

  public toString = () : string => {
    return `${this.storage}.${this.major}.${this.minor}.${this.patch}`;
  }
}

export const isValidVersion = (version: string): boolean => {
  const v = version.split(".")
  if (v.length !== 4) {
    return false
  }
  const isNumber = (versionDigit) => !isNaN(Number(versionDigit))
  return v.every(isNumber)
}

export const versionfromString = (version: string): ContractVersion => {
  if (!isValidVersion(version)) {
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

export const deltaFromChanges = (
  storageChanged: boolean,
  majorChanged: boolean,
  minorChanged: boolean,
  patchChanged: boolean): ContractVersionDelta => {
  const _ = '0'
  if (storageChanged) {
    return new ContractVersionDelta(`${V_STORAGE}+1`, _, _, _) 
  }
  if (majorChanged) {
    return new ContractVersionDelta(`${V_STORAGE}`, `${V_MAJOR}+1`, _, _)
  }
  if (minorChanged) {
    return new ContractVersionDelta(`${V_STORAGE}`, `${V_MAJOR}`, `${V_MINOR}+1`, _)
  }
  if (patchChanged) {
    return new ContractVersionDelta(`${V_STORAGE}`, `${V_MAJOR}`, `${V_MINOR}`, `${V_PATCH}+1`)
  }
  return new ContractVersionDelta(`${V_STORAGE}`, `${V_MAJOR}`, `${V_MINOR}`, `${V_PATCH}`)
}


