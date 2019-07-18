import {
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import {
  GasPriceMinimumContract,
  GasPriceMinimumInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'
import BigNumber from 'bignumber.js'

const Registry: RegistryContract = artifacts.require('Registry')
const GasPriceMinimum: GasPriceMinimumContract = artifacts.require('GasPriceMinimum')

contract('GasPriceMinimum', (accounts: string[]) => {
  let gasPriceMinimum: GasPriceMinimumInstance
  let registry: RegistryInstance
  const nonOwner = accounts[1]
  const initialGasPriceMinimum = new BigNumber(500)
  const targetDensity = { numerator: new BigNumber(1), denominator: new BigNumber(2) }
  const adjustmentSpeed = { numerator: new BigNumber(1), denominator: new BigNumber(2) }
  const infrastructureFraction = { numerator: new BigNumber(1), denominator: new BigNumber(2) }

  beforeEach(async () => {
    registry = await Registry.new()
    gasPriceMinimum = await GasPriceMinimum.new()

    await gasPriceMinimum.initialize(
      registry.address,
      initialGasPriceMinimum,
      targetDensity.numerator,
      targetDensity.denominator,
      adjustmentSpeed.numerator,
      adjustmentSpeed.denominator,
      infrastructureFraction.numerator,
      infrastructureFraction.denominator
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
      assertEqualBN(actualTargetDensity[0], targetDensity.numerator)
      assertEqualBN(actualTargetDensity[1], targetDensity.denominator)
    })

    it('should set the adjustment speed', async () => {
      const actualAdjustmentSpeed = await gasPriceMinimum.adjustmentSpeed()
      assertEqualBN(actualAdjustmentSpeed[0], adjustmentSpeed.numerator)
      assertEqualBN(actualAdjustmentSpeed[1], adjustmentSpeed.denominator)
    })

    it('should set the infrastructure fraction', async () => {
      const actualInfrastructureFraction = await gasPriceMinimum.infrastructureFraction()
      assertEqualBN(actualInfrastructureFraction[0], infrastructureFraction.numerator)
      assertEqualBN(actualInfrastructureFraction[1], infrastructureFraction.denominator)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        gasPriceMinimum.initialize(
          registry.address,
          initialGasPriceMinimum,
          targetDensity.numerator,
          targetDensity.denominator,
          adjustmentSpeed.numerator,
          adjustmentSpeed.denominator,
          infrastructureFraction.numerator,
          infrastructureFraction.denominator
        )
      )
    })
  })

  describe('#setAdjustmentSpeed', () => {
    const newAdjustmentSpeed = { numerator: new BigNumber(1), denominator: new BigNumber(3) }

    it('should set the adjustment speed', async () => {
      await gasPriceMinimum.setAdjustmentSpeed(
        newAdjustmentSpeed.numerator,
        newAdjustmentSpeed.denominator
      )
      const actualAdjustmentSpeed = await gasPriceMinimum.adjustmentSpeed()
      assertEqualBN(actualAdjustmentSpeed[0], newAdjustmentSpeed.numerator)
      assertEqualBN(actualAdjustmentSpeed[1], newAdjustmentSpeed.denominator)
    })

    it('should emit the AdjustmentSpeedSet event', async () => {
      const resp = await gasPriceMinimum.setAdjustmentSpeed(
        newAdjustmentSpeed.numerator,
        newAdjustmentSpeed.denominator
      )
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'AdjustmentSpeedSet',
        args: {
          numerator: newAdjustmentSpeed.numerator,
          denominator: newAdjustmentSpeed.denominator,
        },
      })
    })

    it('should revert when the provided denominator is 0', async () => {
      await assertRevert(gasPriceMinimum.setAdjustmentSpeed(0, 0))
    })

    it('should revert when the provided fraction is greater than one', async () => {
      await assertRevert(gasPriceMinimum.setAdjustmentSpeed(2, 1))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        gasPriceMinimum.setAdjustmentSpeed(
          newAdjustmentSpeed.numerator,
          newAdjustmentSpeed.denominator,
          { from: nonOwner }
        )
      )
    })
  })

  describe('#setTargetDensity', () => {
    const newTargetDensity = { numerator: new BigNumber(1), denominator: new BigNumber(3) }

    it('should set the adjustment speed', async () => {
      await gasPriceMinimum.setTargetDensity(
        newTargetDensity.numerator,
        newTargetDensity.denominator
      )
      const actualTargetDensity = await gasPriceMinimum.targetDensity()
      assertEqualBN(actualTargetDensity[0], newTargetDensity.numerator)
      assertEqualBN(actualTargetDensity[1], newTargetDensity.denominator)
    })

    it('should emit the TargetDensitySet event', async () => {
      const resp = await gasPriceMinimum.setTargetDensity(
        newTargetDensity.numerator,
        newTargetDensity.denominator
      )
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'TargetDensitySet',
        args: {
          numerator: newTargetDensity.numerator,
          denominator: newTargetDensity.denominator,
        },
      })
    })

    it('should revert when the provided denominator is 0', async () => {
      await assertRevert(gasPriceMinimum.setTargetDensity(0, 0))
    })

    it('should revert when the provided fraction is greater than one', async () => {
      await assertRevert(gasPriceMinimum.setTargetDensity(2, 1))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        gasPriceMinimum.setTargetDensity(newTargetDensity.numerator, newTargetDensity.denominator, {
          from: nonOwner,
        })
      )
    })
  })

  describe('#setInfrastructureFraction', () => {
    const newInfrastructureFraction = { numerator: new BigNumber(1), denominator: new BigNumber(3) }

    it('should set the adjustment speed', async () => {
      await gasPriceMinimum.setInfrastructureFraction(
        newInfrastructureFraction.numerator,
        newInfrastructureFraction.denominator
      )
      const actualInfrastructureFraction = await gasPriceMinimum.infrastructureFraction()
      assertEqualBN(actualInfrastructureFraction[0], newInfrastructureFraction.numerator)
      assertEqualBN(actualInfrastructureFraction[1], newInfrastructureFraction.denominator)
    })

    it('should emit the InfrastructureFractionSet event', async () => {
      const resp = await gasPriceMinimum.setInfrastructureFraction(
        newInfrastructureFraction.numerator,
        newInfrastructureFraction.denominator
      )
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'InfrastructureFractionSet',
        args: {
          numerator: newInfrastructureFraction.numerator,
          denominator: newInfrastructureFraction.denominator,
        },
      })
    })

    it('should revert when the provided denominator is 0', async () => {
      await assertRevert(gasPriceMinimum.setInfrastructureFraction(0, 0))
    })

    it('should revert when the provided fraction is greater than one', async () => {
      await assertRevert(gasPriceMinimum.setInfrastructureFraction(2, 1))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        gasPriceMinimum.setInfrastructureFraction(
          newInfrastructureFraction.numerator,
          newInfrastructureFraction.denominator,
          { from: nonOwner }
        )
      )
    })
  })

  describe('#getUpdatedGasPriceMinimum', () => {
    describe('when the block is full', () => {
      it('should return 25% more than the initial minimum', async () => {
        const actualUpdatedGasPriceMinimum = await gasPriceMinimum.getUpdatedGasPriceMinimum(1, 1)
        const expectedUpdatedGasPriceMinimum = initialGasPriceMinimum
          .times(5)
          .div(4)
          .plus(1)
        assertEqualBN(actualUpdatedGasPriceMinimum, expectedUpdatedGasPriceMinimum)
      })
    })

    describe('when the block is empty', () => {
      it('should return 25% less than the initial minimum', async () => {
        const actualUpdatedGasPriceMinimum = await gasPriceMinimum.getUpdatedGasPriceMinimum(0, 1)
        const expectedUpdatedGasPriceMinimum = initialGasPriceMinimum
          .times(3)
          .div(4)
          .plus(1)
        assertEqualBN(actualUpdatedGasPriceMinimum, expectedUpdatedGasPriceMinimum)
      })
    })

    describe('when the fullness of the block is random', () => {
      const getUpdatedGasPriceMinimum = (
        previousGasPriceMinimum,
        densityNumerator,
        densityDenominator,
        targetDensityNumerator,
        targetDensityDenominator,
        adjustmentSpeedNumerator,
        adjustmentSpeedDenominator
      ) => {
        const density = densityNumerator.div(densityDenominator)
        const targetDensity = targetDensityNumerator.div(targetDensityDenominator)
        const adjSpeed = adjustmentSpeedNumerator.div(adjustmentSpeedDenominator)
        const one = new BigNumber(1)
        return previousGasPriceMinimum
          .times(one.plus(adjSpeed.times(density.minus(targetDensity))))
          .plus(one)
          .integerValue(BigNumber.ROUND_DOWN)
      }

      it('should return an updated gas price minimum that matches a typescript implementation', async () => {
        const numIterations = 100
        for (let i = 0; i < numIterations; i++) {
          const blockGasLimit = new BigNumber(web3.utils.randomHex(4))
          const gasUsed = BigNumber.random()
            .times(blockGasLimit)
            .integerValue()
          const actualUpdatedGasPriceMinimum = await gasPriceMinimum.getUpdatedGasPriceMinimum(
            gasUsed,
            blockGasLimit
          )
          const expectedUpdatedGasPriceMinimum = getUpdatedGasPriceMinimum(
            initialGasPriceMinimum,
            gasUsed,
            blockGasLimit,
            targetDensity.numerator,
            targetDensity.denominator,
            adjustmentSpeed.numerator,
            adjustmentSpeed.denominator
          )
          assertEqualBN(actualUpdatedGasPriceMinimum, expectedUpdatedGasPriceMinimum)
        }
      })
    })
  })
})
