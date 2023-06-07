module.exports = async (deployer: any) => {
  const Migrations = artifacts.require('./Migrations.sol')
  deployer.deploy(Migrations)
  console.log('network ID is', await web3.eth.net.getId())
}
