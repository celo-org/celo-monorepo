/* tslint:disable no-console */
import { ArtifactsSingleton } from '../lib/artifactsSingleton'
import { networks } from '../truffle-config.js'

module.exports = async (deployer: any, network: any) => {
  const Migrations = artifacts.require('./Migrations.sol')
  deployer.deploy(Migrations)

  const currentNetwork = { ...networks[network], name: network }

  console.log('Current network is', JSON.stringify(currentNetwork))
  // Instad of setting this in a singleton, it could have been set in every migration
  // but it would have required quite a lot of refactoring
  ArtifactsSingleton.setNetwork(currentNetwork)
}
