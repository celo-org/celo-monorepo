module.exports = (deployer: any) => {
  const Migrations = artifacts.require('./Migrations.sol')
  deployer.deploy(Migrations)
}
