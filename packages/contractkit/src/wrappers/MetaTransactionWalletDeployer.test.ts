import { Address } from '@celo/base'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import MTWContract from '@celo/protocol/build/contracts/MetaTransactionWallet.json'
import MTWDeployerContract from '@celo/protocol/build/contracts/MetaTransactionWalletDeployer.json'
import { EventLog, TransactionReceipt } from 'web3-core'
import { MetaTransactionWallet, newMetaTransactionWallet } from '../generated/MetaTransactionWallet'
import { newKitFromWeb3 } from '../kit'
import { MetaTransactionWalletDeployerWrapper } from './MetaTransactionWalletDeployer'

const contract = require('@truffle/contract')
const MetaTransactionWalletDeployer = contract(MTWDeployerContract)
const MetaTransactionWallet = contract(MTWContract)

testWithGanache('MetaTransactionWallet Wrapper', (web3) => {
  MetaTransactionWalletDeployer.setProvider(web3.currentProvider)
  MetaTransactionWallet.setProvider(web3.currentProvider)

  const deployImplementation = async (from: Address) => {
    const impl = await MetaTransactionWallet.new({ from })
    return impl.address
  }

  const deployWalletDeployer = async (
    from: Address,
    _allowedDeployers: Address[]
  ): Promise<Address> => {
    const instance = await MetaTransactionWalletDeployer.new({ from })
    await instance.initialize(_allowedDeployers, { from })
    return instance.address
  }

  const kit = newKitFromWeb3(web3)
  let accounts: Address[]
  let walletDeployerOwner: Address
  let walletDeployer: MetaTransactionWalletDeployerWrapper
  let allowedDeployers: Address[]
  let implementation: MetaTransactionWallet
  let rando: Address
  let beneficiary: Address

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    walletDeployerOwner = accounts[0]
    allowedDeployers = [accounts[1], accounts[2]]
    rando = accounts[3]
    kit.defaultAccount = walletDeployerOwner
    beneficiary = web3.utils.randomHex(20)
    implementation = newMetaTransactionWallet(web3, await deployImplementation(accounts[0]))
  })

  beforeEach(async () => {
    const walletDeployerAddress = await deployWalletDeployer(walletDeployerOwner, allowedDeployers)
    walletDeployer = await kit.contracts.getMetaTransactionWalletDeployer(walletDeployerAddress)
  })

  describe('#deploy', () => {
    describe('as the owner', () => {
      let result: TransactionReceipt
      let walletDeployedEvent: EventLog | undefined

      beforeEach(async () => {
        result = await walletDeployer
          .deploy(
            beneficiary,
            implementation.options.address,
            implementation.methods.initialize(beneficiary).encodeABI()
          )
          .sendAndWaitForReceipt()

        walletDeployedEvent = result.events?.WalletDeployed
      })

      it('deploys a new contract', async () => {
        expect(walletDeployedEvent).toBeDefined()
        const values: { owner: string; implementation: string } = walletDeployedEvent?.returnValues
        expect(values.owner.toLocaleLowerCase()).toEqual(beneficiary)
        expect(values.implementation).toEqual(implementation.options.address)
      })

      it('sets the beneficiary as the signer to the wallet', async () => {
        const wallet = newMetaTransactionWallet(web3, walletDeployedEvent?.returnValues.wallet)
        const signer = await wallet.methods.signer().call()
        expect(signer.toLocaleLowerCase()).toEqual(beneficiary)
      })
    })

    describe('as an allowed deployer', () => {
      let result: TransactionReceipt
      let walletDeployedEvent: EventLog | undefined

      beforeEach(async () => {
        result = await walletDeployer
          .deploy(
            beneficiary,
            implementation.options.address,
            implementation.methods.initialize(beneficiary).encodeABI()
          )
          .sendAndWaitForReceipt({ from: allowedDeployers[0] })

        walletDeployedEvent = result.events?.WalletDeployed
      })

      it('deploys a new contract', async () => {
        expect(walletDeployedEvent).toBeDefined()
        const values: { owner: string; implementation: string } = walletDeployedEvent?.returnValues
        expect(values.owner.toLocaleLowerCase()).toEqual(beneficiary)
        expect(values.implementation).toEqual(implementation.options.address)
      })

      it('sets the beneficiary as the signer to the wallet', async () => {
        const wallet = newMetaTransactionWallet(web3, walletDeployedEvent?.returnValues.wallet)
        const signer = await wallet.methods.signer().call()
        expect(signer.toLocaleLowerCase()).toEqual(beneficiary)
      })
    })

    describe('as a rando', () => {
      it('reverts', async () => {
        await expect(
          walletDeployer
            .deploy(
              beneficiary,
              implementation.options.address,
              implementation.methods.initialize(beneficiary).encodeABI()
            )
            .sendAndWaitForReceipt({ from: rando })
        ).rejects.toThrow(/not-allowed/)
      })
    })
  })

  describe('#getWallet', () => {
    describe('when a wallet was not deployed', () => {
      it('is 0x0000000000000000000000000000000000000000', async () => {
        const walletAddress = await walletDeployer.getWallet(beneficiary)
        expect(walletAddress).toEqual('0x0000000000000000000000000000000000000000')
      })
    })

    describe('when a wallet was deployed', () => {
      let walletAddressFromEvent: string
      beforeEach(async () => {
        const result = await walletDeployer
          .deploy(
            beneficiary,
            implementation.options.address,
            implementation.methods.initialize(beneficiary).encodeABI()
          )
          .sendAndWaitForReceipt()

        walletAddressFromEvent = result.events?.WalletDeployed.returnValues.wallet
      })

      it('is set to the same value as the event', async () => {
        const walletAddress = await walletDeployer.getWallet(beneficiary)
        expect(walletAddress).toEqual(walletAddressFromEvent)
      })
    })
  })

  describe('#changeDeployerAllowance', () => {
    describe('as a rando', () => {
      it('reverts', async () => {
        await expect(
          walletDeployer.changeDeployerAllowance(rando, true).sendAndWaitForReceipt({ from: rando })
        ).rejects.toThrow(/Ownable: caller is not the owner/)
      })
    })

    describe('as the owner', () => {
      let result: TransactionReceipt
      beforeEach(async () => {
        result = await walletDeployer.changeDeployerAllowance(rando, true).sendAndWaitForReceipt()
      })

      it('emits an event', async () => {
        expect(result.events?.DeployerStatusGranted).toBeDefined()
        const addr = result.events?.DeployerStatusGranted.returnValues.addr
        expect(addr).toEqual(rando)
      })

      it('markes the new address as allowed', async () => {
        expect(await walletDeployer.canDeploy(rando)).toBe(true)
      })
    })
  })
})
