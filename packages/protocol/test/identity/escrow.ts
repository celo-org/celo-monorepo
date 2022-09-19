import { NULL_ADDRESS } from '@celo/base/lib/address'
import getPhoneHash from '@celo/phone-utils/lib/getPhoneHash'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertLogMatches2,
  assertObjectWithBNEqual,
  assertRevert,
  assertRevertWithReason,
  assumeOwnership,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import BN from 'bn.js'
import {
  EscrowContract,
  EscrowInstance,
  FederatedAttestationsContract,
  FederatedAttestationsInstance,
  MockAttestationsContract,
  MockAttestationsInstance,
  MockERC20TokenContract,
  MockERC20TokenInstance,
  RegistryInstance,
} from 'types'
import { getParsedSignatureOfAddress } from '../../lib/signing-utils'

const Escrow: EscrowContract = artifacts.require('Escrow')
const MockERC20Token: MockERC20TokenContract = artifacts.require('MockERC20Token')
const MockAttestations: MockAttestationsContract = artifacts.require('MockAttestations')
const FederatedAttestations: FederatedAttestationsContract =
  artifacts.require('FederatedAttestations')

const NULL_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'
const NULL_ESCROWED_PAYMENT: EscrowedPayment = {
  recipientIdentifier: NULL_BYTES32,
  sender: NULL_ADDRESS,
  token: NULL_ADDRESS,
  value: new BN(0),
  sentIndex: 0,
  receivedIndex: 0,
  timestamp: 0,
  expirySeconds: 0,
  minAttestations: 0,
}
interface EscrowedPayment {
  recipientIdentifier: string
  sender: string
  token: string
  value: BN
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
    recipientIdentifier: payment[0],
    sender: payment[1],
    token: payment[2],
    // numbers expected to be small such as indices are directly casted to numbers
    value: web3.utils.toBN(payment[3]),
    sentIndex: payment[4].toNumber(),
    receivedIndex: payment[5].toNumber(),
    timestamp: web3.utils.toBN(payment[6].toNumber()),
    expirySeconds: payment[7].toNumber(),
    minAttestations: payment[8].toNumber(),
  }
}

