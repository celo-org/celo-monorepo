import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertContainSubset, assertRevert, jsonRpc } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
  TestDowntimeSlasherIntervalsContract,
  TestDowntimeSlasherIntervalsInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const DowntimeSlasherIntervals: TestDowntimeSlasherIntervalsContract = artifacts.require(
  'TestDowntimeSlasherIntervals'
)
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
DowntimeSlasherIntervals.numberFormat = 'BigNumber'

// Epoch 1 starts in block 1
const firstBlockFromEpoch = (epoch: number, epochSize: number) => (epoch - 1) * epochSize + 1

contract('DowntimeSlasherIntervals', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: MockValidatorsInstance
  let registry: RegistryInstance
  let mockLockedGold: MockLockedGoldInstance
  let slasher: TestDowntimeSlasherIntervalsInstance
  let epochSize: number

  const nonOwner = accounts[1]
  const validatorList = [accounts[2], accounts[3], accounts[4]]
  const groups = [accounts[0], accounts[1]]

  const slashingPenalty = 10000
  const slashingReward = 100
  const slashableDowntime = 12
  const intervalSize = 4

  async function presetParentSealForBlocks(
    fromBlock: number,
    numberOfBlocks: number,
    bitmaps: string[]
  ) {
    const startEpoch = (await slasher.getEpochNumberOfBlock(fromBlock)).toNumber()
    const nextEpochStart = firstBlockFromEpoch(startEpoch + 1, epochSize)
    for (let i = fromBlock; i < fromBlock + numberOfBlocks; i++) {
      await slasher.setParentSealBitmap(i + 1, i < nextEpochStart ? bitmaps[0] : bitmaps[1])
    }
  }

  async function calculateEverySlot(
    startBlock: number
  ): Promise<{ startBlocks: number[]; endBlocks: number[] }> {
    const startBlocks: number[] = []
    const endBlocks: number[] = []
    const actualSlashableDowntime = (await slasher.slashableDowntime()).toNumber()

    const startEpoch = (await slasher.getEpochNumberOfBlock(startBlock)).toNumber()
    const nextEpochStart = firstBlockFromEpoch(startEpoch, epochSize)
    const endBlock = startBlock + actualSlashableDowntime - 1
    for (let i = startBlock; i <= endBlock; ) {
      let endBlockForSlot = i + intervalSize - 1
      endBlockForSlot = endBlockForSlot > endBlock ? endBlock : endBlockForSlot

      // Avoids crossing the epoch
      endBlockForSlot =
        endBlockForSlot >= nextEpochStart && i < nextEpochStart
          ? nextEpochStart - 1
          : endBlockForSlot
      startBlocks.push(i)
      endBlocks.push(endBlockForSlot)
      await slasher.setBitmapForInterval(i, endBlockForSlot)
      i = endBlockForSlot + 1
    }

    return { startBlocks, endBlocks }
  }

  async function generateProofs(startBlocks: number[], endBlocks: number[]) {
    for (let i = 0; i < startBlocks.length; i += 1) {
      await slasher.setBitmapForInterval(startBlocks[i], endBlocks[i])
    }
  }

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    await Promise.all(accounts.map((account) => accountsInstance.createAccount({ from: account })))
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new()
    validators = await MockValidators.new()
    slasher = await DowntimeSlasherIntervals.new()
    epochSize = (await slasher.getEpochSize()).toNumber()
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, validators.address)
    await validators.affiliate(groups[0], { from: validatorList[0] })
    await validators.affiliate(groups[0], { from: validatorList[1] })
    await validators.affiliate(groups[1], { from: validatorList[2] })
    await slasher.initialize(registry.address, slashingPenalty, slashingReward, slashableDowntime)
    await Promise.all(
      accounts.map((account) => mockLockedGold.setAccountTotalLockedGold(account, 50000))
    )
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await slasher.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set slashing incentives', async () => {
      const res = await slasher.slashingIncentives()
      assert.equal(res[0].toNumber(), 10000)
      assert.equal(res[1].toNumber(), 100)
    })

    it('should have set slashable downtime', async () => {
      const res = await slasher.slashableDowntime()
      assert.equal(res.toNumber(), slashableDowntime)
    })

    it('can only be called once', async () => {
      await assertRevert(slasher.initialize(registry.address, 10000, 100, 2))
    })
  })

  describe('#setSlashingIncentives()', () => {
    it('can only be set by the owner', async () => {
      await assertRevert(slasher.setSlashingIncentives(123, 67, { from: nonOwner }))
    })

    it('should have set slashing incentives', async () => {
      await slasher.setSlashingIncentives(123, 67)
      const res = await slasher.slashingIncentives()
      assert.equal(res[0].toNumber(), 123)
      assert.equal(res[1].toNumber(), 67)
    })

    it('reward cannot be larger than penalty', async () => {
      await assertRevert(slasher.setSlashingIncentives(123, 678))
    })

    it('should emit the corresponding event', async () => {
      const resp = await slasher.setSlashingIncentives(123, 67)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'SlashingIncentivesSet',
        args: {
          penalty: new BigNumber(123),
          reward: new BigNumber(67),
        },
      })
    })
  })

  describe('#setSlashableDowntime()', () => {
    it('can only be set by the owner', async () => {
      await assertRevert(slasher.setSlashableDowntime(23, { from: nonOwner }))
    })

    it('slashable downtime has to be smaller than epoch length', async () => {
      await assertRevert(slasher.setSlashableDowntime(epochSize))
    })

    it('should have set slashable downtime', async () => {
      await slasher.setSlashableDowntime(23)
      const res = await slasher.slashableDowntime()
      assert.equal(res.toNumber(), 23)
    })

    it('should emit the corresponding event', async () => {
      const resp = await slasher.setSlashableDowntime(23)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'SlashableDowntimeSet',
        args: {
          interval: new BigNumber(23),
        },
      })
    })
  })

  describe('#slash()', () => {
    let epoch: number

    // Signed by validators 0 and 1
    const bitmapVI01 = '0x0000000000000000000000000000000000000000000000000000000000000003'
    // Signed by validator 1
    const bitmapVI1 = '0x0000000000000000000000000000000000000000000000000000000000000002'
    // Signed by validator 0
    const bitmapVI0 = '0x0000000000000000000000000000000000000000000000000000000000000001'
    // Signed by validator 99
    const bitmapVI99 = '0x0000000000000000000000000000000000000008000000000000000000000000'
    const validatorIndexInEpoch: number = 0
    const bitmapWithoutValidator: string[] = [bitmapVI1, bitmapVI0]

    async function ensureValidatorIsSlashable(
      startBlock: number,
      validatorIndices: number[]
    ): Promise<{ startBlocks: number[]; endBlocks: number[] }> {
      const bitmapMasks = validatorIndices.map((vi) => bitmapWithoutValidator[vi])
      await presetParentSealForBlocks(startBlock, slashableDowntime, bitmapMasks)
      // Signs the outer limits to be 100% secure that the boundaries are well tested
      await presetParentSealForBlocks(startBlock - 1, 1, [bitmapVI01])
      await presetParentSealForBlocks(startBlock + slashableDowntime, 1, [bitmapVI01])

      return calculateEverySlot(startBlock)
    }

    // This function will wait until the middle of a new epoch is reached.
    // We consider blocks are "safe" if the test could perform a slash, without
    // the context of the other tests.
    // This property ensures that each test has an epoch to work with (not depends
    // on previous tests), and there are enough blocks on that epoch to have a validator
    // down for a possible slash.
    async function waitUntilSafeBlocks(safeEpoch: number) {
      let blockNumber: number = 0
      const blockStableBetweenTests = firstBlockFromEpoch(safeEpoch, epochSize) - 1
      do {
        blockNumber = await web3.eth.getBlockNumber()
        await jsonRpc(web3, 'evm_mine', [])
      } while (
        blockNumber < blockStableBetweenTests ||
        // Middle of the epoch
        blockNumber % epochSize <= epochSize * 0.5
      )
    }

    before(async () => {
      epoch = (await slasher.getEpochNumberOfBlock(await web3.eth.getBlockNumber())).toNumber()
    })

    beforeEach(async () => {
      await waitUntilSafeBlocks(epoch)
      await slasher.setNumberValidators(2)
    })

    afterEach(async () => {
      const newEpoch = (
        await slasher.getEpochNumberOfBlock(await web3.eth.getBlockNumber())
      ).toNumber()

      // Optimization to make the testing batch run faster.
      // This "recovers" a gap of more that 1 epoch, and avoids waiting more than an epoch
      // between tests.
      if (newEpoch === epoch) {
        epoch += 1
      } else {
        epoch = newEpoch
      }
    })

    it('fails if the slash window has the currentBlock as part of the interval', async () => {
      await slasher.setEpochSigner(epoch, validatorIndexInEpoch, validatorList[0])
      const actualBlockNumber = await web3.eth.getBlockNumber()
      const startBlock = actualBlockNumber - 3
      await assertRevert(
        slasher.slash(
          [startBlock, startBlock + intervalSize],
          [startBlock + intervalSize - 1, startBlock + 2 * intervalSize - 1],
          [validatorIndexInEpoch],
          0,
          [],
          [],
          [],
          [],
          [],
          []
        )
      )
    })

    describe('slashable interval in the same epoch', async () => {
      beforeEach(async () => {
        await slasher.setEpochSigner(epoch, validatorIndexInEpoch, validatorList[0])
      })

      // Test boundaries
      it('fails if the first block was signed', async () => {
        const startBlock = firstBlockFromEpoch(epoch, epochSize)

        // Set the parentSeal bitmaps for every block without the validator's signature
        await presetParentSealForBlocks(startBlock + 1, slashableDowntime - 1, [
          bitmapWithoutValidator[validatorIndexInEpoch],
        ])

        // First block with every validator signatures
        await presetParentSealForBlocks(startBlock, 1, [bitmapVI01])
        const slotArrays = await calculateEverySlot(startBlock)
        await assertRevert(
          slasher.slash(
            slotArrays.startBlocks,
            slotArrays.endBlocks,
            [validatorIndexInEpoch],
            0,
            [],
            [],
            [],
            [],
            [],
            []
          ),
          'not down'
        )
      })

      it('fails if the last block was signed', async () => {
        const startBlock = firstBlockFromEpoch(epoch, epochSize)

        // Set the parentSeal bitmaps for every block without the validator's signature
        await presetParentSealForBlocks(startBlock, slashableDowntime - 1, [
          bitmapWithoutValidator[validatorIndexInEpoch],
        ])

        // Last block with every validator signatures
        await presetParentSealForBlocks(startBlock + slashableDowntime - 1, 1, [bitmapVI01])
        const slotArrays = await calculateEverySlot(startBlock)
        await assertRevert(
          slasher.slash(
            slotArrays.startBlocks,
            slotArrays.endBlocks,
            [validatorIndexInEpoch],
            0,
            [],
            [],
            [],
            [],
            [],
            []
          ),
          'not down'
        )
      })

      it('fails if one block in the middle was signed', async () => {
        const startBlock = firstBlockFromEpoch(epoch, epochSize)

        // Set the parentSeal bitmaps for every block without the validator's signature
        await presetParentSealForBlocks(startBlock, slashableDowntime, [
          bitmapWithoutValidator[validatorIndexInEpoch],
        ])

        // Middle block with every validator signatures
        await presetParentSealForBlocks(startBlock + intervalSize, 1, [bitmapVI01])
        const slotArrays = await calculateEverySlot(startBlock)
        await assertRevert(
          slasher.slash(
            slotArrays.startBlocks,
            slotArrays.endBlocks,
            [validatorIndexInEpoch],
            0,
            [],
            [],
            [],
            [],
            [],
            []
          ),
          'not down'
        )
      })

      it('fails if the first block was signed using a big index', async () => {
        await slasher.setNumberValidators(100)
        await slasher.setEpochSigner(epoch, 99, validatorList[2])
        const startBlock = firstBlockFromEpoch(epoch, epochSize)

        // Set the parentSeal bitmaps for every block without the validator's signature
        await presetParentSealForBlocks(startBlock + 1, slashableDowntime - 1, [bitmapVI0])

        // First block with every validator signatures
        await presetParentSealForBlocks(startBlock, 1, [bitmapVI99])
        const slotArrays = await calculateEverySlot(startBlock)
        await assertRevert(
          slasher.slash(
            slotArrays.startBlocks,
            slotArrays.endBlocks,
            [99],
            0,
            [],
            [],
            [],
            [],
            [],
            []
          ),
          'not down'
        )
      })

      describe('when the validator was down', () => {
        let startBlock: number

        beforeEach(async () => {
          startBlock = firstBlockFromEpoch(epoch, epochSize)
          await presetParentSealForBlocks(startBlock, slashableDowntime, [
            bitmapWithoutValidator[validatorIndexInEpoch],
          ])
        })

        describe('when the intervals cover the SlashableDowntime window', () => {
          it('succeeds if intervals overlap', async () => {
            const startBlocks = [startBlock, startBlock + 2]
            const endBlocks = [
              startBlock + slashableDowntime - 3,
              startBlock + slashableDowntime - 1,
            ]
            await generateProofs(startBlocks, endBlocks)
            await slasher.slash(
              startBlocks,
              endBlocks,
              [validatorIndexInEpoch],
              0,
              [],
              [],
              [],
              [],
              [],
              []
            )
            const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
            assert.equal(balance.toNumber(), 40000)
          })

          it('succeeds if intervals cover more than the SlashableDowntime window', async () => {
            const startBlocks = [startBlock, startBlock + intervalSize]
            const endBlocks = [startBlock + intervalSize - 1, startBlock + slashableDowntime + 3]

            for (let i = 0; i < startBlocks.length; i += 1) {
              await presetParentSealForBlocks(startBlocks[i], endBlocks[i] - startBlocks[i] + 1, [
                bitmapWithoutValidator[validatorIndexInEpoch],
              ])
            }
            await generateProofs(startBlocks, endBlocks)
            await slasher.slash(
              startBlocks,
              endBlocks,
              [validatorIndexInEpoch],
              0,
              [],
              [],
              [],
              [],
              [],
              []
            )
            const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
            assert.equal(balance.toNumber(), 40000)
          })

          it('fails if intervals are not contiguous', async () => {
            // The slashableDowntime is covered with interval(0) and interval(2), but
            // interval(1) breaks the interval contiguity.
            const startBlocks = [
              startBlock,
              startBlock + intervalSize * 2,
              startBlock + intervalSize,
            ]
            const endBlocks = [
              startBlocks[0] + intervalSize - 1,
              startBlocks[1] + intervalSize - 1,
              startBlock + slashableDowntime - 1,
            ]

            for (let i = 0; i < startBlocks.length; i += 1) {
              await presetParentSealForBlocks(startBlocks[i], endBlocks[i] - startBlocks[i] + 1, [
                bitmapWithoutValidator[validatorIndexInEpoch],
              ])
            }
            await generateProofs(startBlocks, endBlocks)
            await assertRevert(
              slasher.slash(
                startBlocks,
                endBlocks,
                [validatorIndexInEpoch],
                0,
                [],
                [],
                [],
                [],
                [],
                []
              ),
              'at least one endBlock is not in the boundaries of the next interval'
            )
          })
        })

        it("fails if the intervals don't cover the SlashableDowntime window", async () => {
          const startBlocks = [startBlock, startBlock + intervalSize]
          const endBlocks = [
            startBlocks[0] + intervalSize - 1,
            startBlocks[1] + intervalSize - 1,
            startBlock + slashableDowntime - 1,
          ]
          for (let i = 0; i < startBlocks.length; i += 1) {
            await presetParentSealForBlocks(startBlocks[i], endBlocks[i] - startBlocks[i] + 1, [
              bitmapWithoutValidator[validatorIndexInEpoch],
            ])
          }
          await generateProofs(startBlocks, endBlocks)
          await assertRevert(
            slasher.slash(
              startBlocks,
              endBlocks,
              [validatorIndexInEpoch],
              0,
              [],
              [],
              [],
              [],
              [],
              []
            ),
            'the intervals are not covering the slashableDowntime window'
          )
        })
      })

      describe('when slashing succeeds', () => {
        let resp: Truffle.TransactionResponse
        let startBlock: number

        beforeEach(async () => {
          startBlock = firstBlockFromEpoch(epoch, epochSize)
          const slotArrays = await ensureValidatorIsSlashable(startBlock, [validatorIndexInEpoch])
          resp = await slasher.slash(
            slotArrays.startBlocks,
            slotArrays.endBlocks,
            [validatorIndexInEpoch],
            0,
            [],
            [],
            [],
            [],
            [],
            []
          )
        })

        it('should emit the corresponding event', async () => {
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'DowntimeSlashPerformed',
            args: {
              validator: validatorList[0],
              startBlock: new BigNumber(startBlock),
            },
          })
        })

        it('decrements gold', async () => {
          const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
          assert.equal(balance.toNumber(), 40000)
        })

        it('also slashes group', async () => {
          const balance = await mockLockedGold.accountTotalLockedGold(groups[0])
          assert.equal(balance.toNumber(), 40000)
        })

        it('cannot be slashed twice in the same epoch', async () => {
          // Just to make sure that the validator was slashed
          const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
          assert.equal(balance.toNumber(), 40000)
          const newStartBlock = startBlock + slashableDowntime * 2
          const slotArrays = await ensureValidatorIsSlashable(newStartBlock, [
            validatorIndexInEpoch,
            validatorIndexInEpoch,
          ])
          await assertRevert(
            slasher.slash(
              slotArrays.startBlocks,
              slotArrays.endBlocks,
              [validatorIndexInEpoch],
              0,
              [],
              [],
              [],
              [],
              [],
              []
            ),
            'already slashed in that epoch'
          )
        })
      })
    })

    describe('slashable interval crossing epochs', async () => {
      let startBlock: number

      // Wait another epoch, to avoid "same epoch slashes" restriction
      beforeEach(async () => {
        epoch = epoch + 1
        await waitUntilSafeBlocks(epoch)
        await slasher.setEpochSigner(epoch, validatorIndexInEpoch, validatorList[0])
        startBlock = firstBlockFromEpoch(epoch, epochSize) - intervalSize
        await slasher.setEpochSigner(epoch, validatorIndexInEpoch, validatorList[0])
      })

      describe('when the last block was signed', () => {
        it("fails if it didn't switched indices", async () => {
          await slasher.setEpochSigner(epoch - 1, validatorIndexInEpoch, validatorList[0])
          // Set the parentSeal bitmaps for every block without the validator's signature
          await presetParentSealForBlocks(startBlock, slashableDowntime - 1, [
            bitmapWithoutValidator[validatorIndexInEpoch],
            bitmapWithoutValidator[validatorIndexInEpoch],
          ])
          // Last block with every validator signatures
          await presetParentSealForBlocks(startBlock + slashableDowntime - 1, 1, [bitmapVI01])
          const slotArrays = await calculateEverySlot(startBlock)
          await assertRevert(
            slasher.slash(
              slotArrays.startBlocks,
              slotArrays.endBlocks,
              [validatorIndexInEpoch, validatorIndexInEpoch],
              0,
              [],
              [],
              [],
              [],
              [],
              []
            ),
            'not down'
          )
        })

        it('fails if it switched indices', async () => {
          await slasher.setEpochSigner(epoch - 1, 1, validatorList[0])

          // All the blocks, changes the bitmap in the middle
          await presetParentSealForBlocks(startBlock, slashableDowntime - 1, [
            bitmapWithoutValidator[1],
            bitmapWithoutValidator[validatorIndexInEpoch],
          ])

          // Last block with every validator signatures
          await presetParentSealForBlocks(startBlock + slashableDowntime - 1, 1, [bitmapVI01])
          const slotArrays = await calculateEverySlot(startBlock)
          await assertRevert(
            slasher.slash(
              slotArrays.startBlocks,
              slotArrays.endBlocks,
              [1, validatorIndexInEpoch],
              0,
              [],
              [],
              [],
              [],
              [],
              []
            ),
            'not down'
          )
        })
      })

      describe('when the validator was down', () => {
        it('succeeds with validator index change', async () => {
          await slasher.setEpochSigner(epoch - 1, 1, validatorList[0])
          const slotArrays = await ensureValidatorIsSlashable(startBlock, [
            1,
            validatorIndexInEpoch,
          ])
          await slasher.slash(
            slotArrays.startBlocks,
            slotArrays.endBlocks,
            [1, validatorIndexInEpoch],
            0,
            [],
            [],
            [],
            [],
            [],
            []
          )
          const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
          assert.equal(balance.toNumber(), 40000)
        })

        it('succeeds without validator index change', async () => {
          await slasher.setEpochSigner(epoch - 1, validatorIndexInEpoch, validatorList[0])
          const slotArrays = await ensureValidatorIsSlashable(startBlock, [
            validatorIndexInEpoch,
            validatorIndexInEpoch,
          ])

          await slasher.slash(
            slotArrays.startBlocks,
            slotArrays.endBlocks,
            [validatorIndexInEpoch, validatorIndexInEpoch],
            0,
            [],
            [],
            [],
            [],
            [],
            []
          )
          const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
          assert.equal(balance.toNumber(), 40000)
        })

        it("fails if the indices don't match the same validator", async () => {
          await slasher.setEpochSigner(epoch - 1, 1, validatorList[0])
          await slasher.setEpochSigner(epoch, 1, validatorList[1])
          const slotArrays = await ensureValidatorIsSlashable(startBlock, [
            1,
            validatorIndexInEpoch,
          ])
          await assertRevert(
            slasher.slash(
              slotArrays.startBlocks,
              slotArrays.endBlocks,
              [1, 1],
              0,
              [],
              [],
              [],
              [],
              [],
              []
            ),
            'indices do not point to the same validator'
          )
        })
      })

      describe('when slashing succeeds', () => {
        beforeEach(async () => {
          await slasher.setEpochSigner(epoch - 1, validatorIndexInEpoch, validatorList[0])
          const slotArrays = await ensureValidatorIsSlashable(startBlock, [
            validatorIndexInEpoch,
            validatorIndexInEpoch,
          ])
          await slasher.slash(
            slotArrays.startBlocks,
            slotArrays.endBlocks,
            [validatorIndexInEpoch, validatorIndexInEpoch],
            0,
            [],
            [],
            [],
            [],
            [],
            []
          )
        })

        it('cannot be slashed twice if the slash shares at least a block with a previous slash of another epoch', async () => {
          // Beginning of epoch + 1 (shares blocks with the cross epoch) to avoid trying to generate the same intervals
          const newStartBlock = firstBlockFromEpoch(epoch, epochSize) + 1

          // Just to make sure that is was slashed
          const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
          assert.equal(balance.toNumber(), 40000)
          const slotArrays = await ensureValidatorIsSlashable(newStartBlock, [
            validatorIndexInEpoch,
          ])
          await assertRevert(
            slasher.slash(
              slotArrays.startBlocks,
              slotArrays.endBlocks,
              [validatorIndexInEpoch],
              0,
              [],
              [],
              [],
              [],
              [],
              []
            ),
            'slash shares blocks with another slash'
          )
        })
      })
    })
  })
})
