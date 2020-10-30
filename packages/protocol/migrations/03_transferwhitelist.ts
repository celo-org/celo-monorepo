import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { RegistryInstance, TransferWhitelistInstance } from 'types'

const name = CeloContractName.TransferWhitelist
const Contract = artifacts.require(name)

module.exports = (deployer: any) => {
  deployer.deploy(Contract, config.registry.predeployedProxyAddress)
  deployer.then(async () => {
    const contract: TransferWhitelistInstance = await Contract.deployed()
    await contract.setDirectlyWhitelistedAddresses(config.transferWhitelist.addresses)
    await contract.setWhitelistedContractIdentifiers(config.transferWhitelist.registryIds)
    const registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
    await registry.setAddressFor(name, contract.address)
  })
}
