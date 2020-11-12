import { assertEqualBN, assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
import { Address, ensureLeading0x, trimLeading0x } from '@celo/utils/lib/address'
import { generateTypedDataHash, structHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils'
import {
  MetaTransactionWalletContract,
  MetaTransactionWalletInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
} from 'types'

const MetaTransactionWallet: MetaTransactionWalletContract = artifacts.require(
  'MetaTransactionWallet'
)

interface MetaTransaction {
  destination: Address
  value: number
  data: string
  nonce: number
}
// The value currently returned by the chainId assembly code in ganache.
const chainId = 1
const getTypedData = (walletAddress: Address, tx?: MetaTransaction) => {
  const typedData = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ExecuteMetaTransaction: [
        { name: 'destination', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    primaryType: 'ExecuteMetaTransaction',
    domain: {
      name: 'MetaTransactionWallet',
      version: '1.1',
      chainId,
      verifyingContract: walletAddress,
    },
    message: tx
      ? {
          destination: tx.destination,
          value: tx.value,
          data: tx.data,
          nonce: tx.nonce,
        }
      : {},
  }
  return typedData
}

const getDomainDigest = (walletAddress: Address) => {
  const typedData = getTypedData(walletAddress)
  return ensureLeading0x(
    structHash('EIP712Domain', typedData.domain, typedData.types).toString('hex')
  )
}

const constructMetaTransactionExecutionDigest = (walletAddress: Address, tx: MetaTransaction) => {
  const typedData = getTypedData(walletAddress, tx)
  return ensureLeading0x(generateTypedDataHash(typedData).toString('hex'))
}

const getSignatureForMetaTransaction = async (
  signer: Address,
  walletAddress: Address,
  tx: MetaTransaction
) => {
  const typedData = getTypedData(walletAddress, tx)

  const signature = await new Promise<string>((resolve, reject) => {
    web3.currentProvider.send(
      {
        method: 'eth_signTypedData',
        params: [signer, typedData],
      },
      (error, resp) => {
        if (error) {
          reject(error)
        } else {
          resolve(resp.result)
        }
      }
    )
  })

  const messageHash = constructMetaTransactionExecutionDigest(walletAddress, tx)
  const parsedSignature = parseSignatureWithoutPrefix(messageHash, signature, signer)
  return parsedSignature
}

contract('MetaTransactionWallet', (accounts: string[]) => {
  let wallet: MetaTransactionWalletInstance
  let initializeRes
  const signer = accounts[1]
  const nonSigner = accounts[2]

  const executeOnSelf = (data: string, value = 0) =>
    // @ts-ignore
    wallet.executeTransaction(wallet.address, value, data, { from: signer })

  beforeEach(async () => {
    wallet = await MetaTransactionWallet.new()
    initializeRes = await wallet.initialize(signer)
  })

  describe('#EIP712_EXECUTE_META_TRANSACTION_TYPEHASH()', () => {
    it('should have set the right typehash', async () => {
      const expectedTypehash = web3.utils.soliditySha3(
        'ExecuteMetaTransaction(address destination,uint256 value,bytes data,uint256 nonce)'
      )
      assert.equal(await wallet.EIP712_EXECUTE_META_TRANSACTION_TYPEHASH(), expectedTypehash)
    })
  })

  describe('#initialize()', () => {
    it('should have set the owner to itself', async () => {
      assert.equal(await wallet.owner(), wallet.address)
    })

    it('should have set the signer', async () => {
      assert.equal(await wallet.signer(), signer)
    })

    it('should have set the EIP-712 domain separator', async () => {
      assert.equal(await wallet.eip712DomainSeparator(), getDomainDigest(wallet.address))
    })

    it('should emit the SignerSet event', () => {
      assertLogMatches2(initializeRes.logs[1], {
        event: 'SignerSet',
        args: {
          signer,
        },
      })
    })

    it('should emit the EIP712DomainSeparatorSet event', () => {
      assertLogMatches2(initializeRes.logs[2], {
        event: 'EIP712DomainSeparatorSet',
        args: {
          eip712DomainSeparator: getDomainDigest(wallet.address),
        },
      })
    })

    it('should emit the OwnershipTransferred event', () => {
      assertLogMatches2(initializeRes.logs[3], {
        event: 'OwnershipTransferred',
        args: {
          previousOwner: accounts[0],
          newOwner: wallet.address,
        },
      })
    })

    it('should not be callable again', async () => {
      await assertRevert(wallet.initialize(signer))
    })
  })

  describe('fallback function', () => {
    describe('when receiving celo', () => {
      it('emits Deposit event with correct parameters', async () => {
        const value = 100
        // @ts-ignore
        const res = await wallet.send(value)
        assertLogMatches2(res.logs[0], {
          event: 'Deposit',
          args: {
            sender: accounts[0],
            value,
          },
        })
      })
    })

    describe('when receiving 0 value', () => {
      it('does not emit an event', async () => {
        // @ts-ignore
        const res = await wallet.send(0)
        assert.equal(res.logs, 0)
      })
    })
  })

  describe('#setSigner()', () => {
    const newSigner = accounts[3]

    describe('when called by the wallet contract', () => {
      let res
      beforeEach(async () => {
        // @ts-ignore
        const data = wallet.contract.methods.setSigner(newSigner).encodeABI()
        res = await executeOnSelf(data)
      })
      it('should set a new signer', async () => {
        assert.equal(await wallet.signer(), newSigner)
      })
      it('should emit the SignerSet event', async () => {
        assertLogMatches2(res.logs[0], {
          event: 'SignerSet',
          args: {
            signer: newSigner,
          },
        })
      })
    })

    describe('when called by the signer', () => {
      it('should revert', async () => {
        await assertRevert(wallet.setSigner(newSigner, { from: signer }))
      })
    })
  })

  describe('#executeTransaction()', () => {
    describe('when the destination is a contract', () => {
      let res: any
      let data: string
      let destination: string
      const value = 0
      beforeEach(async () => {
        destination = wallet.address
        // @ts-ignore
        data = wallet.contract.methods.setSigner(nonSigner).encodeABI()
      })

      describe('when the caller is the signer', () => {
        beforeEach(async () => {
          res = await wallet.executeTransaction(destination, value, data, { from: signer })
        })

        it('should execute the transaction', async () => {
          assert.equal(await wallet.signer(), nonSigner)
        })

        it('should not increment the nonce', async () => {
          assertEqualBN(await wallet.nonce(), 0)
        })

        it('should emit the TransactionExecution event', () => {
          assertLogMatches2(res.logs[1], {
            event: 'TransactionExecution',
            args: {
              destination,
              value,
              data,
              returnData: null,
            },
          })
        })
      })

      describe('when the caller is not the signer', () => {
        it('should revert', async () => {
          await assertRevert(
            wallet.executeTransaction(destination, value, data, { from: nonSigner })
          )
        })
      })
    })

    describe('when the destination is not a contract', () => {
      const value = 100
      const destination = web3.utils.toChecksumAddress(web3.utils.randomHex(20))
      describe('when the caller is the signer', () => {
        describe('when data is empty', () => {
          let res: any
          const data = '0x'
          beforeEach(async () => {
            await web3.eth.sendTransaction({ from: accounts[0], to: wallet.address, value })
            // @ts-ignore
            res = await wallet.executeTransaction(destination, value, data, { from: signer })
          })

          it('should execute the transaction', async () => {
            assert.equal(await web3.eth.getBalance(destination), value)
          })

          it('should not increment the nonce', async () => {
            assertEqualBN(await wallet.nonce(), 0)
          })

          it('should emit the TransactionExecution event', () => {
            assertLogMatches2(res.logs[0], {
              event: 'TransactionExecution',
              args: {
                destination,
                value,
                data: null,
                returnData: null,
              },
            })
          })
        })

        describe('when data is not empty', () => {
          it('should revert', async () => {
            await assertRevert(
              wallet.executeTransaction(destination, value, '0x1234', { from: signer })
            )
          })
        })
      })
    })
  })

  describe('#executeTransactions()', () => {
    describe('when the transactions are a mix of contract and non-contract calls', () => {
      const value = 100
      let transactions: any[]
      beforeEach(async () => {
        transactions = [
          // CELO transfer
          {
            destination: web3.utils.toChecksumAddress(web3.utils.randomHex(20)),
            value,
            data: '0x',
          },

          // No-op transfer ownership
          {
            destination: wallet.address,
            value: 0,
            // @ts-ignore
            data: wallet.contract.methods.transferOwnership(wallet.address).encodeABI(),
          },

          // CELO transfer
          {
            destination: web3.utils.toChecksumAddress(web3.utils.randomHex(20)),
            value,
            data: '0x',
          },

          // view signer (to test return values)
          {
            destination: wallet.address,
            value: 0,
            // @ts-ignore
            data: wallet.contract.methods.signer().encodeABI(),
          },

          // view isOwner (to test return values)
          {
            destination: wallet.address,
            value: 0,
            // @ts-ignore
            data: wallet.contract.methods.isOwner().encodeABI(),
          },

          // Change signer
          {
            destination: wallet.address,
            value: 0,
            // @ts-ignore
            data: wallet.contract.methods.setSigner(nonSigner).encodeABI(),
          },
        ]

        await web3.eth.sendTransaction({
          from: accounts[0],
          to: wallet.address,
          value: value * 2,
        })
      })

      describe('when the caller is the signer', () => {
        describe('when the transactions are executed directly', () => {
          describe('', () => {
            beforeEach(async () => {
              await wallet.executeTransactions(
                transactions.map((t) => t.destination),
                transactions.map((t) => t.value),
                ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
                transactions.map((t) => trimLeading0x(t.data).length / 2),
                { from: signer }
              )
            })

            it('should execute the transactions', async () => {
              assert.equal(await web3.eth.getBalance(transactions[0].destination), value)
              assert.equal(await web3.eth.getBalance(transactions[2].destination), value)
              assert.equal(await wallet.signer(), nonSigner)
            })

            it('should not increment the nonce', async () => {
              assertEqualBN(await wallet.nonce(), 0)
            })
          })

          it('returns the proper values', async () => {
            const boolTrueReturned: string = '01'
            const signerAddrReturned: string = trimLeading0x(signer).toLowerCase()
            const viewSignerTxIndex: number = 3
            const isOwnerTxIndex: number = 4

            const returnValues = await wallet.executeTransactions.call(
              transactions.map((t) => t.destination),
              transactions.map((t) => t.value),
              ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
              transactions.map((t) => trimLeading0x(t.data).length / 2),
              { from: signer }
            )

            assert.equal(
              returnValues[0],
              // return values are padded to have a length of 32 bytes
              `0x${signerAddrReturned.padStart(64, '0')}${boolTrueReturned.padStart(64, '0')}`
            )
            for (const i of returnValues[1].keys()) {
              if (i === viewSignerTxIndex || i === isOwnerTxIndex) {
                assert.equal(web3.utils.hexToNumber(returnValues[1][i]), 32)
              } else {
                assert.equal(web3.utils.hexToNumber(returnValues[1][i]), 0)
              }
            }
          })
        })

        describe('when the data parameter has extra bytes appended', () => {
          it('reverts', async () => {
            await assertRevert(
              wallet.executeTransactions(
                transactions.map((t) => t.destination),
                transactions.map((t) => t.value),
                ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('deadbeef')),
                transactions.map((t) => trimLeading0x(t.data).length / 2),
                { from: signer }
              )
            )
          })
        })

        describe('when dataLengths has erroneous lengths', () => {
          it('reverts', async () => {
            await assertRevert(
              wallet.executeTransactions(
                transactions.map((t) => t.destination),
                transactions.map((t) => t.value),
                ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('deadbeef')),
                transactions.map((t) => trimLeading0x(t.data).length), // invalid lengths without /2
                { from: signer }
              )
            )
          })
        })

        describe('when the transactions are executed as a meta-transaction', () => {
          beforeEach(async () => {
            // @ts-ignore
            const data = wallet.contract.methods
              .executeTransactions(
                transactions.map((t) => t.destination),
                transactions.map((t) => t.value),
                ensureLeading0x(transactions.map((t) => trimLeading0x(t.data)).join('')),
                transactions.map((t) => trimLeading0x(t.data).length / 2)
              )
              .encodeABI()
            const { v, r, s } = await getSignatureForMetaTransaction(signer, wallet.address, {
              destination: wallet.address,
              value: 0,
              data,
              nonce: 0,
            })
            await wallet.executeMetaTransaction(wallet.address, 0, data, v, r, s, {
              from: signer,
            })
          })

          it('should execute the transactions', async () => {
            assert.equal(await web3.eth.getBalance(transactions[0].destination), value)
            assert.equal(await web3.eth.getBalance(transactions[2].destination), value)
            assert.equal(await wallet.signer(), nonSigner)
          })

          it('should increment the nonce', async () => {
            assertEqualBN(await wallet.nonce(), 1)
          })
        })
      })
    })
  })

  describe('#getMetaTransactionDigest', () => {
    it('creates the digest as expected', async () => {
      const value = 100
      const destination = web3.utils.toChecksumAddress(web3.utils.randomHex(20))
      const data = '0x'
      const nonce = 0

      const digest = constructMetaTransactionExecutionDigest(wallet.address, {
        value,
        destination,
        data,
        nonce,
      })

      assert.equal(await wallet.getMetaTransactionDigest(destination, value, data, nonce), digest)
    })
  })

  describe('#executeMetaTransaction()', () => {
    const value = 100
    const destination = web3.utils.toChecksumAddress(web3.utils.randomHex(20))
    const data = '0x'
    let submitter
    let nonce
    let transferSigner

    const doTransfer = async () => {
      const { v, r, s } = await getSignatureForMetaTransaction(transferSigner, wallet.address, {
        value,
        destination,
        data,
        nonce,
      })

      return wallet.executeMetaTransaction(destination, value, data, v, r, s, {
        from: submitter,
      })
    }

    beforeEach(async () => {
      // Transfer some funds to the wallet
      await web3.eth.sendTransaction({ from: accounts[0], to: wallet.address, value })
    })

    describe('when submitted by a non-signer', () => {
      beforeEach(() => {
        submitter = nonSigner
      })

      describe('when the nonce is valid', () => {
        beforeEach(() => {
          nonce = 0
        })

        let res: any
        describe('when signed by the signer', () => {
          beforeEach(async () => {
            transferSigner = signer
            res = await doTransfer()
          })

          it('should execute the transaction', async () => {
            assert.equal(await web3.eth.getBalance(destination), value)
          })

          it('should increment the nonce', async () => {
            assertEqualBN(await wallet.nonce(), 1)
          })

          it('should emit the MetaTransactionExecution event', () => {
            assertLogMatches2(res.logs[0], {
              event: 'MetaTransactionExecution',
              args: {
                destination,
                value,
                data: null,
                nonce: 0,
                returnData: null,
              },
            })
          })
        })

        describe('when signed by a non-signer', () => {
          it('should revert', async () => {
            transferSigner = nonSigner
            await assertRevert(doTransfer())
          })
        })
      })

      describe('when the nonce is invalid', () => {
        beforeEach(() => {
          nonce = 1
        })
        describe('when signed by the signer', () => {
          beforeEach(() => {
            transferSigner = signer
          })
          it('should revert', async () => {
            await assertRevert(doTransfer())
          })
        })
      })
    })
  })

  describe('#transferERC20ToSigner', () => {
    const value = 100
    let mockStableToken: MockStableTokenInstance
    beforeEach(async () => {
      const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
      mockStableToken = await MockStableToken.new()
      await mockStableToken.mint(wallet.address, value)
      assertEqualBN(await mockStableToken.balanceOf(wallet.address), value)
      assertEqualBN(await mockStableToken.balanceOf(signer), 0)
    })

    it('transfers all cUSD to the signer', async () => {
      await wallet.transferERC20ToSigner(mockStableToken.address)
      assertEqualBN(await mockStableToken.balanceOf(wallet.address), 0)
      assertEqualBN(await mockStableToken.balanceOf(signer), value)
    })
  })
})
