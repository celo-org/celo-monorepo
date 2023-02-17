const semverGte = require('semver/functions/gte')

/** @internal */
export class ContractVersion {
  constructor(
    public readonly storage: number | string,
    public readonly major: number | string,
    public readonly minor: number | string,
    public readonly patch: number | string
  ) {}
  private toSemver = () => `${this.storage}.${this.major}.${this.minor}`
  isAtLeast = (other: ContractVersion) => semverGte(this.toSemver(), other.toSemver())
  toString = () => this.toSemver().concat(`.${this.patch}`)
  toRaw = () => [this.storage, this.major, this.minor, this.patch]
  static fromRaw = (raw: ReturnType<ContractVersion['toRaw']>) =>
    new ContractVersion(raw[0], raw[1], raw[2], raw[3])
}

/** @internal */
export const newContractVersion = (storage: number, major: number, minor: number, patch: number) =>
  new ContractVersion(storage, major, minor, patch)
