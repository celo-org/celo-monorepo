import { Address, normalizeAddress } from '@celo/base'
import { CeloTxReceipt, EventLog } from '@celo/connect'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { CeloContract } from '../base'
import { MetaTransactionWallet, newMetaTransactionWallet } from '../generated/MetaTransactionWallet'
import { newProxy } from '../generated/Proxy'
import { newKitFromWeb3 } from '../kit'
import { assumeOwnership } from '../test-utils/transferownership'
import { MetaTransactionWalletDeployerWrapper } from './MetaTransactionWalletDeployer'

testWithGanache('MetaTransactionWalletDeployer Wrapper', (web3) => {
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

    await Promise.all([
      assumeOwnership(web3, walletDeployerOwner, CeloContract.MetaTransactionWalletDeployer),
      assumeOwnership(web3, walletDeployerOwner, CeloContract.MetaTransactionWallet),
    ])
    beneficiary = web3.utils.randomHex(20)
    // implementation = newMetaTransactionWallet(web3, await deployImplementation(accounts[0]))
  })

  beforeEach(async () => {
    const walletDeployerAddress = await kit.registry.addressFor(
      CeloContract.MetaTransactionWalletDeployer
    )
    walletDeployer = await kit.contracts.getMetaTransactionWalletDeployer(walletDeployerAddress)
  })

  describe('#deploy', () => {
    let result: CeloTxReceipt
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
