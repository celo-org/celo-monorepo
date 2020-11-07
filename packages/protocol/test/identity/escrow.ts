import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertRevert, NULL_ADDRESS, timeTravel } from '@celo/protocol/lib/test-utils'
import {
  EscrowContract,
  EscrowInstance,
  MockAttestationsContract,
  MockAttestationsInstance,
  MockERC20TokenContract,
  MockERC20TokenInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'
import { getParsedSignatureOfAddress } from '../../lib/signing-utils'

// For reference:
//    accounts[0] = owner
//    accounts[1] = sender
//    accounts[2] = receiver
//    accounts[3] = registry
//    accounts[4] = a random other account
//    accounts[5] = withdrawKeyAddress (temporary wallet address, no attestations)
//    accounts[6] = anotherWithdrawKeyAddress (a different temporary wallet address, requires attestations)

const Escrow: EscrowContract = artifacts.require('Escrow')
const MockERC20Token: MockERC20TokenContract = artifacts.require('MockERC20Token')
const Registry: RegistryContract = artifacts.require('Registry')
const MockAttestations: MockAttestationsContract = artifacts.require('MockAttestations')

interface EscrowedPayment {
  recipientPhoneHash: string
  sender: string
  token: string
  value: number
  sentIndex: number
  receivedIndex: number
  timestamp: number
  expirySeconds: number
  minAttestations: number
}

const getEscrowedPayment = async (
  paymentID: string,
  escrow: EscrowInstance
): Promise<EscrowedPayment> => {
  const payment = await escrow.escrowedPayments(paymentID)
  return {
    recipientPhoneHash: payment[0],
    sender: payment[1],
    token: payment[2],
    value: payment[3].toNumber(),
    sentIndex: payment[4].toNumber(),
    receivedIndex: payment[5].toNumber(),
    timestamp: payment[6].toNumber(),
    expirySeconds: payment[7].toNumber(),
    minAttestations: payment[8].toNumber(),
  }
}

contract('Escrow', (accounts: string[]) => {
  let escrow: EscrowInstance
  let mockAttestations: MockAttestationsInstance
  const owner = accounts[0]
  let registry: RegistryInstance

  beforeEach(async () => {
    registry = await Registry.new()
    escrow = await Escrow.new({ from: owner })
    await escrow.initialize(registry.address)
    mockAttestations = await MockAttestations.new({ from: owner })
    await registry.setAddressFor(CeloContractName.Attestations, mockAttestations.address)
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const actualOwner: string = await escrow.owner()
      assert.equal(actualOwner, owner)
    })

    it('should have set the registry address', async () => {
      const registryAddress: string = await escrow.registry()
      assert.equal(registryAddress, registry.address)
    })

    it('should not be callable again', async () => {
      await assertRevert(escrow.initialize(registry.address))
    })
  })

  describe('#setRegistry()', () => {
    const nonOwner: string = accounts[1]
    const anAddress: string = accounts[3]

    it('should allow owner to set registry', async () => {
      await escrow.setRegistry(anAddress)
      assert.equal(await escrow.registry(), anAddress)
    })

    it('should not allow other users to set registry', async () => {
      await assertRevert(escrow.setRegistry(anAddress, { from: nonOwner }))
    })
  })

  describe('tests with tokens', () => {
    let mockERC20Token: MockERC20TokenInstance
    const aValue: number = 10
    const receiver: string = accounts[2]
    const sender: string = accounts[1]

    // @ts-ignore
    const aPhoneHash: string = web3.utils.soliditySha3({ t: 'string', v: '+18005555555' })
    const withdrawKeyAddress: string = accounts[5]
    const anotherWithdrawKeyAddress: string = accounts[6]
    const oneDayInSecs: number = 86400

    beforeEach(async () => {
      mockERC20Token = await MockERC20Token.new()
      await mockERC20Token.mint(sender, aValue)
    })

    describe('#transfer()', () => {
      // in the protocol layer, the amount of verifications is not checked. So, any account
      // can get sent an escrowed payment.
      it('should allow users to transfer tokens to any user', async () => {
        await escrow.transfer(
          aPhoneHash,
          mockERC20Token.address,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          0,
          {
            from: sender,
          }
        )

        const uniquePaymentID: string = withdrawKeyAddress

        const escrowedPayment = await getEscrowedPayment(uniquePaymentID, escrow)

        const received = await escrow.receivedPaymentIds(aPhoneHash, escrowedPayment.receivedIndex)

        assert.equal(
          received,
          uniquePaymentID,
          "Correct Escrowed Payment ID should be stored in aPhoneHash's received payments list"
        )

        const sent = await escrow.sentPaymentIds(sender, escrowedPayment.sentIndex)

        assert.equal(
          sent,
          uniquePaymentID,
          "Correct Escrowed Payment ID should be stored in sender's sent payments list"
        )

        assert.equal(
          escrowedPayment.value,
          aValue,
          'Should have correct value saved in payment struct'
        )

        assert.equal(
          (await mockERC20Token.balanceOf(receiver)).toNumber(),
          0,
          'Should have correct total balance for receiver'
        )
        assert.equal(
          (await mockERC20Token.balanceOf(escrow.address)).toNumber(),
          aValue,
          'Should have correct total balance for the escrow contract'
        )
      })

      it('should not allow two transfers with same ID', async () => {
        await escrow.transfer(
          aPhoneHash,
          mockERC20Token.address,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          0,
          {
            from: sender,
          }
        )
        await assertRevert(
          escrow.transfer(
            aPhoneHash,
            mockERC20Token.address,
            aValue,
            oneDayInSecs,
            withdrawKeyAddress,
            0,
            {
              from: sender,
            }
          )
        )
      })

      it('should not allow a transfer if token is 0', async () => {
        await assertRevert(
          escrow.transfer(aPhoneHash, NULL_ADDRESS, aValue, oneDayInSecs, withdrawKeyAddress, 0, {
            from: sender,
          })
        )
      })

      it('should not allow a transfer if value is 0', async () => {
        await assertRevert(
          escrow.transfer(
            aPhoneHash,
            mockERC20Token.address,
            0,
            oneDayInSecs,
            withdrawKeyAddress,
            0,
            {
              from: sender,
            }
          )
        )
      })

      it('should not allow a transfer if expirySeconds is 0', async () => {
        await assertRevert(
          escrow.transfer(aPhoneHash, mockERC20Token.address, aValue, 0, withdrawKeyAddress, 0, {
            from: sender,
          })
        )
      })

      it('should not allow a transfer if identifier is empty but minAttestations is > 0', async () => {
        await assertRevert(
          escrow.transfer('0x0', mockERC20Token.address, aValue, 0, withdrawKeyAddress, 1, {
            from: sender,
          })
        )
      })
    })

    async function doubleTransfer() {
      await mockERC20Token.mint(sender, aValue)
      await escrow.transfer(
        aPhoneHash,
        mockERC20Token.address,
        aValue,
        oneDayInSecs,
        withdrawKeyAddress,
        0,
        {
          from: sender,
        }
      )
      await timeTravel(10, web3)
      await escrow.transfer(
        aPhoneHash,
        mockERC20Token.address,
        aValue,
        oneDayInSecs,
        anotherWithdrawKeyAddress,
        1,
        {
          from: sender,
        }
      )
    }

    describe('#withdraw()', () => {
      let uniquePaymentIDWithdraw: string
      let parsedSig1: any
      let parsedSig2: any

      beforeEach(async () => {
        parsedSig1 = await getParsedSignatureOfAddress(web3, accounts[2], accounts[5])
        parsedSig2 = await getParsedSignatureOfAddress(web3, accounts[2], accounts[6])
        await doubleTransfer()
        uniquePaymentIDWithdraw = withdrawKeyAddress
      })

      it('should allow verified users to withdraw their escrowed tokens', async () => {
        const receivedPaymentsBefore = await escrow.getReceivedPaymentIds(aPhoneHash)
        const sentPaymentsBefore = await escrow.getSentPaymentIds(sender)
        const paymentBefore = await getEscrowedPayment(uniquePaymentIDWithdraw, escrow)
        const sendersLastEscrowedPaymentBefore = await getEscrowedPayment(
          sentPaymentsBefore[sentPaymentsBefore.length - 1],
          escrow
        )
        const receiversLastEscrowedPaymentBefore = await getEscrowedPayment(
          receivedPaymentsBefore[receivedPaymentsBefore.length - 1],
          escrow
        )

        await escrow.withdraw(uniquePaymentIDWithdraw, parsedSig1.v, parsedSig1.r, parsedSig1.s, {
          from: receiver,
        })

        const receivedPaymentsAfterWithdraw = await escrow.getReceivedPaymentIds(aPhoneHash)
        const sentPaymentsAfterWithdraw = await escrow.getSentPaymentIds(sender)
        const sendersLastPaymentAfterWithdraw = await getEscrowedPayment(
          sentPaymentsAfterWithdraw[sentPaymentsAfterWithdraw.length - 1],
          escrow
        )
        const receiversLastPaymentAfterWithdraw = await getEscrowedPayment(
          receivedPaymentsAfterWithdraw[receivedPaymentsAfterWithdraw.length - 1],
          escrow
        )

        assert.equal(
          (await mockERC20Token.balanceOf(receiver)).toNumber(),
          aValue,
          'Should have correct total balance for receiver'
        )

        assert.equal(
          (await mockERC20Token.balanceOf(escrow.address)).toNumber(),
          aValue,
          'Should have correct total balance for the escrow contract'
        )

        assert.include(
          receivedPaymentsBefore,
          uniquePaymentIDWithdraw,
          "Should have saved this escrowed payment in receiver's receivedPaymentIds list after transfer"
        )

        assert.notInclude(
          receivedPaymentsAfterWithdraw,
          uniquePaymentIDWithdraw,
          "Should have deleted this escrowed payment from receiver's receivedPaymentIds list after withdraw"
        )

        assert.include(
          sentPaymentsBefore,
          uniquePaymentIDWithdraw,
          "Should have saved this escrowed payment in sender's sentPaymentIds list after transfer"
        )

        assert.notInclude(
          sentPaymentsAfterWithdraw,
          uniquePaymentIDWithdraw,
          "Should have deleted this escrowed payment from sender's sentPaymentIds list after withdraw"
        )

        assert.notEqual(
          sendersLastEscrowedPaymentBefore.sentIndex,
          paymentBefore.sentIndex,
          "This escrowed payments sentIndex should be different from that of sender's sentPaymentIds last payment before withdraw"
        )

        assert.notEqual(
          receiversLastEscrowedPaymentBefore.receivedIndex,
          paymentBefore.receivedIndex,
          "This escrowed payments receivedIndex should be different from that of receiver's receivedPaymentIds last payment before withdraw"
        )

        assert.equal(
          sendersLastPaymentAfterWithdraw.sentIndex,
          paymentBefore.sentIndex,
          "Should have changed sentIndex for this escrowed payment from sender's sentPaymentIds list after withdraw"
        )

        assert.equal(
          receiversLastPaymentAfterWithdraw.receivedIndex,
          paymentBefore.receivedIndex,
          "Should have changed receivedIndex for this escrowed payment from receiver's receivedPaymentIds list after withdraw"
        )
      })

      it('should not allow a user who does not prove ownership of the withdraw key to withdraw tokens', async () => {
        // The signature is invalidated if it's sent from a different address
        await assertRevert(
          escrow.withdraw(uniquePaymentIDWithdraw, parsedSig1.v, parsedSig1.r, parsedSig1.s, {
            from: accounts[3],
          })
        )
      })

      it('should not allow sender to use withdraw function even if payment has expired', async () => {
        await timeTravel(oneDayInSecs, web3)
        await assertRevert(
          escrow.withdraw(uniquePaymentIDWithdraw, parsedSig1.v, parsedSig1.r, parsedSig1.s, {
            from: sender,
          })
        )
      })

      it('should not allow a user to withdraw a payment if they have fewer than minAttestations', async () => {
        await assertRevert(
          escrow.withdraw(anotherWithdrawKeyAddress, parsedSig2.v, parsedSig2.r, parsedSig2.s, {
            from: receiver,
          })
        )
      })
    })

    describe('#revoke()', () => {
      let uniquePaymentIDRevoke: string
      let parsedSig1: any

      beforeEach(async () => {
        await doubleTransfer()
        uniquePaymentIDRevoke = withdrawKeyAddress
        parsedSig1 = await getParsedSignatureOfAddress(web3, accounts[2], accounts[5])
      })

      it('should allow sender to redeem payment after payment has expired', async () => {
        await timeTravel(oneDayInSecs, web3)
        const escrowedPaymentBefore = await getEscrowedPayment(uniquePaymentIDRevoke, escrow)

        await escrow.revoke(uniquePaymentIDRevoke, { from: sender })

        const sentPaymentsAfterRevoke = await escrow.getSentPaymentIds(sender)
        const receivedPaymentsAfterRevoke = await escrow.getReceivedPaymentIds(aPhoneHash)

        assert.notInclude(
          sentPaymentsAfterRevoke,
          uniquePaymentIDRevoke,
          "Should have deleted this escrowed payment from sender's sentPaymentIds list after revoke"
        )

        assert.notInclude(
          receivedPaymentsAfterRevoke,
          uniquePaymentIDRevoke,
          "Should have deleted this escrowed payment from receiver's receivedPaymentIds list after revoke"
        )

        const escrowedPaymentAfter = await getEscrowedPayment(uniquePaymentIDRevoke, escrow)

        assert.notEqual(
          escrowedPaymentBefore,
          escrowedPaymentAfter,
          'Should have zeroed this escrowed payments values after revoke'
        )
      })

      it('should not allow sender to revoke payment after receiver withdraws', async () => {
        await escrow.withdraw(uniquePaymentIDRevoke, parsedSig1.v, parsedSig1.r, parsedSig1.s, {
          from: receiver,
        })
        await assertRevert(escrow.revoke(uniquePaymentIDRevoke, { from: sender }))
      })

      it('should not allow receiver to redeem payment after sender revokes it', async () => {
        await timeTravel(oneDayInSecs, web3)
        await escrow.revoke(uniquePaymentIDRevoke, { from: sender })
        await assertRevert(
          escrow.withdraw(uniquePaymentIDRevoke, parsedSig1.v, parsedSig1.r, parsedSig1.s, {
            from: receiver,
          })
        )
      })

      it('should not allow sender to revoke payment before payment has expired', async () => {
        await assertRevert(escrow.revoke(uniquePaymentIDRevoke, { from: sender }))
      })

      it('should not allow receiver to use revoke function', async () => {
        await timeTravel(oneDayInSecs, web3)
        await assertRevert(escrow.revoke(uniquePaymentIDRevoke, { from: receiver }))
      })

      it('should not allow any account who is not the sender to use revoke function', async () => {
        await timeTravel(oneDayInSecs, web3)
        await assertRevert(escrow.revoke(uniquePaymentIDRevoke, { from: accounts[4] }))
      })
    })
  })
})
