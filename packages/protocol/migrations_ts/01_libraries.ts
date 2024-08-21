import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages';
import { ArtifactsSingleton } from '@celo/protocol/lib/artifactsSingleton';
import { makeTruffleContractForMigration } from '@celo/protocol/lib/web3-utils';
import { linkedLibraries } from '@celo/protocol/migrationsConfig';

module.exports = (deployer: any) => {
  Object.keys(linkedLibraries).forEach((lib: string) => {
    const artifacts08 = ArtifactsSingleton.getInstance(SOLIDITY_08_PACKAGE, artifacts);

    for (const contractName of SOLIDITY_08_PACKAGE.contracts) {
      makeTruffleContractForMigration(contractName, SOLIDITY_08_PACKAGE, web3);
    }

    const Library = artifacts08.require(lib, artifacts)
    deployer.deploy(Library)
    const Contracts = linkedLibraries[lib].map((contract: string) => artifacts08.require(contract, artifacts))
    deployer.link(Library, Contracts)
  })
}