contract('Escrow', (accounts: string[]) => {
  let escrow: EscrowInstance
  let mockAttestations: MockAttestationsInstance
  let federatedAttestations: FederatedAttestationsInstance
  let registry: RegistryInstance

  const owner = accounts[0]
  const sender: string = accounts[1]
  const receiver: string = accounts[2]
  const withdrawKeyAddress: string = accounts[3]
  const anotherWithdrawKeyAddress: string = accounts[4]
  const trustedIssuer1 = accounts[5]
  const trustedIssuer2 = accounts[6]
  const testTrustedIssuers = [trustedIssuer1, trustedIssuer2]

  const aValue: number = 10
  const aPhoneHash = getPhoneHash('+18005555555')
  const oneDayInSecs: number = 86400

  before(async () => {
    registry = await getDeployedProxiedContract('Registry', artifacts)
    if ((await registry.owner()) !== owner) {
      // In CI we need to assume ownership, locally using quicktest we don't
      await assumeOwnership(['Registry'], owner)
    }
  })

  beforeEach(async () => {
    escrow = await Escrow.new(true, { from: owner })
    await escrow.initialize()
    mockAttestations = await MockAttestations.new({ from: owner })
    federatedAttestations = await FederatedAttestations.new(true, { from: owner })
    await federatedAttestations.initialize()
    await registry.setAddressFor(CeloContractName.Attestations, mockAttestations.address)
    await registry.setAddressFor(
      CeloContractName.FederatedAttestations,
      federatedAttestations.address
    )
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const actualOwner: string = await escrow.owner()
      assert.equal(actualOwner, owner)
    })

    it('should not be callable again', async () => {
      await assertRevert(escrow.initialize())
    })
  })

  describe('#addDefaultTrustedIssuer', () => {
    it('allows owner to add trustedIssuer', async () => {
      assert.deepEqual(await escrow.getDefaultTrustedIssuers(), [])
      await escrow.addDefaultTrustedIssuer(trustedIssuer1, { from: owner })
      assert.deepEqual(await escrow.getDefaultTrustedIssuers(), [trustedIssuer1])
    })

    it('reverts if non-owner attempts to add trustedIssuer', async () => {
      await assertRevert(escrow.addDefaultTrustedIssuer(trustedIssuer1, { from: trustedIssuer1 }))
    })

    it('should emit the DefaultTrustedIssuerAdded event', async () => {
      const receipt = await escrow.addDefaultTrustedIssuer(trustedIssuer1, { from: owner })
      assertLogMatches2(receipt.logs[0], {
        event: 'DefaultTrustedIssuerAdded',
        args: {
          trustedIssuer: trustedIssuer1,
        },
      })
    })

    it('should not allow an empty address to be set as a trustedIssuer', async () => {
      await assertRevertWithReason(
        escrow.addDefaultTrustedIssuer(NULL_ADDRESS, { from: owner }),
        "trustedIssuer can't be null"
      )
    })

    it('should not allow a trustedIssuer to be added twice', async () => {
      await escrow.addDefaultTrustedIssuer(trustedIssuer1, { from: owner })
      await assertRevertWithReason(
        escrow.addDefaultTrustedIssuer(trustedIssuer1, { from: owner }),
        'trustedIssuer already in defaultTrustedIssuers'
      )
    })

    describe('when max trusted issuers have been added', async () => {
      let expectedTrustedIssuers: string[]

      beforeEach(async () => {
        const maxTrustedIssuers = (await escrow.MAX_TRUSTED_ISSUERS_PER_PAYMENT()).toNumber()
        expectedTrustedIssuers = []
        for (let i = 0; i < maxTrustedIssuers; i++) {
          const newIssuer = await web3.eth.accounts.create().address
          await escrow.addDefaultTrustedIssuer(newIssuer, { from: owner })
          expectedTrustedIssuers.push(newIssuer)
        }
      })

      it('should have set expected default trusted issuers', async () => {
        assert.deepEqual(await escrow.getDefaultTrustedIssuers(), expectedTrustedIssuers)
      })

      it('should not allow more trusted issuers to be added', async () => {
        await assertRevertWithReason(
          escrow.addDefaultTrustedIssuer(trustedIssuer1, { from: owner }),
          "defaultTrustedIssuers.length can't exceed allowed number of trustedIssuers"
        )
      })

      it('should allow removing and adding an issuer', async () => {
        await escrow.removeDefaultTrustedIssuer(expectedTrustedIssuers[0], 0, { from: owner })
        await escrow.addDefaultTrustedIssuer(trustedIssuer1)
        expectedTrustedIssuers.push(trustedIssuer1)
        assert.deepEqual(
          (await escrow.getDefaultTrustedIssuers()).sort(),
          expectedTrustedIssuers.slice(1).sort()
        )
      })
    })
  })

  describe('#removeDefaultTrustedIssuer', () => {
    beforeEach(async () => {
      await escrow.addDefaultTrustedIssuer(trustedIssuer1, { from: owner })
    })

    it('allows owner to remove trustedIssuer', async () => {
      assert.deepEqual(await escrow.getDefaultTrustedIssuers(), [trustedIssuer1])
      await escrow.removeDefaultTrustedIssuer(trustedIssuer1, 0, { from: owner })
      assert.deepEqual(await escrow.getDefaultTrustedIssuers(), [])
    })

    it('reverts if non-owner attempts to remove trustedIssuer', async () => {
      await assertRevert(
        escrow.removeDefaultTrustedIssuer(trustedIssuer1, 0, { from: trustedIssuer1 })
      )
    })

    it('should emit the DefaultTrustedIssuerRemoved event', async () => {
      const receipt = await escrow.removeDefaultTrustedIssuer(trustedIssuer1, 0, { from: owner })
      assertLogMatches2(receipt.logs[0], {
        event: 'DefaultTrustedIssuerRemoved',
        args: {
          trustedIssuer: trustedIssuer1,
        },
      })
    })

    it('should revert if index is invalid', async () => {
      await assertRevertWithReason(
        escrow.removeDefaultTrustedIssuer(trustedIssuer1, 1, { from: owner }),
        'index is invalid'
      )
    })

    it('should revert if trusted issuer does not match index', async () => {
      await assertRevertWithReason(
        escrow.removeDefaultTrustedIssuer(trustedIssuer2, 0, { from: owner }),
        'trustedIssuer does not match address found at defaultTrustedIssuers[index]'
      )
    })

    it('allows owner to remove trustedIssuer when two are present', async () => {
      await escrow.addDefaultTrustedIssuer(trustedIssuer2, { from: owner })
      assert.deepEqual(await escrow.getDefaultTrustedIssuers(), [trustedIssuer1, trustedIssuer2])
      await escrow.removeDefaultTrustedIssuer(trustedIssuer1, 0, { from: owner })
      assert.deepEqual(await escrow.getDefaultTrustedIssuers(), [trustedIssuer2])
    })
  })

  describe('tests with tokens', () => {
    let mockERC20Token: MockERC20TokenInstance

    beforeEach(async () => {
      mockERC20Token = await MockERC20Token.new()
    })

    const mintAndTransfer = async (
      escrowSender: string,
      identifier: string,
      value: number,
      expirySeconds: number,
      paymentId: string,
      minAttestations: number,
      trustedIssuers: string[]
    ) => {
      await mockERC20Token.mint(escrowSender, value)
      await escrow.transferWithTrustedIssuers(
        identifier,
        mockERC20Token.address,
        value,
        expirySeconds,
        paymentId,
        minAttestations,
        trustedIssuers,
        {
          from: escrowSender,
        }
      )
    }

    describe('#transferWithTrustedIssuers', async () => {
      const transferAndCheckState = async (
        escrowSender: string,
        identifier: string,
        value: number,
        expirySeconds: number,
        paymentId: string,
        minAttestations: number,
        trustedIssuers: string[],
        expectedSentPaymentIds: string[],
        expectedReceivedPaymentIds: string[]
      ) => {
        const startingEscrowContractBalance: BN = web3.utils.toBN(
          await mockERC20Token.balanceOf(escrow.address)
        )
        const startingSenderBalance: BN = web3.utils.toBN(
          await mockERC20Token.balanceOf(escrowSender)
        )

        await await escrow.transferWithTrustedIssuers(
          identifier,
          mockERC20Token.address,
          value,
          expirySeconds,
          paymentId,
          minAttestations,
          trustedIssuers,
          { from: escrowSender }
        )
        const escrowedPayment = await getEscrowedPayment(paymentId, escrow)
        assertEqualBN(
          escrowedPayment.value,
          value,
          'incorrect escrowedPayment.value in payment struct'
        )
        assertEqualBN(
          await mockERC20Token.balanceOf(escrowSender),
          startingSenderBalance.subn(value),
          'incorrect final sender balance'
        )
        assertEqualBN(
          await mockERC20Token.balanceOf(escrow.address),
          startingEscrowContractBalance.addn(value),
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

        const trustedIssuersPerPayment = await escrow.getTrustedIssuersPerPayment(paymentId)
        assert.deepEqual(
          trustedIssuersPerPayment,
          trustedIssuers,
          'unexpected trustedIssuersPerPayment'
        )
      }

      beforeEach(async () => {
        await mockERC20Token.mint(sender, aValue)
      })

      it('should allow users to transfer tokens to any user', async () => {
        await transferAndCheckState(
          sender,
          aPhoneHash,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          0,
          [],
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
          [],
          [withdrawKeyAddress],
          [withdrawKeyAddress]
        )
      })

      it('should allow transfer when trustedIssuers are provided', async () => {
        await transferAndCheckState(
          sender,
          aPhoneHash,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          3,
          testTrustedIssuers,
          [withdrawKeyAddress],
          [withdrawKeyAddress]
        )
      })

      it('should allow transfer when max trustedIssuers are provided', async () => {
        const repeatedTrustedIssuers = Array.from<string>({
          length: (await escrow.MAX_TRUSTED_ISSUERS_PER_PAYMENT()).toNumber(),
        }).fill(trustedIssuer1)
        await transferAndCheckState(
          sender,
          aPhoneHash,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          3,
          repeatedTrustedIssuers,
          [withdrawKeyAddress],
          [withdrawKeyAddress]
        )
      })

      it('should allow transfer when no identifier is provided', async () => {
        await transferAndCheckState(
          sender,
          NULL_BYTES32,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          0,
          [],
          [withdrawKeyAddress],
          [withdrawKeyAddress]
        )
      })

      it('should allow transfers from same sender with different paymentIds', async () => {
        await mintAndTransfer(
          sender,
          NULL_BYTES32,
          aValue,
          oneDayInSecs,
          anotherWithdrawKeyAddress,
          0,
          []
        )
        await transferAndCheckState(
          sender,
          NULL_BYTES32,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          0,
          [],
          [anotherWithdrawKeyAddress, withdrawKeyAddress],
          [anotherWithdrawKeyAddress, withdrawKeyAddress]
        )
      })

      it('should emit the Transfer event', async () => {
        const receipt = await escrow.transferWithTrustedIssuers(
          aPhoneHash,
          mockERC20Token.address,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          2,
          [],
          {
            from: sender,
          }
        )
        assertLogMatches2(receipt.logs[0], {
          event: 'Transfer',
          args: {
            from: sender,
            identifier: aPhoneHash,
            token: mockERC20Token.address,
            value: aValue,
            paymentId: withdrawKeyAddress,
            minAttestations: 2,
          },
        })
      })

      it('should emit the TrustedIssuersSet event', async () => {
        const receipt = await escrow.transferWithTrustedIssuers(
          aPhoneHash,
          mockERC20Token.address,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          2,
          testTrustedIssuers,
          {
            from: sender,
          }
        )
        assertLogMatches2(receipt.logs[1], {
          event: 'TrustedIssuersSet',
          args: {
            paymentId: withdrawKeyAddress,
            trustedIssuers: testTrustedIssuers,
          },
        })
      })

      it('should not allow two transfers with same paymentId', async () => {
        await escrow.transferWithTrustedIssuers(
          aPhoneHash,
          mockERC20Token.address,
          aValue,
          oneDayInSecs,
          withdrawKeyAddress,
          0,
          [],
          {
            from: sender,
          }
        )
        await assertRevertWithReason(
          escrow.transferWithTrustedIssuers(
            aPhoneHash,
            mockERC20Token.address,
            aValue,
            oneDayInSecs,
            withdrawKeyAddress,
            0,
            [],
            {
              from: sender,
            }
          ),
          'paymentId already used'
        )
      })

      it('should not allow a transfer when too many trustedIssuers are provided', async () => {
        const repeatedTrustedIssuers = Array.from<string>({
          length: (await escrow.MAX_TRUSTED_ISSUERS_PER_PAYMENT()).toNumber() + 1,
        }).fill(trustedIssuer1)
        await assertRevertWithReason(
          escrow.transferWithTrustedIssuers(
            aPhoneHash,
            mockERC20Token.address,
            aValue,
            oneDayInSecs,
            withdrawKeyAddress,
            3,
            repeatedTrustedIssuers,
            { from: sender }
          ),
          'Too many trustedIssuers provided'
        )
      })

      it('should not allow a transfer if token is 0', async () => {
        await assertRevert(
          escrow.transferWithTrustedIssuers(
            aPhoneHash,
            NULL_ADDRESS,
            aValue,
            oneDayInSecs,
            withdrawKeyAddress,
            0,
            [],
            {
              from: sender,
            }
          )
        )
      })

      it('should not allow a transfer if value is 0', async () => {
        await assertRevert(
          escrow.transferWithTrustedIssuers(
            aPhoneHash,
            mockERC20Token.address,
            0,
            oneDayInSecs,
            withdrawKeyAddress,
            0,
            [],
            {
              from: sender,
            }
          )
        )
      })

      it('should not allow a transfer if expirySeconds is 0', async () => {
        await assertRevert(
          escrow.transferWithTrustedIssuers(
            aPhoneHash,
            mockERC20Token.address,
            aValue,
            0,
            withdrawKeyAddress,
            0,
            [],
            {
              from: sender,
            }
          )
        )
      })

      it('should not allow a transfer if identifier is empty but minAttestations is > 0', async () => {
        await assertRevertWithReason(
          escrow.transferWithTrustedIssuers(
            NULL_BYTES32,
            mockERC20Token.address,
            aValue,
            oneDayInSecs,
            withdrawKeyAddress,
            1,
            [],
            {
              from: sender,
            }
          ),
          "Invalid privacy inputs: Can't require attestations if no identifier"
        )
      })

      it('should not allow a transfer if identifier is empty but trustedIssuers are provided', async () => {
        await assertRevertWithReason(
          escrow.transferWithTrustedIssuers(
            NULL_BYTES32,
            mockERC20Token.address,
            aValue,
            oneDayInSecs,
            withdrawKeyAddress,
            0,
            testTrustedIssuers,
            {
              from: sender,
            }
          ),
          'trustedIssuers may only be set when attestations are required'
        )
      })

      it('should not allow setting trustedIssuers without minAttestations', async () => {
        await assertRevertWithReason(
          escrow.transferWithTrustedIssuers(
            aPhoneHash,
            mockERC20Token.address,
            aValue,
            oneDayInSecs,
            withdrawKeyAddress,
            0,
            testTrustedIssuers,
            {
              from: sender,
            }
          ),
          'trustedIssuers may only be set when attestations are required'
        )
      })

      it('should revert if transfer value exceeds balance', async () => {
        await assertRevert(
          escrow.transferWithTrustedIssuers(
            aPhoneHash,
            mockERC20Token.address,
            aValue + 1,
            oneDayInSecs,
            withdrawKeyAddress,
            2,
            [],
            {
              from: sender,
            }
          )
        )
      })

      describe('#transfer', () => {
        // transfer and transferWithTrustedIssuers both rely on _transfer
        // and transfer is a restricted version of transferWithTrustedIssuers
        describe('when no defaut trustedIssuers are set', async () => {
          it('should set trustedIssuersPerPaymentId to empty list', async () => {
            await escrow.transfer(
              aPhoneHash,
              mockERC20Token.address,
              aValue,
              oneDayInSecs,
              withdrawKeyAddress,
              2,
              {
                from: sender,
              }
            )
            const actualTrustedIssuers = await escrow.getTrustedIssuersPerPayment(
              withdrawKeyAddress
            )
            assert.deepEqual(actualTrustedIssuers, [])
          })
        })

        describe('when default trustedIssuers are set', async () => {
          beforeEach(async () => {
            await escrow.addDefaultTrustedIssuer(trustedIssuer1, { from: owner })
            await escrow.addDefaultTrustedIssuer(trustedIssuer2, { from: owner })
          })

          it('should set trustedIssuersPerPaymentId to default when minAttestations>0', async () => {
            await escrow.transfer(
              aPhoneHash,
              mockERC20Token.address,
              aValue,
              oneDayInSecs,
              withdrawKeyAddress,
              2,
              {
                from: sender,
              }
            )
            const actualTrustedIssuers = await escrow.getTrustedIssuersPerPayment(
              withdrawKeyAddress
            )
            assert.deepEqual(actualTrustedIssuers, [trustedIssuer1, trustedIssuer2])
          })

          it('should set trustedIssuersPerPaymentId to empty list when minAttestations==0', async () => {
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
            const actualTrustedIssuers = await escrow.getTrustedIssuersPerPayment(
              withdrawKeyAddress
            )
            assert.deepEqual(actualTrustedIssuers, [])
          })
        })
      })
    })

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
      assertObjectWithBNEqual(
        deletedEscrowedPayment,
        NULL_ESCROWED_PAYMENT,
        (field) => `escrowedPayment not zeroed out for field: ${field}`
      )
      const trustedIssuersPerPayment = await escrow.getTrustedIssuersPerPayment(deletedPaymentId)
      assert.deepEqual(trustedIssuersPerPayment, [], 'trustedIssuersPerPayment not zeroed out')
    }

    describe('#withdraw', () => {
      const uniquePaymentIDWithdraw = withdrawKeyAddress

      const completeAttestations = async (
        account: string,
        identifier: string,
        attestationsToComplete: number
      ) => {
        // Mock completed attestations
        for (let i = 0; i < attestationsToComplete; i++) {
          await mockAttestations.complete(identifier, 0, NULL_BYTES32, NULL_BYTES32, {
            from: account,
          })
        }
      }

      const withdrawAndCheckState = async (
        escrowSender: string,
        escrowReceiver: string,
        identifier: string,
        paymentId: string,
        expectedSentPaymentIds: string[],
        expectedReceivedPaymentIds: string[]
      ) => {
        const receiverBalanceBefore: BN = web3.utils.toBN(
          await mockERC20Token.balanceOf(escrowReceiver)
        )
        const escrowContractBalanceBefore: BN = web3.utils.toBN(
          await mockERC20Token.balanceOf(escrow.address)
        )
        const paymentBefore = await getEscrowedPayment(paymentId, escrow)
        const parsedSig = await getParsedSignatureOfAddress(web3, escrowReceiver, paymentId)
        await escrow.withdraw(paymentId, parsedSig.v, parsedSig.r, parsedSig.s, {
          from: escrowReceiver,
        })
        assertEqualBN(
          await mockERC20Token.balanceOf(escrowReceiver),
          receiverBalanceBefore.add(paymentBefore.value),
          'incorrect final receiver balance'
        )
        assertEqualBN(
          await mockERC20Token.balanceOf(escrow.address),
          escrowContractBalanceBefore.sub(paymentBefore.value),
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
          await mintAndTransfer(
            sender,
            NULL_BYTES32,
            aValue,
            oneDayInSecs,
            uniquePaymentIDWithdraw,
            0,
            []
          )
        })

        it('should allow withdrawal with possession of PK and no attestations', async () => {
          await withdrawAndCheckState(
            sender,
            receiver,
            NULL_BYTES32,
            uniquePaymentIDWithdraw,
            [],
            []
          )
        })

        it('should emit the TrustedIssuersUnset event', async () => {
          const parsedSig = await getParsedSignatureOfAddress(
            web3,
            receiver,
            uniquePaymentIDWithdraw
          )
          const receipt = await escrow.withdraw(
            uniquePaymentIDWithdraw,
            parsedSig.v,
            parsedSig.r,
            parsedSig.s,
            { from: receiver }
          )
          assertLogMatches2(receipt.logs[0], {
            event: 'TrustedIssuersUnset',
            args: {
              paymentId: uniquePaymentIDWithdraw,
            },
          })
        })

        it('should emit the Withdrawal event', async () => {
          const parsedSig = await getParsedSignatureOfAddress(
            web3,
            receiver,
            uniquePaymentIDWithdraw
          )
          const receipt = await escrow.withdraw(
            uniquePaymentIDWithdraw,
            parsedSig.v,
            parsedSig.r,
            parsedSig.s,
            { from: receiver }
          )
          assertLogMatches2(receipt.logs[1], {
            event: 'Withdrawal',
            args: {
              identifier: NULL_BYTES32,
              to: receiver,
              token: mockERC20Token.address,
              value: aValue,
              paymentId: uniquePaymentIDWithdraw,
            },
          })
        })

        it('should withdraw properly when second payment escrowed with empty identifier', async () => {
          await mintAndTransfer(
            sender,
            NULL_BYTES32,
            aValue,
            oneDayInSecs,
            anotherWithdrawKeyAddress,
            0,
            []
          )
          await withdrawAndCheckState(
            sender,
            receiver,
            NULL_BYTES32,
            uniquePaymentIDWithdraw,
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
            3,
            []
          )
          await withdrawAndCheckState(
            sender,
            receiver,
            NULL_BYTES32,
            uniquePaymentIDWithdraw,
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

      describe('when first payment is escrowed by a sender for identifier && minAttestations', () => {
        const minAttestations = 3
        beforeEach(async () => {
          await mintAndTransfer(
            sender,
            aPhoneHash,
            aValue,
            oneDayInSecs,
            uniquePaymentIDWithdraw,
            minAttestations,
            []
          )
        })

        it('should allow users to withdraw after completing attestations', async () => {
          await completeAttestations(receiver, aPhoneHash, minAttestations)
          await withdrawAndCheckState(sender, receiver, aPhoneHash, uniquePaymentIDWithdraw, [], [])
        })
        it('should not allow a user to withdraw a payment if they have fewer than minAttestations', async () => {
          await completeAttestations(receiver, aPhoneHash, minAttestations - 1)
          await assertRevertWithReason(
            withdrawAndCheckState(sender, receiver, aPhoneHash, uniquePaymentIDWithdraw, [], []),
            'This account does not have the required attestations to withdraw this payment.'
          )
        })
        it("should withdraw properly when sender's second payment has an identifier", async () => {
          await mintAndTransfer(
            sender,
            aPhoneHash,
            aValue,
            oneDayInSecs,
            anotherWithdrawKeyAddress,
            0,
            []
          )
          await completeAttestations(receiver, aPhoneHash, minAttestations)
          await withdrawAndCheckState(
            sender,
            receiver,
            aPhoneHash,
            uniquePaymentIDWithdraw,
            [anotherWithdrawKeyAddress],
            [anotherWithdrawKeyAddress]
          )
        })
      })

      describe('when trustedIssuers are set for payment', () => {
        describe('when Attestations.sol is a trustedIssuer', () => {
          const minAttestations = 3
          beforeEach(async () => {
            await mintAndTransfer(
              sender,
              aPhoneHash,
              aValue,
              oneDayInSecs,
              uniquePaymentIDWithdraw,
              minAttestations,
              [mockAttestations.address, trustedIssuer1, trustedIssuer2]
            )
          })

          it('should allow withdraw after completing attestations', async () => {
            await completeAttestations(receiver, aPhoneHash, minAttestations)
            await withdrawAndCheckState(
              sender,
              receiver,
              aPhoneHash,
              uniquePaymentIDWithdraw,
              [],
              []
            )
          })
          describe('when <minAttestations have been completed', () => {
            it('should not allow withdrawal if no attestations exist in FederatedAttestations', async () => {
              await completeAttestations(receiver, aPhoneHash, minAttestations - 1)
              await assertRevertWithReason(
                withdrawAndCheckState(
                  sender,
                  receiver,
                  aPhoneHash,
                  uniquePaymentIDWithdraw,
                  [],
                  []
                ),
                'This account does not have the required attestations to withdraw this payment.'
              )
            })
            it('should allow users to withdraw if attestation is found in FederatedAttestations', async () => {
              await completeAttestations(receiver, aPhoneHash, minAttestations - 1)
              await federatedAttestations.registerAttestationAsIssuer(aPhoneHash, receiver, 0, {
                from: trustedIssuer2,
              })
              await withdrawAndCheckState(
                sender,
                receiver,
                aPhoneHash,
                uniquePaymentIDWithdraw,
                [],
                []
              )
            })
          })
        })
        describe('when Attestations.sol is not a trusted issuer', () => {
          beforeEach(async () => {
            await mintAndTransfer(
              sender,
              aPhoneHash,
              aValue,
              oneDayInSecs,
              uniquePaymentIDWithdraw,
              2,
              testTrustedIssuers
            )
          })
          it('should allow users to withdraw if attestation is found in FederatedAttestations', async () => {
            await federatedAttestations.registerAttestationAsIssuer(aPhoneHash, receiver, 0, {
              from: trustedIssuer2,
            })
            await withdrawAndCheckState(
              sender,
              receiver,
              aPhoneHash,
              uniquePaymentIDWithdraw,
              [],
              []
            )
          })
          it('should not allow a user to withdraw a payment if no attestations exist for trustedIssuers', async () => {
            await assertRevertWithReason(
              withdrawAndCheckState(sender, receiver, aPhoneHash, uniquePaymentIDWithdraw, [], []),
              'This account does not have the required attestations to withdraw this payment.'
            )
          })
        })
      })
    })

    describe('#revoke', () => {
      let uniquePaymentIDRevoke: string
      let parsedSig1: any

      interface TransferParams {
        identifier: string
        minAttestations: number
        trustedIssuers: string[]
      }

      const transferParams: TransferParams[] = [
        { identifier: NULL_BYTES32, minAttestations: 0, trustedIssuers: [] },
        { identifier: aPhoneHash, minAttestations: 0, trustedIssuers: [] },
        { identifier: aPhoneHash, minAttestations: 1, trustedIssuers: testTrustedIssuers },
      ]

      transferParams.forEach(({ identifier, trustedIssuers, minAttestations }) => {
        describe(`when identifier is ${
          identifier === NULL_BYTES32 ? '' : 'not '
        }empty, trustedIssuers.length=${
          trustedIssuers.length
        }, and minAttestations=${minAttestations}`, async () => {
          beforeEach(async () => {
            await mintAndTransfer(
              sender,
              identifier,
              aValue,
              oneDayInSecs,
              withdrawKeyAddress,
              minAttestations,
              trustedIssuers
            )
            await mintAndTransfer(
              sender,
              identifier,
              aValue,
              oneDayInSecs,
              anotherWithdrawKeyAddress,
              minAttestations,
              trustedIssuers
            )

            uniquePaymentIDRevoke = withdrawKeyAddress
            parsedSig1 = await getParsedSignatureOfAddress(web3, receiver, withdrawKeyAddress)
            if (trustedIssuers.length) {
              await federatedAttestations.registerAttestationAsIssuer(identifier, receiver, 0, {
                from: trustedIssuers[0],
              })
            }
          })

          it('should allow sender to redeem payment after payment has expired', async () => {
            await timeTravel(oneDayInSecs, web3)

            const senderBalanceBefore: BN = web3.utils.BN(await mockERC20Token.balanceOf(sender))
            const escrowContractBalanceBefore: BN = web3.utils.BN(
              await mockERC20Token.balanceOf(escrow.address)
            )
            const paymentBefore = await getEscrowedPayment(uniquePaymentIDRevoke, escrow)

            await escrow.revoke(uniquePaymentIDRevoke, { from: sender })

            assertEqualBN(
              await mockERC20Token.balanceOf(sender),
              senderBalanceBefore.addn(aValue),
              'incorrect final sender balance'
            )
            assertEqualBN(
              await mockERC20Token.balanceOf(escrow.address),
              escrowContractBalanceBefore.subn(aValue),
              'incorrect final Escrow contract balance'
            )

            await checkStateAfterDeletingPayment(
              uniquePaymentIDRevoke,
              paymentBefore,
              sender,
              identifier,
              [anotherWithdrawKeyAddress],
              [anotherWithdrawKeyAddress]
            )
          })

          it('should emit the TrustedIssuersUnset event', async () => {
            await timeTravel(oneDayInSecs, web3)
            const receipt = await escrow.revoke(uniquePaymentIDRevoke, { from: sender })
            assertLogMatches2(receipt.logs[0], {
              event: 'TrustedIssuersUnset',
              args: {
                paymentId: withdrawKeyAddress,
              },
            })
          })

          it('should emit the Revocation event', async () => {
            await timeTravel(oneDayInSecs, web3)
            const receipt = await escrow.revoke(uniquePaymentIDRevoke, { from: sender })
            assertLogMatches2(receipt.logs[1], {
              event: 'Revocation',
              args: {
                identifier,
                by: sender,
                token: mockERC20Token.address,
                value: aValue,
                paymentId: withdrawKeyAddress,
              },
            })
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
            await assertRevertWithReason(
              escrow.revoke(uniquePaymentIDRevoke, { from: sender }),
              'Transaction not redeemable for sender yet.'
            )
          })

          it('should not allow receiver to use revoke function', async () => {
            await timeTravel(oneDayInSecs, web3)
            await assertRevertWithReason(
              escrow.revoke(uniquePaymentIDRevoke, { from: receiver }),
              'Only sender of payment can attempt to revoke payment.'
            )
          })
        })
      })
    })
  })
})
