import { Address, normalizeAddress } from '@celo/base'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import MTWContract from '@celo/protocol/build/contracts/MetaTransactionWallet.json'
import MTWDeployerContract from '@celo/protocol/build/contracts/MetaTransactionWalletDeployer.json'
import { EventLog, TransactionReceipt } from 'web3-core'
import { MetaTransactionWallet, newMetaTransactionWallet } from '../generated/MetaTransactionWallet'
import { newProxy } from '../generated/Proxy'
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

  const deployWalletDeployer = async (from: Address): Promise<Address> => {
    const instance = await MetaTransactionWalletDeployer.new({ from })
    return instance.address
  }

  const kit = newKitFromWeb3(web3)
  let accounts: Address[]
  let walletDeployerOwner: Address
  let walletDeployer: MetaTransactionWalletDeployerWrapper
  let implementation: MetaTransactionWallet
  let rando: Address
  let beneficiary: Address

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    walletDeployerOwner = accounts[0]
    rando = accounts[1]
    kit.defaultAccount = walletDeployerOwner
    beneficiary = web3.utils.randomHex(20)
    implementation = newMetaTransactionWallet(web3, await deployImplementation(accounts[0]))
  })

  beforeEach(async () => {
    const walletDeployerAddress = await deployWalletDeployer(walletDeployerOwner)
    walletDeployer = await kit.contracts.getMetaTransactionWalletDeployer(walletDeployerAddress)
  })

  describe('#deploy', () => {
    let result: TransactionReceipt
    let walletDeployedEvent: EventLog | undefined

    beforeEach(async () => {
      result = await walletDeployer
        .deploy(
          beneficiary,
          implementation.options.address,
          implementation.methods.initialize(beneficiary).encodeABI()
        )
        .sendAndWaitForReceipt({
          from: rando,
        })

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

    it('sets the right implementation', async () => {
      const proxy = newProxy(web3, walletDeployedEvent?.returnValues.wallet)
      const impl = await proxy.methods._getImplementation().call()
      expect(normalizeAddress(impl)).toEqual(normalizeAddress(implementation.options.address))
    })
  })
})
