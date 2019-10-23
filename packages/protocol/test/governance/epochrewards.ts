import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertContainSubset, assertEqualBN, assertRevert } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  MockElectionContract,
  MockElectionInstance,
  EpochRewardsTestContract,
  EpochRewardsTestInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'
import { toFixed } from '@celo/utils/lib/fixidity'

const EpochRewards: EpochRewardsTestContract = artifacts.require('EpochRewardsTest')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
EpochRewards.numberFormat = 'BigNumber'

contract('EpochRewards', (accounts: string[]) => {
  let epochRewards: EpochRewardsTestInstance
  let mockElection: MockElectionInstance
  let registry: RegistryInstance
  const nonOwner = accounts[1]

  const maxValidatorEpochPayment = new BigNumber(10000000000000)
  const maxTargetVotingYield = toFixed(new BigNumber(1 / 20))
  const initialTargetVotingYield = toFixed(new BigNumber(5 / 100))
  beforeEach(async () => {
    epochRewards = await EpochRewards.new()
    mockElection = await MockElection.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await epochRewards.initialize(
      registry.address,
      maxValidatorEpochPayment,
      maxTargetVotingYield,
      initialTargetVotingYield
    )
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await epochRewards.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set the max validator epoch payment', async () => {
      assertEqualBN(await epochRewards.maxValidatorEpochPayment(), maxValidatorEpochPayment)
    })

    it('should have set the max target voting yield', async () => {
      assertEqualBN(await epochRewards.getMaxTargetVotingYield(), maxTargetVotingYield)
    })

    it('should have set the target voting yield', async () => {
      assertEqualBN(await epochRewards.getTargetVotingYield(), initialTargetVotingYield)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        epochRewards.initialize(
          registry.address,
          maxValidatorEpochPayment,
          maxTargetVotingYield,
          initialTargetVotingYield
        )
      )
    })
  })

  describe('#setMaxValidatorEpochPayment()', () => {
    describe('when the payment is different', () => {
      const newPayment = maxValidatorEpochPayment.plus(1)

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await epochRewards.setMaxValidatorEpochPayment(newPayment)
        })

        it('should set the max validator epoch payment', async () => {
          assertEqualBN(await epochRewards.maxValidatorEpochPayment(), newPayment)
        })

        it('should emit the MaxValidatorEpochPaymentSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'MaxValidatorEpochPaymentSet',
            args: {
              value: new BigNumber(newPayment),
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              epochRewards.setMaxValidatorEpochPayment(newPayment, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the payment is the same', () => {
        it('should revert', async () => {
          await assertRevert(epochRewards.setMaxValidatorEpochPayment(maxValidatorEpochPayment))
        })
      })
    })
  })

  describe('#setMaxTargetVotingYield()', () => {
    describe('when the yield is different', () => {
      const newYield = maxTargetVotingYield.plus(1)

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await epochRewards.setMaxTargetVotingYield(newYield)
        })

        it('should set the max target voting yield', async () => {
          assertEqualBN(await epochRewards.getMaxTargetVotingYield(), newYield)
        })

        it('should emit the MaxTargetVotingYieldSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'MaxTargetVotingYieldSet',
            args: {
              yield: new BigNumber(newYield),
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              epochRewards.setMaxTargetVotingYield(newYield, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the yield is the same', () => {
        it('should revert', async () => {
          await assertRevert(epochRewards.setMaxTargetVotingYield(maxTargetVotingYield))
        })
      })
    })
  })
})
