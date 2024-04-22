import { linkedLibraries } from '@celo/protocol/migrationsConfig'

export class ContractDependencies {
  dependencies: Map<string, string[]>
  constructor(libraries: { [library: string]: string[] }) {
    this.dependencies = new Map()
    Object.keys(libraries).forEach((lib: string) => {
      libraries[lib].forEach((contract: string) => {
        if (this.dependencies.has(contract)) {
          this.dependencies.get(contract)!.push(lib)
        } else {
          this.dependencies.set(contract, [lib])
        }
      })
    })
  }

  public get = (contract: string): string[] => {
    return this.dependencies.has(contract) ? this.dependencies.get(contract)! : []
  }
}

export const getCeloContractDependencies = () => {
    return new ContractDependencies(linkedLibraries)
}
