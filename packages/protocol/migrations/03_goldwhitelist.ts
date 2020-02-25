module.exports = (deployer: any) => {
  const name = 'GoldWhitelist'
  const Contract: any = artifacts.require(name)
  console.info('Deploying' + name)
  deployer.deploy(Contract)
}
