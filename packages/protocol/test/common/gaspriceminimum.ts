import {
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  GasPriceMinimumContract,
  GasPriceMinimumInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const Registry: RegistryContract = artifacts.require('Registry')
const GasPriceMinimum: GasPriceMinimumContract = artifacts.require('GasPriceMinimum')

// @ts-ignore
// TODO(mcortesi): Use BN
GasPriceMinimum.numberFormat = 'BigNumber'

contract('GasPriceMinimum', (accounts: string[]) => {
  let gasPriceMinimum: GasPriceMinimumInstance
  let registry: RegistryInstance
  const nonOwner = accounts[1]
  const gasPriceMinimumFloor = new BigNumber(100)
  const initialGasPriceMinimum = gasPriceMinimumFloor
  const targetDensity = toFixed(1 / 2)
  const adjustmentSpeed = toFixed(1 / 2)

  beforeEach(async () => {
    registry = await Registry.new()
    gasPriceMinimum = await GasPriceMinimum.new()

    await gasPriceMinimum.initialize(
      registry.address,
      gasPriceMinimumFloor,
      targetDensity,
      adjustmentSpeed
    )
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await gasPriceMinimum.owner()
      assert.equal(owner, accounts[0])
    })

    it('should set the gas price minimum', async () => {
      const actualGasPriceMinimum = await gasPriceMinimum.getGasPriceMinimum(NULL_ADDRESS)
      assertEqualBN(actualGasPriceMinimum, initialGasPriceMinimum)
    })

    it('should set the target density', async () => {
      const actualTargetDensity = await gasPriceMinimum.targetDensity()
      assertEqualBN(actualTargetDensity, targetDensity)
    })

    it('should set the adjustment speed', async () => {
      const actualAdjustmentSpeed = await gasPriceMinimum.adjustmentSpeed()
      assertEqualBN(actualAdjustmentSpeed, adjustmentSpeed)
    })

    it('should set the gas price minimum floor', async () => {
      const actualGasPriceMinimumFloor = await gasPriceMinimum.gasPriceMinimumFloor()
      assertEqualBN(actualGasPriceMinimumFloor, gasPriceMinimumFloor)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        gasPriceMinimum.initialize(
          registry.address,
          gasPriceMinimumFloor,
          targetDensity,
          adjustmentSpeed
        )
      )
    })
  })

  describe('#setAdjustmentSpeed', () => {
    const newAdjustmentSpeed = toFixed(1 / 3)

    it('should set the adjustment speed', async () => {
      await gasPriceMinimum.setAdjustmentSpeed(newAdjustmentSpeed)
      const actualAdjustmentSpeed = await gasPriceMinimum.adjustmentSpeed()
      assertEqualBN(actualAdjustmentSpeed, newAdjustmentSpeed)
    })

    it('should emit the AdjustmentSpeedSet event', async () => {
      const resp = await gasPriceMinimum.setAdjustmentSpeed(newAdjustmentSpeed)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'AdjustmentSpeedSet',
        args: {
          adjustmentSpeed: newAdjustmentSpeed,
        },
      })
    })

    it('should revert when the provided fraction is greater than one', async () => {
      await assertRevert(gasPriceMinimum.setAdjustmentSpeed(toFixed(3 / 2)))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(gasPriceMinimum.setAdjustmentSpeed(newAdjustmentSpeed, { from: nonOwner }))
    })
  })

  describe('#setTargetDensity', () => {
    const newTargetDensity = toFixed(1 / 3)

    it('should set the adjustment speed', async () => {
      await gasPriceMinimum.setTargetDensity(newTargetDensity)
      const actualTargetDensity = await gasPriceMinimum.targetDensity()
      assertEqualBN(actualTargetDensity, newTargetDensity)
    })

    it('should emit the TargetDensitySet event', async () => {
      const resp = await gasPriceMinimum.setTargetDensity(newTargetDensity)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'TargetDensitySet',
        args: {
          targetDensity: newTargetDensity,
        },
      })
    })

    it('should revert when the provided fraction is greater than one', async () => {
      await assertRevert(gasPriceMinimum.setTargetDensity(toFixed(3 / 2)))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        gasPriceMinimum.setTargetDensity(newTargetDensity, {
          from: nonOwner,
        })
      )
    })
  })

  describe('#setGasPriceMinimumFloor', () => {
    const newGasPriceMinFloor = new BigNumber(150)

    it('should set the minimum gas price floor', async () => {
      await gasPriceMinimum.setGasPriceMinimumFloor(newGasPriceMinFloor)
      const actualFloor = await gasPriceMinimum.gasPriceMinimumFloor()
      assertEqualBN(actualFloor, newGasPriceMinFloor)
    })

    it('should emit the MinimumGasPriceFloorSet event', async () => {
      const resp = await gasPriceMinimum.setGasPriceMinimumFloor(newGasPriceMinFloor)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'GasPriceMinimumFloorSet',
        args: {
          gasPriceMinimumFloor: newGasPriceMinFloor,
        },
      })
    })

    it('should revert when the provided floor is zero', async () => {
      await assertRevert(gasPriceMinimum.setGasPriceMinimumFloor(0))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        gasPriceMinimum.setGasPriceMinimumFloor(newGasPriceMinFloor, {
          from: nonOwner,
        })
      )
    })
  })

  describe('#getUpdatedGasPriceMinimum', () => {
    describe('when the block is full', () => {
      it('should return 25% more than the initial minimum and should not be limited by the gas price minimum floor as a whole', async () => {
        const currentGasPriceMinimum = await gasPriceMinimum.gasPriceMinimum()
        await gasPriceMinimum.setGasPriceMinimumFloor(currentGasPriceMinimum)
        const actualUpdatedGasPriceMinimum = await gasPriceMinimum.getUpdatedGasPriceMinimum(1, 1)
        const expectedUpdatedGasPriceMinimum = currentGasPriceMinimum
          .times(5)
          .div(4)
          .plus(1)
        assertEqualBN(actualUpdatedGasPriceMinimum, expectedUpdatedGasPriceMinimum)
      })
    })

    describe('when the block is empty', () => {
      it('should return 25% less than the initial minimum, but be limited by the gas price minimum floor if new gas price lies below minimum', async () => {
        const currentGasPriceMinimum = await gasPriceMinimum.gasPriceMinimum()
        await gasPriceMinimum.setGasPriceMinimumFloor(currentGasPriceMinimum)
        const actualUpdatedGasPriceMinimum = await gasPriceMinimum.getUpdatedGasPriceMinimum(0, 1)
        const expectedCappedUpdatedGasPriceMinimum = await gasPriceMinimum.gasPriceMinimumFloor()
        assertEqualBN(actualUpdatedGasPriceMinimum, expectedCappedUpdatedGasPriceMinimum)
      })

      it('should return 25% less than the initial minimum, but not be limited by the gas price minimum floor if new gas price lies above minimum', async () => {
        const currentGasPriceMinimum = await gasPriceMinimum.gasPriceMinimum()
        await gasPriceMinimum.setGasPriceMinimumFloor(1)
        const actualUpdatedGasPriceMinimum = await gasPriceMinimum.getUpdatedGasPriceMinimum(0, 1)
        const expectedUpdatedGasPriceMinimum = currentGasPriceMinimum
          .times(3)
          .div(4)
          .plus(1)
        assertEqualBN(actualUpdatedGasPriceMinimum, expectedUpdatedGasPriceMinimum)
      })
    })

    describe('when the fullness of the block is random', () => {
      const getUpdatedGasPriceMinimum = (
        gasPriceMinFloor,
        previousGasPriceMinimum,
        density,
        _targetDensity,
        _adjustmentSpeed
      ) => {
        const one = new BigNumber(1)
        const newGasPriceMinimum = previousGasPriceMinimum
          .times(
            one.plus(
              fromFixed(_adjustmentSpeed).times(fromFixed(density).minus(fromFixed(_targetDensity)))
            )
          )
          .plus(one)
          .integerValue(BigNumber.ROUND_DOWN)

        return newGasPriceMinimum.lt(gasPriceMinFloor) ? gasPriceMinFloor : newGasPriceMinimum
      }

      it('should return an updated gas price minimum that matches a typescript implementation', async () => {
        const numIterations = 100
        const currentGasPriceMinimum = await gasPriceMinimum.gasPriceMinimum()
        const gasPriceMinFloor = currentGasPriceMinimum
        await gasPriceMinimum.setGasPriceMinimumFloor(gasPriceMinFloor)

        for (let i = 0; i < numIterations; i++) {
          const curGas = await gasPriceMinimum.gasPriceMinimum()

          const blockGasLimit = new BigNumber(web3.utils.randomHex(4))
          const gasUsed = BigNumber.random()
            .times(blockGasLimit)
            .integerValue()
          const actualUpdatedGasPriceMinimum = await gasPriceMinimum.getUpdatedGasPriceMinimum(
            gasUsed,
            blockGasLimit
          )

          const expectedUpdatedGasPriceMinimum = getUpdatedGasPriceMinimum(
            gasPriceMinFloor,
            curGas,
            toFixed(gasUsed.div(blockGasLimit)),
            targetDensity,
            adjustmentSpeed
          )

          assertEqualBN(actualUpdatedGasPriceMinimum, expectedUpdatedGasPriceMinimum)
        }
      })
    })
  })
})
