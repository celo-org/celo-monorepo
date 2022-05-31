import { NULL_ADDRESS } from '@celo/base/lib/address'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertRevert, assertRevertWithReason, timeTravel } from '@celo/protocol/lib/test-utils'
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
    registry = await Registry.new(true)
    escrow = await Escrow.new(true, { from: owner })
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
      // TODO EN: consdier moving this into the transfer specific cases,
      // then have a mint & transfer helper
      await mockERC20Token.mint(sender, aValue)
    })

    describe('#transfer()', async () => {
      const runTransferCase = async (
        escrowSender: string,
        identifier: string,
        value: number,
        expirySeconds: number,
        paymentId: string,
        minAttestations: number,
        expectedSentIndex: number,
        expectedReceivedIndex: number
      ) => {
        const startingEscrowContractBalance = (
          await mockERC20Token.balanceOf(escrow.address)
        ).toNumber()
        const startingSenderBalance = (await mockERC20Token.balanceOf(escrowSender)).toNumber()

        await escrow.transfer(
          identifier,
          mockERC20Token.address,
          value,
          expirySeconds,
          paymentId,
          minAttestations,
          { from: escrowSender }
        )
        const escrowedPayment = await getEscrowedPayment(paymentId, escrow)

        // Check against objectively expected indices
        assert.equal(
          escrowedPayment.sentIndex,
          expectedSentIndex,
          'unexpected escrowedPayment.sendIndex'
        )
        assert.equal(
          escrowedPayment.receivedIndex,
          expectedReceivedIndex,
          'unexpected escrowedPayment.receivedIndex'
        )

        // Check that sent/received indices correspond to stored lists
        const received = await escrow.receivedPaymentIds(identifier, escrowedPayment.receivedIndex)
        assert.equal(
          received,
          paymentId,
          "expected paymentId not found at expected index in identifier's received payments list"
        )

        const sent = await escrow.sentPaymentIds(escrowSender, escrowedPayment.sentIndex)
        assert.equal(
          sent,
          paymentId,
          "expected paymentId not found in escrowSender's sent payments list"
        )
        assert.equal(
          escrowedPayment.value,
          value,
          'incorrect escrowedPayment.value in payment struct'
        )

        assert.equal(
          (await mockERC20Token.balanceOf(escrowSender)).toNumber(),
          startingSenderBalance - value,
          'incorrect final sender balance'
        )
        assert.equal(
          (await mockERC20Token.balanceOf(escrow.address)).toNumber(),
          startingEscrowContractBalance + value,
          'incorrect final Escrow contract balance'
        )
      }

      it('should allow users to transfer tokens to any user', async () => {
        await runTransferCase(sender, aPhoneHash, aValue, oneDayInSecs, withdrawKeyAddress, 0, 0, 0)
      })

      it('should allow transfer when minAttestations > 0 and identifier is provided', async () => {
        await runTransferCase(sender, aPhoneHash, aValue, oneDayInSecs, withdrawKeyAddress, 3, 0, 0)
      })

      it('should allow transfer when no identifier is provided', async () => {
        await runTransferCase(sender, '0x0', aValue, oneDayInSecs, withdrawKeyAddress, 0, 0, 0)
      })

      it('should allow transfers from same sender with different paymentIds', async () => {
        // TODO EN: replace with mint&transfer func
        await mockERC20Token.mint(sender, aValue)
        await escrow.transfer(
          '0x0',
          mockERC20Token.address,
          aValue,
          oneDayInSecs,
          anotherWithdrawKeyAddress,
          0,
          { from: sender }
        )
        // TODO EN: revisit: consider removing the objective check?? I think it makes sense to have but not sure
        await runTransferCase(sender, '0x0', aValue, oneDayInSecs, withdrawKeyAddress, 0, 1, 1)

        // Ensure that second payment didn't affect indices of existing payment
        const firstPayment = await getEscrowedPayment(anotherWithdrawKeyAddress, escrow)
        assert.equal(firstPayment.sentIndex, 0)
        assert.equal(firstPayment.receivedIndex, 0)
      })

      it('should not allow two transfers with same paymentId', async () => {
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
        await assertRevertWithReason(
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
          ),
          'paymentId already used'
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
        await assertRevertWithReason(
          escrow.transfer(
            '0x0',
            mockERC20Token.address,
            aValue,
            oneDayInSecs,
            withdrawKeyAddress,
            1,
            {
              from: sender,
            }
          ),
          "Invalid privacy inputs: Can't require attestations if no identifier"
        )
      })
    })

    async function doubleTransfer() {
      // EN TODO: refactor this into a single transfer
      // this is super confusing --> the second mint happens outside, in the main function
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
      const uniquePaymentIDWithdraw = withdrawKeyAddress

      const runWithdrawCase = async (
        escrowSender: string,
        escrowReceiver: string,
        identifier: string,
        value: number,
        paymentId: string,
        attestationsToComplete: number
      ) => {
        const receiverBalanceBefore = (await mockERC20Token.balanceOf(escrowReceiver)).toNumber()
        const escrowContractBalanceBefore = (
          await mockERC20Token.balanceOf(escrow.address)
        ).toNumber()
        const receivedPaymentsBefore = await escrow.getReceivedPaymentIds(identifier)
        const sentPaymentsBefore = await escrow.getSentPaymentIds(escrowSender)
        const paymentBefore = await getEscrowedPayment(paymentId, escrow)

        // If there are existing payments, check that indices are updated appropriately
        const checkLastSentPayment = sentPaymentsBefore.length > 1
        const checkLastReceivedPayment = receivedPaymentsBefore.length > 1

        // Mock completed attestations
        for (let i = 0; i < attestationsToComplete; i++) {
          await mockAttestations.complete(identifier, 0, '0x0', '0x0', { from: escrowReceiver })
        }
        const parsedSig = await getParsedSignatureOfAddress(web3, escrowReceiver, paymentId)
        await escrow.withdraw(paymentId, parsedSig.v, parsedSig.r, parsedSig.s, {
          from: escrowReceiver,
        })
        const receivedPaymentsAfterWithdraw = await escrow.getReceivedPaymentIds(identifier)
        const sentPaymentsAfterWithdraw = await escrow.getSentPaymentIds(escrowSender)
        assert.equal(
          (await mockERC20Token.balanceOf(escrowReceiver)).toNumber(),
          receiverBalanceBefore + value,
          // TODO EN: change all of the weird assert phrasings for all of these messages
          'incorrect final receiver balance'
        )

        assert.equal(
          (await mockERC20Token.balanceOf(escrow.address)).toNumber(),
          escrowContractBalanceBefore - value,
          'incorrect final Escrow contract balance'
        )

        // EN TODO: this belongs in the transfer test (/is already tested there...)
        // TODO: add a test for this? / for the getReceivedPaymentIds & getSentPaymentId functions?
        // EN TODO: change after making the bug fix
        // probably not necessary again here
        // assert.include(
        //   receivedPaymentsBefore,
        //   paymentId,
        //   "Should have saved this escrowed payment in receiver's receivedPaymentIds list after transfer"
        // )

        // EN TODO: keep
        assert.notInclude(
          receivedPaymentsAfterWithdraw,
          paymentId,
          "paymentId still in receiver's receivedPaymentIds list after withdraw"
        )

        // EN TODO: this belongs in the transfer test (/is already tested there...)
        // probably not necessary again here
        // assert.include(
        //   sentPaymentsBefore,
        //   paymentId,
        //   "Should have saved this escrowed payment in sender's sentPaymentIds list after transfer"
        // )

        // EN TODO: keep
        assert.notInclude(
          sentPaymentsAfterWithdraw,
          paymentId,
          "paymentId still in sender's sentPaymentIds list after withdraw"
        )

        // Check that indices of last payment structs in previous lists are properly updated
        if (checkLastSentPayment) {
          const sendersLastPaymentAfterWithdraw = await getEscrowedPayment(
            sentPaymentsBefore[sentPaymentsBefore.length - 1],
            escrow
          )
          // assert.notEqual(
          //   sendersLastEscrowedPaymentBefore.sentIndex,
          //   paymentBefore.sentIndex,
          //   "incorrect pre-withdraw sentIndex of last payment in sender's sentPaymentIds"
          // )
          assert.equal(
            sendersLastPaymentAfterWithdraw.sentIndex,
            paymentBefore.sentIndex,
            "sentIndex of last payment in sender's sentPaymentIds not updated properly"
          )
        }

        if (checkLastReceivedPayment) {
          const receiversLastPaymentAfterWithdraw = await getEscrowedPayment(
            receivedPaymentsBefore[receivedPaymentsBefore.length - 1],
            escrow
          )
          // assert.notEqual(
          //   receiversLastEscrowedPaymentBefore.receivedIndex,
          //   paymentBefore.receivedIndex,
          //   "incorrect pre-withdraw receivedIndex of last payment in receiver's receivedPaymentIds"
          // )
          assert.equal(
            receiversLastPaymentAfterWithdraw.receivedIndex,
            paymentBefore.receivedIndex,
            "receivedIndex of last payment in receiver's receivedPaymentIds not updated properly"
          )
        }
      }

      // TODO EN: move somewhere more sensible
      const mintAndTransfer = async (
        escrowSender: string,
        identifier: string,
        value: number,
        expirySeconds: number,
        paymentId: string,
        minAttestations: number
      ) => {
        await mockERC20Token.mint(escrowSender, value)
        await escrow.transfer(
          identifier,
          mockERC20Token.address,
          value,
          expirySeconds,
          paymentId,
          minAttestations,
          {
            from: escrowSender,
          }
        )
      }

      describe('when first payment from sender is escrowed without an identifier', () => {
        beforeEach(async () => {
          // TODO EN: consider moving this directly into run case helper func
          // TODO EN: switch to mintAndTransfer after removing first mint from bigger beforeAll
          await escrow.transfer(
            '0x0',
            mockERC20Token.address,
            aValue,
            oneDayInSecs,
            uniquePaymentIDWithdraw,
            0,
            {
              from: sender,
            }
          )
        })

        it('should allow withdrawal with possession of PK and no attestations', async () => {
          await runWithdrawCase(sender, receiver, '0x0', aValue, uniquePaymentIDWithdraw, 0)
        })

        it('should withdraw properly when second payment escrowed with empty identifier', async () => {
          await mintAndTransfer(sender, '0x0', aValue, oneDayInSecs, anotherWithdrawKeyAddress, 0)
          await runWithdrawCase(sender, receiver, '0x0', aValue, uniquePaymentIDWithdraw, 0)
        })
        it("should withdraw properly when sender's second payment has an identifier with attestations", async () => {
          await mintAndTransfer(
            sender,
            aPhoneHash,
            aValue,
            oneDayInSecs,
            anotherWithdrawKeyAddress,
            3
          )
          await runWithdrawCase(sender, receiver, '0x0', aValue, uniquePaymentIDWithdraw, 0)
        })
        it('should not allow withdrawing without a valid signature using the withdraw key', async () => {
          // The signature is invalidated if it's sent from a different address
          const parsedSig = await getParsedSignatureOfAddress(
            web3,
            receiver,
            uniquePaymentIDWithdraw
          )
          await assertRevertWithReason(
            escrow.withdraw(uniquePaymentIDWithdraw, parsedSig.v, parsedSig.r, parsedSig.s, {
              from: sender,
            }),
            'Failed to prove ownership of the withdraw key'
          )
        })
      })

      describe('when first payment is escrowed by a sender for an identifier && minAttestations', () => {
        const minAttestations = 3
        beforeEach(async () => {
          // TODO EN: revisit once mint is taken out of top-level function
          await escrow.transfer(
            aPhoneHash,
            mockERC20Token.address,
            aValue,
            oneDayInSecs,
            uniquePaymentIDWithdraw,
            minAttestations,
            {
              from: sender,
            }
          )
        })

        it('should allow users to withdraw after completing attestations', async () => {
          await runWithdrawCase(
            sender,
            receiver,
            aPhoneHash,
            aValue,
            uniquePaymentIDWithdraw,
            minAttestations
          )
        })
        it('should not allow a user to withdraw a payment if they have fewer than minAttestations', async () => {
          await assertRevertWithReason(
            runWithdrawCase(
              sender,
              receiver,
              aPhoneHash,
              aValue,
              uniquePaymentIDWithdraw,
              minAttestations - 1
            ),
            'This account does not have enough attestations to withdraw this payment.'
          )
        })
        it("should withdraw properly when sender's second payment has an identifier", async () => {
          await mintAndTransfer(
            sender,
            aPhoneHash,
            aValue,
            oneDayInSecs,
            anotherWithdrawKeyAddress,
            0
          )
          await runWithdrawCase(
            sender,
            receiver,
            aPhoneHash,
            aValue,
            uniquePaymentIDWithdraw,
            minAttestations
          )
        })
      })
    })

    describe('#revoke()', () => {
      let uniquePaymentIDRevoke: string
      let parsedSig1: any

      beforeEach(async () => {
        await doubleTransfer()
        uniquePaymentIDRevoke = withdrawKeyAddress
        parsedSig1 = await getParsedSignatureOfAddress(web3, receiver, withdrawKeyAddress)
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
