import { Address, ensureLeading0x } from '@celo/base'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import MTWContract from '@celo/protocol/build/contracts/MetaTransactionWallet.json'
import { generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import BigNumber from 'bignumber.js'
import { newKitFromWeb3 } from '../kit'
import { GoldTokenWrapper } from './GoldTokenWrapper'
import { buildMetaTxTypedData, MetaTransactionWalletWrapper } from './MetaTransactionWallet'

const contract = require('@truffle/contract')
const MetaTransactionWallet = contract(MTWContract)

testWithGanache('MetaTransactionWallet Wrapper', (web3) => {
  MetaTransactionWallet.setProvider(web3.currentProvider)
  // const walletProxy = new web3.eth.Contract(MTWContract.abi as any)
  const deployWallet = async (deployer: Address, signer: Address): Promise<Address> => {
    const instance = await MetaTransactionWallet.new({ from: deployer })
    await instance.initialize(signer, { from: deployer })
    return instance.address
  }

  const kit = newKitFromWeb3(web3)
  let accounts: Address[]
  let walletSigner: Address
  let wallet: MetaTransactionWalletWrapper
  let gold: GoldTokenWrapper
  let emptyAccounts: Address[]
  let rando: Address

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    walletSigner = accounts[0]
    rando = accounts[1]
    gold = await kit.contracts.getGoldToken()
  })

  beforeEach(async () => {
    const walletAddress = await deployWallet(accounts[0], walletSigner)
    wallet = await kit.contracts.getMetaTransactionWallet(walletAddress)
    // Ganache returns 1 in chainId assembly code
    wallet._getChainId = () => Promise.resolve(1)

    await gold
      .transfer(wallet.address, '0x' + new BigNumber(1e18).times(100).toString(16))
      .sendAndWaitForReceipt({
        from: accounts[0],
      })

    emptyAccounts = [0, 0, 0, 0, 0].map(() => web3.utils.randomHex(20))
  })

  describe('#executeTransaction', () => {
    describe('as a rando', () => {
      it('reverts', async () => {
        expect.assertions(1)
        await expect(
          wallet
            .executeTransaction({
              destination: emptyAccounts[0],
              value: 10000,
            })
            .sendAndWaitForReceipt({ from: rando })
        ).rejects.toThrow(/Invalid transaction sender/)
      })
    })

    describe('as the signer', () => {
      it('can transfer funds', async () => {
        const receiverBalanceBefore = new BigNumber(await web3.eth.getBalance(emptyAccounts[0]))
        const walletBalanceBefore = new BigNumber(await web3.eth.getBalance(wallet.address))
        const value = new BigNumber(1e18)
        const result = await wallet
          .executeTransaction({
            destination: emptyAccounts[0],
            value,
          })
          .sendAndWaitForReceipt()
        expect(result.status).toBe(true)

        const receiverBalanceAfter = new BigNumber(await web3.eth.getBalance(emptyAccounts[0]))
        const walletBalanceAfter = new BigNumber(await web3.eth.getBalance(wallet.address))

        expect(receiverBalanceAfter).toEqual(receiverBalanceBefore.plus(value))
        expect(walletBalanceAfter).toEqual(walletBalanceBefore.minus(value))
      })

      it('can call contracts', async () => {
        const value = new BigNumber(1e18)
        const result = await wallet
          .executeTransaction({
            destination: gold.address,
            data: gold.contract.methods
              .transfer(emptyAccounts[0], '0x' + value.toString(16))
              .encodeABI(),
          })
          .sendAndWaitForReceipt()
        expect(result.status).toBe(true)
        expect(await gold.balanceOf(emptyAccounts[0])).toEqual(value)
      })
    })
  })

  describe('#executeTransactions', () => {
    describe('as a rando', () => {
      it('reverts', async () => {
        expect.assertions(1)
        await expect(
          wallet
            .executeTransactions([
              {
                destination: emptyAccounts[0],
                value: 10000,
              },
              {
                destination: emptyAccounts[1],
                value: 10000,
              },
            ])
            .sendAndWaitForReceipt({ from: rando })
        ).rejects.toThrow(/Invalid transaction sender/)
      })
    })

    describe('as the signer', () => {
      it('can transfer funds', async () => {
        const receiver1BalanceBefore = new BigNumber(await web3.eth.getBalance(emptyAccounts[0]))
        const receiver2BalanceBefore = new BigNumber(await web3.eth.getBalance(emptyAccounts[1]))
        const walletBalanceBefore = new BigNumber(await web3.eth.getBalance(wallet.address))
        const value = new BigNumber(1e18)
        const result = await wallet
          .executeTransactions([
            {
              destination: emptyAccounts[0],
              value,
            },
            {
              destination: emptyAccounts[1],
              value,
            },
          ])
          .sendAndWaitForReceipt()
        expect(result.status).toBe(true)

        const receiver1BalanceAfter = new BigNumber(await web3.eth.getBalance(emptyAccounts[0]))
        const receiver2BalanceAfter = new BigNumber(await web3.eth.getBalance(emptyAccounts[1]))
        const walletBalanceAfter = new BigNumber(await web3.eth.getBalance(wallet.address))

        expect(receiver1BalanceAfter).toEqual(receiver1BalanceBefore.plus(value))
        expect(receiver2BalanceAfter).toEqual(receiver2BalanceBefore.plus(value))
        expect(walletBalanceAfter).toEqual(walletBalanceBefore.minus(value.times(2)))
      })

      it('can call contracts', async () => {
        const value = new BigNumber(1e8)
        const result = await wallet
          .executeTransactions([
            {
              destination: gold.address,
              data: gold.contract.methods.transfer(emptyAccounts[0], value.toFixed()).encodeABI(),
            },
            {
              destination: gold.address,
              data: gold.contract.methods.transfer(emptyAccounts[1], value.toFixed()).encodeABI(),
            },
          ])
          .sendAndWaitForReceipt()
        expect(result.status).toBe(true)

        expect(await gold.balanceOf(emptyAccounts[0])).toEqual(value)
        expect(await gold.balanceOf(emptyAccounts[1])).toEqual(value)
      })
    })
  })

  describe('#getMetaTransactionDigest', () => {
    it('should match the digest created off-chain', async () => {
      const metaTransfer = {
        destination: emptyAccounts[0],
        value: new BigNumber(1e10),
        nonce: 0,
      }
      const digest = await wallet.getMetaTransactionDigest(metaTransfer)
      const chainId = await wallet._getChainId()
      expect(digest).toEqual(
        ensureLeading0x(
          generateTypedDataHash(
            buildMetaTxTypedData(wallet.address, metaTransfer, chainId)
          ).toString('hex')
        )
      )
    })
  })

  describe('#getMetaTransactionSigner', () => {
    it('should match what is signed off-chain', async () => {
      const metaTransfer = await wallet.signMetaTransaction(walletSigner, {
        destination: emptyAccounts[0],
        value: new BigNumber(1e10),
      })
      const signer = await wallet.getMetaTransactionSigner(metaTransfer)
      expect(signer).toEqual(walletSigner)
    })
  })

  describe('#executeMetaTransaction', () => {
    describe('as a rando', () => {
      it('can transfer funds', async () => {
        const walletBalanceBefore = await gold.balanceOf(wallet.address)
        const value = new BigNumber(1e18)

        const metaTransfer = await wallet.signMetaTransaction(walletSigner, {
          destination: emptyAccounts[0],
          value,
        })

        const result = await wallet
          .executeMetaTransaction(metaTransfer)
          .sendAndWaitForReceipt({ from: rando })
        expect(result.status).toBe(true)

        expect(await gold.balanceOf(emptyAccounts[0])).toEqual(value)
        expect(await gold.balanceOf(wallet.address)).toEqual(walletBalanceBefore.minus(value))
      })

      it('can call contracts', async () => {
        const walletBalanceBefore = await gold.balanceOf(wallet.address)
        const value = new BigNumber(1e18)

        const metaTransfer = await wallet.signMetaTransaction(walletSigner, {
          destination: gold.address,
          value: 0,
          data: gold.contract.methods.transfer(emptyAccounts[0], value.toFixed()).encodeABI(),
        })

        const result = await wallet
          .executeMetaTransaction(metaTransfer)
          .sendAndWaitForReceipt({ from: rando })
        expect(result.status).toBe(true)

        expect(await gold.balanceOf(emptyAccounts[0])).toEqual(value)
        expect(await gold.balanceOf(wallet.address)).toEqual(walletBalanceBefore.minus(value))
      })

      it('can batch transactions as a call to self', async () => {
        const walletBalanceBefore = await gold.balanceOf(wallet.address)
        const value = new BigNumber(1e18)

        const metaBatch = await wallet.signMetaTransaction(
          walletSigner,
          wallet.buildExecuteTransactionsWrapperTx([
            {
              destination: emptyAccounts[0],
              value,
            },
            {
              destination: gold.address,
              data: gold.contract.methods.transfer(emptyAccounts[1], value.toFixed()).encodeABI(),
            },
            {
              destination: gold.address,
              data: gold.contract.methods.transfer(emptyAccounts[2], value.toFixed()).encodeABI(),
            },
          ])
        )

        const result = await wallet
          .executeMetaTransaction(metaBatch)
          .sendAndWaitForReceipt({ from: rando })
        expect(result.status).toBe(true)

        expect(await gold.balanceOf(wallet.address)).toEqual(
          walletBalanceBefore.minus(value.times(3))
        )
        for (let i = 0; i < 3; i++) {
          expect(await gold.balanceOf(emptyAccounts[i])).toEqual(value)
        }
      })
    })
  })
})
