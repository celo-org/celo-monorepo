import {
  MetaTransactionWalletContract,
  MetaTransactionWalletDeployerContract,
  MetaTransactionWalletDeployerInstance,
  MetaTransactionWalletInstance,
  ProxyContract,
} from 'types'

const MetaTransactionWalletDeployer: MetaTransactionWalletDeployerContract = artifacts.require(
  'MetaTransactionWalletDeployer'
)

const MetaTransactionWallet: MetaTransactionWalletContract = artifacts.require(
  'MetaTransactionWallet'
)

const Proxy: ProxyContract = artifacts.require('Proxy')

contract('MetaTransactionWalletDeployer', (accounts: string[]) => {
  let deployer: MetaTransactionWalletDeployerInstance
  const deployerOwner = accounts[0]
  const valoraAccount = accounts[1]

  beforeEach(async () => {
    deployer = await MetaTransactionWalletDeployer.new()
    await deployer.initialize()
  })

  describe('#initialize()', () => {
    it('should have set the owner to itself', async () => {
      assert.equal(await deployer.owner(), deployerOwner)
    })
  })

  describe('#deploy', async () => {
    let implementation: MetaTransactionWalletInstance
    let deployRes
    let walletDeployedEvent

    before(async () => {
      implementation = await MetaTransactionWallet.new()
    })

    beforeEach(async () => {
      // @ts-ignore
      deployRes = await deployer.deploy(
        valoraAccount,
        implementation.address,
        // @ts-ignore
        implementation.contract.methods.initialize(valoraAccount).encodeABI()
      )
      walletDeployedEvent = deployRes.logs.find((log) => log.event === 'WalletDeployed')
    })

    it('deploys a wallet', async () => {
      assert.exists(walletDeployedEvent)
      assert.equal(walletDeployedEvent.args.owner, valoraAccount)
      assert.equal(walletDeployedEvent.args.implementation, implementation.address)
    })

    it('initializes the wallet with the correct signer', async () => {
      const wallet = await MetaTransactionWallet.at(walletDeployedEvent.args.wallet)
      assert.equal(await wallet.signer(), valoraAccount)
    })

    it('sets the the right proxy implementation', async () => {
      const proxy = await Proxy.at(walletDeployedEvent.args.wallet)
      assert.equal(await proxy._getImplementation(), implementation.address)
    })

    describe('when the external account already owns a wallet', async () => {
      beforeEach(async () => {
        await deployer.deploy(
          valoraAccount,
          implementation.address,
          // @ts-ignore
          implementation.contract.methods.initialize(valoraAccount).encodeABI()
        )
        deployRes = await deployer.deploy(
          valoraAccount,
          implementation.address,
          // @ts-ignore
          implementation.contract.methods.initialize(valoraAccount).encodeABI()
        )
        walletDeployedEvent = deployRes.logs.find((log) => log.event === 'WalletDeployed')
      })

      it('does redeploy', async () => {
        assert.exists(walletDeployedEvent)
        assert.equal(walletDeployedEvent.args.owner, valoraAccount)
        assert.equal(walletDeployedEvent.args.implementation, implementation.address)
      })
    })
  })
})
