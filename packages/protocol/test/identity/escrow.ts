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

const NULL_ESCROWED_PAYMENT: EscrowedPayment = {
  recipientPhoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  sender: '0x0000000000000000000000000000000000000000',
  token: '0x0000000000000000000000000000000000000000',
  value: 0,
  sentIndex: 0,
  receivedIndex: 0,
  timestamp: 0,
  expirySeconds: 0,
  minAttestations: 0,
}
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
      const transferAndCheckState = async (
        escrowSender: string,
        identifier: string,
        value: number,
        expirySeconds: number,
        paymentId: string,
        minAttestations: number,
        expectedSentPaymentIds: string[],
        expectedReceivedPaymentIds: string[]
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

        // Check against expected receivedPaymentIds and sentPaymentIds,
        // and corresponding indices in the payment struct
        const receivedPaymentIds = await escrow.getReceivedPaymentIds(identifier)
        assert.deepEqual(
          receivedPaymentIds,
          expectedReceivedPaymentIds,
          'unexpected receivedPaymentIds'
        )
        assert.equal(
          receivedPaymentIds[escrowedPayment.receivedIndex],
          paymentId,
          "expected paymentId not found at expected index in identifier's received payments list"
        )
        const sentPaymentIds = await escrow.getSentPaymentIds(escrowSender)
        assert.deepEqual(sentPaymentIds, expectedSentPaymentIds, 'unexpected sentPaymentIds')
        assert.equal(
          sentPaymentIds[escrowedPayment.sentIndex],
          paymentId,
          "expected paymentId not found in escrowSender's sent payments list"
        )
      }

      it('should allow users to transfer tokens to any user', async () => {
        await transferAndCheckState(
          sender,
          aPhoneHash,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          0,
          [withdrawKeyAddress],
          [withdrawKeyAddress]
        )
      })

      it('should allow transfer when minAttestations > 0 and identifier is provided', async () => {
        await transferAndCheckState(
          sender,
          aPhoneHash,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          3,
          [withdrawKeyAddress],
          [withdrawKeyAddress]
        )
      })

      it('should allow transfer when no identifier is provided', async () => {
        await transferAndCheckState(
          sender,
          '0x0',
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          0,
          [withdrawKeyAddress],
          [withdrawKeyAddress]
        )
      })

      it('should allow transfers from same sender with different paymentIds', async () => {
        await mintAndTransfer(sender, '0x0', aValue, oneDayInSecs, anotherWithdrawKeyAddress, 0)
        await transferAndCheckState(
          sender,
          '0x0',
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          0,
          [anotherWithdrawKeyAddress, withdrawKeyAddress],
          [anotherWithdrawKeyAddress, withdrawKeyAddress]
        )
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

      // TODO EN: this one should fail until bugfix; include after tests refactored
      xit('should not allow a transfer if identifier is empty but minAttestations is > 0', async () => {
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

    // async function doubleTransfer() {
    //   // EN TODO: refactor this into a single transfer
    //   // this is super confusing --> the second mint happens outside, in the main function
    //   await mockERC20Token.mint(sender, aValue)
    //   await escrow.transfer(
    //     aPhoneHash,
    //     mockERC20Token.address,
    //     aValue,
    //     oneDayInSecs,
    //     withdrawKeyAddress,
    //     0,
    //     {
    //       from: sender,
    //     }
    //   )
    //   await timeTravel(10, web3)
    //   await escrow.transfer(
    //     aPhoneHash,
    //     mockERC20Token.address,
    //     aValue,
    //     oneDayInSecs,
    //     anotherWithdrawKeyAddress,
    //     1,
    //     {
    //       from: sender,
    //     }
    //   )
    // }

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

    // TODO EN: move somewhere more sensible
    const checkStateAfterDeletingPayment = async (
      deletedPaymentId: string,
      deletedPayment: EscrowedPayment,
      escrowSender: string,
      identifier: string,
      expectedSentPaymentIds: string[],
      expectedReceivedPaymentIds: string[]
    ) => {
      const sentPaymentIds = await escrow.getSentPaymentIds(escrowSender)
      const receivedPaymentIds = await escrow.getReceivedPaymentIds(identifier)
      assert.deepEqual(sentPaymentIds, expectedSentPaymentIds, 'unexpected sentPaymentIds')
      assert.deepEqual(
        receivedPaymentIds,
        expectedReceivedPaymentIds,
        'unexpected receivedPaymentIds'
      )
      // Check that indices of last payment structs in previous lists are properly updated
      if (expectedSentPaymentIds.length) {
        const sendersLastPaymentAfterDelete = await getEscrowedPayment(
          expectedSentPaymentIds[expectedSentPaymentIds.length - 1],
          escrow
        )
        assert.equal(
          sendersLastPaymentAfterDelete.sentIndex,
          deletedPayment.sentIndex,
          "sentIndex of last payment in sender's sentPaymentIds not updated properly"
        )
      }
      if (expectedReceivedPaymentIds.length) {
        const receiversLastPaymentAfterDelete = await getEscrowedPayment(
          expectedReceivedPaymentIds[expectedReceivedPaymentIds.length - 1],
          escrow
        )
        assert.equal(
          receiversLastPaymentAfterDelete.receivedIndex,
          deletedPayment.receivedIndex,
          "receivedIndex of last payment in receiver's receivedPaymentIds not updated properly"
        )
      }
      const deletedEscrowedPayment = await getEscrowedPayment(deletedPaymentId, escrow)
      assert.deepEqual(
        deletedEscrowedPayment,
        NULL_ESCROWED_PAYMENT,
        'escrowedPayment not zeroed out'
      )
    }

    describe('#withdraw()', () => {
      const uniquePaymentIDWithdraw = withdrawKeyAddress

      const withdrawAndCheckState = async (
        escrowSender: string,
        escrowReceiver: string,
        identifier: string,
        value: number,
        paymentId: string,
        attestationsToComplete: number,
        expectedSentPaymentIds: string[],
        expectedReceivedPaymentIds: string[]
      ) => {
        const receiverBalanceBefore = (await mockERC20Token.balanceOf(escrowReceiver)).toNumber()
        const escrowContractBalanceBefore = (
          await mockERC20Token.balanceOf(escrow.address)
        ).toNumber()
        const paymentBefore = await getEscrowedPayment(paymentId, escrow)

        // Mock completed attestations
        for (let i = 0; i < attestationsToComplete; i++) {
          await mockAttestations.complete(identifier, 0, '0x0', '0x0', { from: escrowReceiver })
        }
        const parsedSig = await getParsedSignatureOfAddress(web3, escrowReceiver, paymentId)
        await escrow.withdraw(paymentId, parsedSig.v, parsedSig.r, parsedSig.s, {
          from: escrowReceiver,
        })
        assert.equal(
          (await mockERC20Token.balanceOf(escrowReceiver)).toNumber(),
          receiverBalanceBefore + value,
          'incorrect final receiver balance'
        )

        assert.equal(
          (await mockERC20Token.balanceOf(escrow.address)).toNumber(),
          escrowContractBalanceBefore - value,
          'incorrect final Escrow contract balance'
        )

        await checkStateAfterDeletingPayment(
          paymentId,
          paymentBefore,
          escrowSender,
          identifier,
          expectedSentPaymentIds,
          expectedReceivedPaymentIds
        )
      }

      describe('when no payment has been escrowed', () => {
        it('should fail to withdraw funds', async () => {
          const parsedSig = await getParsedSignatureOfAddress(
            web3,
            receiver,
            uniquePaymentIDWithdraw
          )
          await assertRevertWithReason(
            escrow.withdraw(uniquePaymentIDWithdraw, parsedSig.v, parsedSig.r, parsedSig.s, {
              from: receiver,
            }),
            'Invalid withdraw value.'
          )
        })
      })

      describe('when first payment from sender is escrowed without an identifier', () => {
        beforeEach(async () => {
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
          await withdrawAndCheckState(
            sender,
            receiver,
            '0x0',
            aValue,
            uniquePaymentIDWithdraw,
            0,
            [],
            []
          )
        })

        it('should withdraw properly when second payment escrowed with empty identifier', async () => {
          await mintAndTransfer(sender, '0x0', aValue, oneDayInSecs, anotherWithdrawKeyAddress, 0)
          await withdrawAndCheckState(
            sender,
            receiver,
            '0x0',
            aValue,
            uniquePaymentIDWithdraw,
            0,
            [anotherWithdrawKeyAddress],
            [anotherWithdrawKeyAddress]
          )
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
          await withdrawAndCheckState(
            sender,
            receiver,
            '0x0',
            aValue,
            uniquePaymentIDWithdraw,
            0,
            [anotherWithdrawKeyAddress],
            []
          )
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
          await withdrawAndCheckState(
            sender,
            receiver,
            aPhoneHash,
            aValue,
            uniquePaymentIDWithdraw,
            minAttestations,
            [],
            []
          )
        })
        it('should not allow a user to withdraw a payment if they have fewer than minAttestations', async () => {
          await assertRevertWithReason(
            withdrawAndCheckState(
              sender,
              receiver,
              aPhoneHash,
              aValue,
              uniquePaymentIDWithdraw,
              minAttestations - 1,
              [],
              []
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
          await withdrawAndCheckState(
            sender,
            receiver,
            aPhoneHash,
            aValue,
            uniquePaymentIDWithdraw,
            minAttestations,
            [anotherWithdrawKeyAddress],
            [anotherWithdrawKeyAddress]
          )
        })
      })
    })

    describe('#revoke()', () => {
      let uniquePaymentIDRevoke: string
      let parsedSig1: any

      beforeEach(async () => {
        // await doubleTransfer()
        // console.log(doubleTransfer)
        await mintAndTransfer(sender, aPhoneHash, aValue, oneDayInSecs, withdrawKeyAddress, 0)
        // TODO this timetravel seems unnecessary here
        await timeTravel(10, web3)
        await mintAndTransfer(
          sender,
          aPhoneHash,
          aValue,
          oneDayInSecs,
          anotherWithdrawKeyAddress,
          0
        )

        uniquePaymentIDRevoke = withdrawKeyAddress
        parsedSig1 = await getParsedSignatureOfAddress(web3, receiver, withdrawKeyAddress)
      })

      it('should allow sender to redeem payment after payment has expired', async () => {
        await timeTravel(oneDayInSecs, web3)

        const senderBalanceBefore = (await mockERC20Token.balanceOf(sender)).toNumber()
        const escrowContractBalanceBefore = (
          await mockERC20Token.balanceOf(escrow.address)
        ).toNumber()
        const paymentBefore = await getEscrowedPayment(uniquePaymentIDRevoke, escrow)

        await escrow.revoke(uniquePaymentIDRevoke, { from: sender })

        assert.equal(
          (await mockERC20Token.balanceOf(sender)).toNumber(),
          senderBalanceBefore + aValue,
          'incorrect final sender balance'
        )
        assert.equal(
          (await mockERC20Token.balanceOf(escrow.address)).toNumber(),
          escrowContractBalanceBefore - aValue,
          'incorrect final Escrow contract balance'
        )

        await checkStateAfterDeletingPayment(
          uniquePaymentIDRevoke,
          paymentBefore,
          sender,
          aPhoneHash,
          [anotherWithdrawKeyAddress],
          [anotherWithdrawKeyAddress]
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

    // TODO EN: direction for future refactor but for now it's redundant with transfer test
    describe('#getReceivedPaymentIds', () => {
      const identifiers = ['0x0', aPhoneHash]
      identifiers.forEach((identifier) => {
        describe(`when identifier is ${identifier == '0x0' ? '' : 'not'} empty`, async () => {
          it('should return empty list if no payments are escrowed for paymentId', async () => {
            const receivedPaymentIds = await escrow.getReceivedPaymentIds(identifier)
            assert.deepEqual(receivedPaymentIds, [])
          })
          it('should list received payment after transfer', async () => {
            await mintAndTransfer(sender, identifier, aValue, oneDayInSecs, withdrawKeyAddress, 1)
            const receivedPaymentIds = await escrow.getReceivedPaymentIds(identifier)
            assert.deepEqual(receivedPaymentIds, [withdrawKeyAddress])
          })
          it('should list multiple paymentIds in received order', async () => {
            await mintAndTransfer(sender, identifier, aValue, oneDayInSecs, withdrawKeyAddress, 1)
            await mintAndTransfer(
              sender,
              identifier,
              aValue,
              oneDayInSecs,
              anotherWithdrawKeyAddress,
              1
            )
            const receivedPaymentIds = await escrow.getReceivedPaymentIds(identifier)
            assert.deepEqual(receivedPaymentIds, [withdrawKeyAddress, anotherWithdrawKeyAddress])
          })
        })
      })
    })
    describe('#getSentPaymentIds', () => {
      const identifiers = ['0x0', aPhoneHash]
      identifiers.forEach((identifier) => {
        describe(`when identifier is ${identifier == '0x0' ? '' : 'not'} empty`, async () => {
          it('should return empty list if no payments are escrowed for paymentId', async () => {
            const sentPaymentIds = await escrow.getSentPaymentIds(sender)
            assert.deepEqual(sentPaymentIds, [])
          })
          it('should list sent paymentIds after transfer', async () => {
            await mintAndTransfer(sender, identifier, aValue, oneDayInSecs, withdrawKeyAddress, 1)
            const sentPaymentIds = await escrow.getSentPaymentIds(sender)
            assert.deepEqual(sentPaymentIds, [withdrawKeyAddress])
          })
        })
      })
      it('should display sent paymentIds in sent order with multiple identifiers', async () => {
        await mintAndTransfer(sender, aPhoneHash, aValue, oneDayInSecs, withdrawKeyAddress, 1)
        await mintAndTransfer(sender, '0x0', aValue, oneDayInSecs, anotherWithdrawKeyAddress, 1)
        const sentPaymentIds = await escrow.getSentPaymentIds(sender)
        assert.deepEqual(sentPaymentIds, [withdrawKeyAddress, anotherWithdrawKeyAddress])
      })
    })
  })
})
