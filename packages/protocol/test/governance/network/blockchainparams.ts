import {
  assertContainSubset,
  assertEqualBN,
  assertRevert,
  assertTransactionRevertWithReason,
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
  const gasLimit = 7000000
  const gasForNonGoldCurrencies = 50000

  beforeEach(async () => {
    blockchainParameters = await BlockchainParameters.new()
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
      await assertTransactionRevertWithReason(
        blockchainParameters.setBlockGasLimit(gasLimit, {
          from: accounts[1],
        }),
        'Ownable: caller is not the owner'
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
      await assertTransactionRevertWithReason(
        blockchainParameters.setIntrinsicGasForAlternativeFeeCurrency(gasLimit, {
          from: accounts[1],
        }),
        'Ownable: caller is not the owner'
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
      assertTransactionRevertWithReason(
        blockchainParameters.setUptimeLookbackWindow(newValue, {
          from: accounts[1],
        }),
        'Ownable: caller is not the owner'
      ))

    it('should fail when using value lower than safe minimum', () =>
      assertTransactionRevertWithReason(
        blockchainParameters.setUptimeLookbackWindow(2),
        'UptimeLookbackWindow must be within safe range'
      ))

    it('should fail when using value greater than safe maximum', () =>
      assertTransactionRevertWithReason(
        blockchainParameters.setUptimeLookbackWindow(721),
        'UptimeLookbackWindow must be within safe range'
      ))

    it('should fail when using value greater than epochSize - 2', () =>
      assertTransactionRevertWithReason(
        blockchainParameters.setUptimeLookbackWindow(EPOCH - 1),
        'UptimeLookbackWindow must be smaller or equal to epochSize - 2'
      ))
  })

  describe('#initialize()', () => {
    const lookbackWindow = 20

    it('should set the variables', async () => {
      await blockchainParameters.initialize(gasForNonGoldCurrencies, gasLimit, lookbackWindow)
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
        gasForNonGoldCurrencies,
        gasLimit,
        lookbackWindow
      )
      assert.equal(resp.logs.length, 4)
      assertContainSubset(resp.logs[2], {
        event: 'IntrinsicGasForAlternativeFeeCurrencySet',
        args: {
          gas: new BigNumber(gasForNonGoldCurrencies),
        },
      })
      assertContainSubset(resp.logs[1], {
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
      assertContainSubset(resp.logs[3], {
        event: 'UptimeLookbackWindowSet',
        args: {
          window: new BigNumber(lookbackWindow),
        },
      })
    })
  })
})
