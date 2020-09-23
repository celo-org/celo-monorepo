import { assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
import {
  MetaTransactionWalletContract,
  MetaTransactionWalletDeployerContract,
  MetaTransactionWalletDeployerInstance,
  MetaTransactionWalletInstance,
} from 'types'

const MetaTransactionWalletDeployer: MetaTransactionWalletDeployerContract = artifacts.require(
  'MetaTransactionWalletDeployer'
)

const MetaTransactionWallet: MetaTransactionWalletContract = artifacts.require(
  'MetaTransactionWallet'
)

contract('MetaTransactionWalletDeployer', (accounts: string[]) => {
  let deployer: MetaTransactionWalletDeployerInstance
  let initializeRes
  const deployerOwner = accounts[0]
  const allowedDeployer = accounts[1]
  const otherAllowedDeployer = accounts[2]
  const valoraAccount = accounts[3]
  const maliciousDeployer = accounts[4]

  beforeEach(async () => {
    deployer = await MetaTransactionWalletDeployer.new()
    initializeRes = await deployer.initialize([allowedDeployer])
  })

  describe('#initialize()', () => {
    it('should have set the owner to itself', async () => {
      assert.equal(await deployer.owner(), deployerOwner)
    })

    it('should have allowed the allowed deployer', async () => {
      assert.equal(await deployer.canDeploy(allowedDeployer), true)
    })

    it('should emit the DeployerStatusGranted event', async () => {
      assertLogMatches2(initializeRes.logs[1], {
        event: 'DeployerStatusGranted',
        args: {
          addr: allowedDeployer,
        },
      })
    })
  })

  describe('#changeDeployerAllowance', async () => {
    let changeAllowanceRes
    describe('when permission is revoked', async () => {
      beforeEach(async () => {
        changeAllowanceRes = await deployer.changeDeployerAllowance(allowedDeployer, false)
      })

      it('should have removed the allowance and emit an event', async () => {
        assert.equal(await deployer.canDeploy(allowedDeployer), false)
        assertLogMatches2(changeAllowanceRes.logs[0], {
          event: 'DeployerStatusRevoked',
          args: {
            addr: allowedDeployer,
          },
        })
      })
    })

    describe('when permission is granted', async () => {
      beforeEach(async () => {
        changeAllowanceRes = await deployer.changeDeployerAllowance(otherAllowedDeployer, true)
      })

      it('should have added the allownace and emit an event', async () => {
        assert.equal(await deployer.canDeploy(otherAllowedDeployer), true)
        assertLogMatches2(changeAllowanceRes.logs[0], {
          event: 'DeployerStatusGranted',
          args: {
            addr: otherAllowedDeployer,
          },
        })
      })
    })
  })

  describe('#deploy', async () => {
    let implementation: MetaTransactionWalletInstance
    let deployRes
    let walletDeployedEvent

    before(async () => {
      implementation = await MetaTransactionWallet.new()
    })

    describe('executed by the owner', async () => {
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
        assert.equal(await deployer.wallets(valoraAccount), walletDeployedEvent.args.wallet)
      })

      it('initializes the wallet with the correct signer', async () => {
        const wallet = await MetaTransactionWallet.at(walletDeployedEvent.args.wallet)
        assert.equal(await wallet.signer(), valoraAccount)
      })
    })

    describe('executed by an allowed deployer', async () => {
      beforeEach(async () => {
        deployRes = await deployer.deploy(
          valoraAccount,
          implementation.address,
          // @ts-ignore
          implementation.contract.methods.initialize(valoraAccount).encodeABI(),
          {
            from: allowedDeployer,
          }
        )
        walletDeployedEvent = deployRes.logs.find((log) => log.event === 'WalletDeployed')
      })

      it('deploys a wallet', async () => {
        assert.exists(walletDeployedEvent)
        assert.equal(walletDeployedEvent.args.owner, valoraAccount)
        assert.equal(walletDeployedEvent.args.implementation, implementation.address)
        assert.equal(await deployer.wallets(valoraAccount), walletDeployedEvent.args.wallet)
      })

      it('initializes the wallet with the correct signer', async () => {
        const wallet = await MetaTransactionWallet.at(walletDeployedEvent.args.wallet)
        assert.equal(await wallet.signer(), valoraAccount)
      })
    })

    describe('executed by a malicious deployer', async () => {
      it('is caught by the guard', async () => {
        await assertRevert(
          deployer.deploy(
            valoraAccount,
            implementation.address,
            // @ts-ignore
            implementation.contract.methods.initialize(valoraAccount).encodeABI(),
            {
              from: maliciousDeployer,
            }
          ),
          'not-allowed'
        )
      })
    })

    describe('when the external account already owns a wallet', async () => {
      beforeEach(async () => {
        deployRes = await deployer.deploy(
          valoraAccount,
          implementation.address,
          // @ts-ignore
          implementation.contract.methods.initialize(valoraAccount).encodeABI()
        )
      })

      it('does not redeploy', async () => {
        await assertRevert(
          deployer.deploy(
            valoraAccount,
            implementation.address,
            // @ts-ignore
            implementation.contract.methods.initialize(valoraAccount).encodeABI()
          ),
          'wallet-already-deployed'
        )
      })
    })
  })
})
