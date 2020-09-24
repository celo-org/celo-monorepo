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

  const deployWallet = async (deployer: Address, signer: Address): Promise<Address> => {
    const instance = await MetaTransactionWallet.new({ from: deployer })
    await instance.initialize(signer, { from: deployer })
    return instance.address
  }

  // Ganache returns 1 in chainId assembly code
  const chainId = 1
  const kit = newKitFromWeb3(web3)
  let accounts: Address[]
  let walletSigner: Address
  let wallet: MetaTransactionWalletWrapper
  let gold: GoldTokenWrapper
  let emptyAccounts: Address[]
  let rando: Address

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    walletSigner = accounts[0]
    kit.defaultAccount = walletSigner
    rando = accounts[1]
    gold = await kit.contracts.getGoldToken()
  })

  beforeEach(async () => {
    const walletAddress = await deployWallet(walletSigner, walletSigner)
    wallet = await kit.contracts.getMetaTransactionWallet(walletAddress)
    // Ganache returns 1 in chainId assembly code
    // @ts-ignore
    wallet.chainId = () => Promise.resolve(chainId)

    // Give the wallet some funds
    await gold.transfer(wallet.address, new BigNumber(20e18).toFixed()).sendAndWaitForReceipt()
    emptyAccounts = [0, 0, 0, 0, 0].map(() => web3.utils.randomHex(20))
  })

  describe('#executeTransaction', () => {
    describe('as a rando', () => {
      it('reverts', async () => {
        expect.assertions(1)
        await expect(
          wallet
            .executeTransaction({
              txo: gold.transfer(emptyAccounts[0], 10000).txo,
            })
            .sendAndWaitForReceipt({ from: rando })
        ).rejects.toThrow(/Invalid transaction sender/)
      })
    })

    describe('as the signer', () => {
      it('can call contracts', async () => {
        const value = new BigNumber(1e18)
        const result = await wallet
          .executeTransaction({
            txo: gold.transfer(emptyAccounts[0], value.toFixed()).txo,
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
                txo: gold.transfer(emptyAccounts[0], 1000).txo,
              },
              {
                txo: gold.transfer(emptyAccounts[1], 1000).txo,
              },
            ])
            .sendAndWaitForReceipt({ from: rando })
        ).rejects.toThrow(/Invalid transaction sender/)
      })
    })

    describe('as the signer', () => {
      it('can execute transactions', async () => {
        const walletBalanceBefore = await gold.balanceOf(wallet.address)
        const value = new BigNumber(1e18)
        const result = await wallet
          .executeTransactions([
            {
              txo: gold.transfer(emptyAccounts[0], value.toFixed()).txo,
            },
            {
              txo: gold.transfer(emptyAccounts[1], value.toFixed()).txo,
            },
          ])
          .sendAndWaitForReceipt()
        expect(result.status).toBe(true)

        expect(await gold.balanceOf(wallet.address)).toEqual(
          walletBalanceBefore.minus(value.times(2))
        )
        expect(await gold.balanceOf(emptyAccounts[0])).toEqual(value)
        expect(await gold.balanceOf(emptyAccounts[1])).toEqual(value)
      })
    })
  })

  describe('#getMetaTransactionDigest', () => {
    it('should match the digest created off-chain', async () => {
      const metaTransfer = {
        txo: gold.transfer(emptyAccounts[0], 1000).txo,
      }

      const onChainDigest = await wallet.getMetaTransactionDigest(metaTransfer, 0)
      const typedData = buildMetaTxTypedData(wallet.address, metaTransfer, 0, chainId)
      const offChainDigest = ensureLeading0x(generateTypedDataHash(typedData).toString('hex'))

      expect(onChainDigest).toEqual(offChainDigest)
    })
  })

  describe('#getMetaTransactionSigner', () => {
    it('should match what is signed off-chain', async () => {
      const metaTransfer = {
        txo: gold.transfer(emptyAccounts[0], 1000000).txo,
      }
      const signature = await wallet.signMetaTransaction(metaTransfer, 0)
      const signer = await wallet.getMetaTransactionSigner(metaTransfer, 0, signature)
      expect(signer).toEqual(walletSigner)
    })
  })

  describe('#executeMetaTransaction', () => {
    describe('as a rando', () => {
      it('can execute transactions', async () => {
        const walletBalanceBefore = await gold.balanceOf(wallet.address)
        const value = new BigNumber(1e18)

        const metaTransfer = {
          txo: gold.transfer(emptyAccounts[0], value.toFixed()).txo,
        }
        const signature = await wallet.signMetaTransaction(metaTransfer)

        const result = await wallet
          .executeMetaTransaction(metaTransfer, signature)
          .sendAndWaitForReceipt({ from: rando })
        expect(result.status).toBe(true)

        expect(await gold.balanceOf(emptyAccounts[0])).toEqual(value)
        expect(await gold.balanceOf(wallet.address)).toEqual(walletBalanceBefore.minus(value))
      })

      it('can batch transactions as a call to self', async () => {
        const walletBalanceBefore = await gold.balanceOf(wallet.address)
        const value = new BigNumber(1e18)
        const metaBatch = {
          txo: wallet.executeTransactions([
            {
              txo: gold.transfer(emptyAccounts[0], value.toFixed()).txo,
            },
            {
              txo: gold.transfer(emptyAccounts[1], value.toFixed()).txo,
            },
            {
              txo: gold.transfer(emptyAccounts[2], value.toFixed()).txo,
            },
          ]).txo,
        }

        const signature = await wallet.signMetaTransaction(metaBatch, 0)
        const result = await wallet
          .executeMetaTransaction(metaBatch, signature)
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

  describe('#signAndExecuteMetaTransaction', () => {
    describe('as a rando', () => {
      it('can execute transactions', async () => {
        const walletBalanceBefore = await gold.balanceOf(wallet.address)
        const value = new BigNumber(1e18)

        const metaTransfer = {
          txo: gold.transfer(emptyAccounts[0], value.toFixed()).txo,
        }

        const tx = await wallet.signAndExecuteMetaTransaction(metaTransfer)
        const result = await tx.sendAndWaitForReceipt({ from: rando })
        expect(result.status).toBe(true)

        expect(await gold.balanceOf(emptyAccounts[0])).toEqual(value)
        expect(await gold.balanceOf(wallet.address)).toEqual(walletBalanceBefore.minus(value))
      })

      it('can batch transactions as a call to self', async () => {
        const walletBalanceBefore = await gold.balanceOf(wallet.address)
        const value = new BigNumber(1e18)
        const metaBatch = {
          txo: wallet.executeTransactions([
            {
              txo: gold.transfer(emptyAccounts[0], value.toFixed()).txo,
            },
            {
              txo: gold.transfer(emptyAccounts[1], value.toFixed()).txo,
            },
            {
              txo: gold.transfer(emptyAccounts[2], value.toFixed()).txo,
            },
          ]).txo,
        }

        const tx = await wallet.signAndExecuteMetaTransaction(metaBatch)
        const result = await tx.sendAndWaitForReceipt({ from: rando })
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
