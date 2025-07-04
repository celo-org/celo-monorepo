import { build_directory, config } from '@celo/protocol/migrationsConfig'
import { RegistryInstance } from 'types'
import { setInitialProxyImplementation } from '../lib/web3-utils'

const Artifactor = require('@truffle/artifactor')

const name = 'Registry'
const Contract = artifacts.require(name)
const ContractProxy = artifacts.require(name + 'Proxy')

module.exports = (deployer: any, _networkName: string, _accounts: string[]) => {
  // eslint-disable-next-line: no-console
  console.info('Deploying Registry')
  deployer.deploy(ContractProxy)
  deployer.deploy(Contract, false)
  deployer.then(async () => {
    const networkId = await web3.eth.net.getId()
    // Hack to create build artifact.
    const artifact = ContractProxy._json
    artifact.networks[networkId] = {
      address: config.registry.predeployedProxyAddress,
      // @ts-ignore
      transactionHash: '0x',
    }
    const contractsDir = build_directory + '/contracts'
    const artifactor = new Artifactor(contractsDir)

    await artifactor.save(artifact)
    await setInitialProxyImplementation<RegistryInstance>(web3, artifacts, name)
  })
}
