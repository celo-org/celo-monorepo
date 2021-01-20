import {
  assertContainSubset,
  assertEqualBN,
  assertRevert,
  mineBlocks,
} from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import { BlockchainParametersInstance, BlockchainParametersTestContract } from 'types'

const BlockchainParameters: BlockchainParametersTestContract = artifacts.require(
  'BlockchainParametersTest'
)

// @ts-ignore
// TODO(mcortesi): Use BN
BlockchainParameters.numberFormat = 'BigNumber'

// Hard coded in ganache.
const EPOCH = 100

contract('BlockchainParameters', (accounts: string[]) => {
  let blockchainParameters: BlockchainParametersInstance
  const version = {
    major: 1,
    minor: 8,
    patch: 2,
  }
  const gasLimit = 7000000
  const gasForNonGoldCurrencies = 50000

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

  describe('#getUptimeLookbackWindow()', () => {
    it('should fail if not initalized', async () =>
      assertRevert(blockchainParameters.getUptimeLookbackWindow()))

    it('should fail if initialized, but still on current epoch', async () => {
      await blockchainParameters.setUptimeLookbackWindow(20)
      await assertRevert(blockchainParameters.getUptimeLookbackWindow())
    })
  })

  describe('#setUptimeLookbackWindow()', () => {
    const newValue = 20

    it('should set the value for the next epoch', async () => {
      await blockchainParameters.setUptimeLookbackWindow(newValue)
      // wait an epoch to find new value
      await mineBlocks(EPOCH, web3)
      assert.equal((await blockchainParameters.getUptimeLookbackWindow()).toNumber(), newValue)
    })

    it('multiple calls within epoch only applies last', async () => {
      // make 2 calls
      await blockchainParameters.setUptimeLookbackWindow(newValue)
      await blockchainParameters.setUptimeLookbackWindow(50)

      // after the epoch, find last value set
      await mineBlocks(EPOCH, web3)
      assert.equal((await blockchainParameters.getUptimeLookbackWindow()).toNumber(), 50)
    })

    it('should emit the corresponding event', async () => {
      const resp = await blockchainParameters.setUptimeLookbackWindow(newValue)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'UptimeLookbackWindowSet',
        args: {
          window: new BigNumber(newValue),
        },
      })
    })

    it('only owner should be able to set', () =>
      assertRevert(
        blockchainParameters.setUptimeLookbackWindow(newValue, {
          from: accounts[1],
        })
      ))

    it('should fail when using value lower than safe minimum', () =>
      assertRevert(blockchainParameters.setUptimeLookbackWindow(2)))

    it('should fail when using value greater than safe maximum', () =>
      assertRevert(blockchainParameters.setUptimeLookbackWindow(721)))

    it('should fail when using value greater than epochSize - 2', () =>
      assertRevert(blockchainParameters.setUptimeLookbackWindow(EPOCH - 1)))
  })

  describe('#initialize()', () => {
    const lookbackWindow = 20

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

      // need to wait an epoch for uptimeLookbackWindow
      await mineBlocks(EPOCH, web3)
      assert.equal(
        (await blockchainParameters.getUptimeLookbackWindow()).toNumber(),
        lookbackWindow
      )
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
