import { networks } from '../truffle-config.js'

module.exports = async (deployer: any, network: any) => {
  const Migrations = artifacts.require('./Migrations.sol')
  deployer.deploy(Migrations)
  //  look for the migration that has the same ID and set that in the artifact

  //   const networkId = await web3.eth.net.getId()

  //   const network_id=  Object.keys(networks).filter((key) => {
  //     return networks[key].network_id === networkId
  //  } )

  // console.log( networks)
  // console.log('network ID is', await web3.eth.net.getId())
  // console.log('network key is ', network_id)
  // console.log('network key is ', network)
  const currentNetwork = networks[network]
  // tslint:disable-next-line
  console.log('Current network is', JSON.stringify(currentNetwork))
}
