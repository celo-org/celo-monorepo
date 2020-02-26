import { config } from '@celo/protocol/migrationsConfig'
import { TransferWhitelistInstance } from 'types'

const name = 'TransferWhitelist'
const Contract = artifacts.require(name)

module.exports = (deployer: any) => {
  deployer.deploy(Contract)
  deployer.then(async () => {
    const contract: TransferWhitelistInstance = await Contract.deployed()
    await contract.setWhitelist(config.transferWhitelist.addresses)
    await contract.setRegisteredContracts(config.transferWhitelist.registryIds)
  })
}
