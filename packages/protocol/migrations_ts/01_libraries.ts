import { linkedLibraries } from '@celo/protocol/migrationsConfig'

module.exports = (deployer: any) => {
  Object.keys(linkedLibraries).forEach((lib: string) => {
    const Library = artifacts.require(lib)
    deployer.deploy(Library)
    const Contracts = linkedLibraries[lib].map((contract: string) => artifacts.require(contract))
    deployer.link(Library, Contracts)
  })
}
