import { assertContainSubset, assertEqualBN, assertRevert } from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import { BlockchainParametersContract, BlockchainParametersInstance } from 'types'

const BlockchainParameters: BlockchainParametersContract = artifacts.require('BlockchainParameters')

// @ts-ignore
// TODO(mcortesi): Use BN
BlockchainParameters.numberFormat = 'BigNumber'

contract('BlockchainParameters', (accounts: string[]) => {
  let blockchainParameters: BlockchainParametersInstance
  const version = {
    major: 1,
    minor: 8,
    patch: 2,
  }
  const gasLimit = 7000000
  const gasForNonGoldCurrencies = 50000
  const lookbackWindow = 12

  beforeEach(async () => {
    blockchainParameters = await BlockchainParameters.new()
  })

  describe('#setMinimumClientVersion()', () => {
    it('should set the variable', async () => {
      await blockchainParameters.setMinimumClientVersion(
        version.major,
        version.minor,
        version.patch
      )
      const versionQueried = await blockchainParameters.getMinimumClientVersion()
      assert.equal(version.major, versionQueried[0].toNumber())
      assert.equal(version.minor, versionQueried[1].toNumber())
      assert.equal(version.patch, versionQueried[2].toNumber())
    })
    it('should emit the MinimumClientVersionSet event', async () => {
      const resp = await blockchainParameters.setMinimumClientVersion(
        version.major,
        version.minor,
        version.patch
      )
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'MinimumClientVersionSet',
        args: {
          major: new BigNumber(version.major),
          minor: new BigNumber(version.minor),
          patch: new BigNumber(version.patch),
        },
      })
    })
    it('only owner should be able to set', async () => {
      await assertRevert(
        blockchainParameters.setMinimumClientVersion(version.major, version.minor, version.patch, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#setBlockGasLimit()', () => {
    it('should set the variable', async () => {
      await blockchainParameters.setBlockGasLimit(gasLimit)
      assert.equal((await blockchainParameters.blockGasLimit()).toNumber(), gasLimit)
    })
    it('should emit the corresponding event', async () => {
      const resp = await blockchainParameters.setBlockGasLimit(gasLimit)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'BlockGasLimitSet',
        args: {
          limit: new BigNumber(gasLimit),
        },
      })
    })
    it('only owner should be able to set', async () => {
      await assertRevert(
        blockchainParameters.setBlockGasLimit(gasLimit, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#setIntrinsicGasForAlternativeFeeCurrency()', () => {
    it('should set the variable', async () => {
      await blockchainParameters.setIntrinsicGasForAlternativeFeeCurrency(gasForNonGoldCurrencies)
      assertEqualBN(
        gasForNonGoldCurrencies,
        await blockchainParameters.intrinsicGasForAlternativeFeeCurrency()
      )
    })
    it('should emit the corresponding event', async () => {
      const resp = await blockchainParameters.setIntrinsicGasForAlternativeFeeCurrency(
        gasForNonGoldCurrencies
      )
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'IntrinsicGasForAlternativeFeeCurrencySet',
        args: {
          gas: new BigNumber(gasForNonGoldCurrencies),
        },
      })
    })
    it('only owner should be able to set', async () => {
      await assertRevert(
        blockchainParameters.setIntrinsicGasForAlternativeFeeCurrency(gasLimit, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#setUptimeLookbackWindow()', () => {
    it('should set the variable', async () => {
      await blockchainParameters.setUptimeLookbackWindow(lookbackWindow)
      assert.equal((await blockchainParameters.uptimeLookbackWindow()).toNumber(), lookbackWindow)
    })
    it('should emit the corresponding event', async () => {
      const resp = await blockchainParameters.setUptimeLookbackWindow(lookbackWindow)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'UptimeLookbackWindowSet',
        args: {
          window: new BigNumber(lookbackWindow),
        },
      })
    })
    it('only owner should be able to set', async () => {
      await assertRevert(
        blockchainParameters.setUptimeLookbackWindow(lookbackWindow, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#initialize()', () => {
    it('should set the variables', async () => {
      await blockchainParameters.initialize(
        version.major,
        version.minor,
        version.patch,
        gasForNonGoldCurrencies,
        gasLimit,
        lookbackWindow
      )
      const versionQueried = await blockchainParameters.getMinimumClientVersion()
      assert.equal(version.major, versionQueried[0].toNumber())
      assert.equal(version.minor, versionQueried[1].toNumber())
      assert.equal(version.patch, versionQueried[2].toNumber())
      assert.equal((await blockchainParameters.blockGasLimit()).toNumber(), gasLimit)
      assert.equal((await blockchainParameters.uptimeLookbackWindow()).toNumber(), lookbackWindow)
    })
    it('should emit correct events', async () => {
      const resp = await blockchainParameters.initialize(
        version.major,
        version.minor,
        version.patch,
        gasForNonGoldCurrencies,
        gasLimit,
        lookbackWindow
      )
      assert.equal(resp.logs.length, 5)
      assertContainSubset(resp.logs[1], {
        event: 'MinimumClientVersionSet',
        args: {
          major: new BigNumber(version.major),
          minor: new BigNumber(version.minor),
          patch: new BigNumber(version.patch),
        },
      })
      assertContainSubset(resp.logs[3], {
        event: 'IntrinsicGasForAlternativeFeeCurrencySet',
        args: {
          gas: new BigNumber(gasForNonGoldCurrencies),
        },
      })
      assertContainSubset(resp.logs[2], {
        event: 'BlockGasLimitSet',
        args: {
          limit: new BigNumber(gasLimit),
        },
      })
      assertContainSubset(resp.logs[0], {
        event: 'OwnershipTransferred',
        args: {
          previousOwner: accounts[0],
          newOwner: accounts[0],
        },
      })
      assertContainSubset(resp.logs[4], {
        event: 'UptimeLookbackWindowSet',
        args: {
          window: new BigNumber(lookbackWindow),
        },
      })
    })
  })
})
