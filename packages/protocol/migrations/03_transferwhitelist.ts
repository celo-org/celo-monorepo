import { config } from '@celo/protocol/migrationsConfig'

module.exports = (deployer: any) => {
  const name = 'TransferWhitelist'
  const Contract: any = artifacts.require(name)
  console.info('Deploying' + name)
  deployer.deploy(Contract)
  deployer.then(async () => {
    await Contract.setWhitelist(config.transferWhitelist.addresses)
    await Contract.setRegisteredContracts(config.transferWhitelist.registryIds)
  })
}
