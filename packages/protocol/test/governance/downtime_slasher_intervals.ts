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

contract('DowntimeSlasherIntervals', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: MockValidatorsInstance
  let registry: RegistryInstance
  let mockLockedGold: MockLockedGoldInstance
  let slasher: TestDowntimeSlasherIntervalsInstance
  let epochBlockSize: number

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
    const epochStart = (await slasher.getEpochNumberOfBlock(fromBlock)).toNumber()
    // Epoch 1 starts in the block 1
    const blockEpochChange = epochStart * epochBlockSize + 1
    for (let i = fromBlock; i < fromBlock + numberOfBlocks; i++) {
      await slasher.setParentSealBitmap(i + 1, i < blockEpochChange ? bitmaps[0] : bitmaps[1])
    }
  }

  async function calculateEverySlot(
    startBlock: number
  ): Promise<{ startSlots: number[]; endSlots: number[] }> {
    // just in case that a test changes the default
    const startSlots: number[] = []
    const endSlots: number[] = []
    const actualSlashableDowntime = (await slasher.slashableDowntime()).toNumber()

    const epochStart = (await slasher.getEpochNumberOfBlock(startBlock)).toNumber()
    // Epoch 1 starts in the block 1
    const blockEpochChange = (epochStart - 1) * epochBlockSize + 1
    const endBlock = startBlock + actualSlashableDowntime - 1
    for (let i = startBlock; i <= endBlock; ) {
      let endBlockForSlot = i + intervalSize - 1
      endBlockForSlot = endBlockForSlot > endBlock ? endBlock : endBlockForSlot
      // avoids crossing the epoch
      endBlockForSlot =
        endBlockForSlot >= blockEpochChange && i < blockEpochChange
          ? blockEpochChange - 1
          : endBlockForSlot
      startSlots.push(i)
      endSlots.push(endBlockForSlot)
      await slasher.setBitmapForInterval(i, endBlockForSlot)
      i = endBlockForSlot + 1
    }

    return { startSlots, endSlots }
  }

  async function generateProofs(startSlots: number[], endSlots: number[]) {
    for (let i = 0; i < startSlots.length; i += 1) {
      await slasher.setBitmapForInterval(startSlots[i], endSlots[i])
    }
  }

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    await Promise.all(accounts.map((account) => accountsInstance.createAccount({ from: account })))
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new()
    validators = await MockValidators.new()
    slasher = await DowntimeSlasherIntervals.new()
    epochBlockSize = (await slasher.getEpochSize()).toNumber()
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
      await assertRevert(slasher.setSlashableDowntime(epochBlockSize))
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
    // It will put us in a "safe" zone for testing
    let epoch: number

    // Signed by validators 0 and 1
    const bitmapVI01 = '0x0000000000000000000000000000000000000000000000000000000000000003'
    // Signed by validator 1
    const bitmapVI1 = '0x0000000000000000000000000000000000000000000000000000000000000002'
    // Signed by validator 0
    const bitmapVI0 = '0x0000000000000000000000000000000000000000000000000000000000000001'
    const validatorIndexInEpoch: number = 0
    const bitmapWithoutValidator: string[] = [bitmapVI1, bitmapVI0]

    async function makeBlockInfoSlashable(
      startBlock: number,
      validatorIndeces: number[]
    ): Promise<{ startSlots: number[]; endSlots: number[] }> {
      const bitmapMasks = validatorIndeces.map((vi) => bitmapWithoutValidator[vi])
      await presetParentSealForBlocks(startBlock, slashableDowntime, bitmapMasks)
      // Sign the outer limits to be 100% secure that the slots are ok
      await presetParentSealForBlocks(startBlock - 1, 1, [bitmapVI01])
      await presetParentSealForBlocks(startBlock + slashableDowntime, 1, [bitmapVI01])

      return calculateEverySlot(startBlock)
    }

    // this function at the beginnig will wait until a new epoch is reached
    // this way the blocks between the middle of epoch-1 and the middle of epoch
    // will never collide (middle to middle because a lot of tests need the epoch change)
    async function waitUntilSafeBlocks(safeEpoch: number) {
      let blockNumber: number = 0
      // epoch - 1 => to be in the epoch
      const blockStableBetweenTests = (safeEpoch - 1) * epochBlockSize
      do {
        blockNumber = await web3.eth.getBlockNumber()
        await jsonRpc(web3, 'evm_mine', [])
      } while (
        blockNumber < blockStableBetweenTests ||
        // blockNumber % epochBlockSize <= epochBlockSize * 0.5 => middle of the epoch
        blockNumber % epochBlockSize <= epochBlockSize * 0.5
      )
    }

    before(async () => {
      const actualEpoch = (
        await slasher.getEpochNumberOfBlock(await web3.eth.getBlockNumber())
      ).toNumber()
      // epoch 3 it will have "safe" blocks to test
      epoch = actualEpoch > 3 ? actualEpoch : 3
    })

    beforeEach(async () => {
      await waitUntilSafeBlocks(epoch)
      await slasher.setNumberValidators(2)
    })

    afterEach(async () => {
      const newEpoch = (
        await slasher.getEpochNumberOfBlock(await web3.eth.getBlockNumber())
      ).toNumber()
      // this "recovers" a gap of more that 1 epoch, and avoids waiting more than an epoch
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
        const startBlock = (epoch - 1) * epochBlockSize + 1
        // All the other block are good
        await presetParentSealForBlocks(startBlock + 1, slashableDowntime - 1, [
          bitmapWithoutValidator[validatorIndexInEpoch],
        ])
        // first block with everything signed
        await presetParentSealForBlocks(startBlock, 1, [bitmapVI01])
        const slotArrays = await calculateEverySlot(startBlock)
        await assertRevert(
          slasher.slash(
            slotArrays.startSlots,
            slotArrays.endSlots,
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
        const startBlock = (epoch - 1) * epochBlockSize + 1
        // All the other block are good
        await presetParentSealForBlocks(startBlock, slashableDowntime - 1, [
          bitmapWithoutValidator[validatorIndexInEpoch],
        ])
        // last block with everything signed
        await presetParentSealForBlocks(startBlock + slashableDowntime - 1, 1, [bitmapVI01])
        const slotArrays = await calculateEverySlot(startBlock)
        await assertRevert(
          slasher.slash(
            slotArrays.startSlots,
            slotArrays.endSlots,
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
        const startBlock = (epoch - 1) * epochBlockSize + 1

        // All the other block are good
        await presetParentSealForBlocks(startBlock, slashableDowntime, [
          bitmapWithoutValidator[validatorIndexInEpoch],
        ])
        // middle block with everything signed
        await presetParentSealForBlocks(startBlock + intervalSize, 1, [bitmapVI01])
        const slotArrays = await calculateEverySlot(startBlock)
        await assertRevert(
          slasher.slash(
            slotArrays.startSlots,
            slotArrays.endSlots,
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
      describe('when the validator was down', () => {
        let startBlock: number
        beforeEach(async () => {
          startBlock = (epoch - 1) * epochBlockSize + 1
          await presetParentSealForBlocks(startBlock, slashableDowntime, [
            bitmapWithoutValidator[validatorIndexInEpoch],
          ])
        })
        describe('when the slots cover the SlashableDowntime window', () => {
          it('success if slots overlap', async () => {
            const startSlots = [startBlock, startBlock + 2]
            const endSlots = [
              startBlock + slashableDowntime - 3,
              startBlock + slashableDowntime - 1,
            ]
            await generateProofs(startSlots, endSlots)
            await slasher.slash(
              startSlots,
              endSlots,
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
          it('success if slots cover more than the SlashableDowntime window', async () => {
            const startSlots = [startBlock, startBlock + intervalSize]
            const endSlots = [startBlock + intervalSize - 1, startBlock + slashableDowntime + 3]

            for (let i = 0; i < startSlots.length; i += 1) {
              await presetParentSealForBlocks(startSlots[i], endSlots[i] - startSlots[i] + 1, [
                bitmapWithoutValidator[validatorIndexInEpoch],
              ])
            }
            await generateProofs(startSlots, endSlots)
            await slasher.slash(
              startSlots,
              endSlots,
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
          it('fails if endSlot(i) is not between [startSlot(i+1)-1, endSlot(i+1)]', async () => {
            const startSlots = [
              startBlock,
              startBlock + intervalSize * 2,
              startBlock + intervalSize,
            ]
            const endSlots = [
              startSlots[0] + intervalSize - 1,
              startSlots[1] + intervalSize - 1,
              startBlock + slashableDowntime - 1,
            ]
            // the window is covered with slot(0) and slot(2), but it breaks the "chain"

            for (let i = 0; i < startSlots.length; i += 1) {
              await presetParentSealForBlocks(startSlots[i], endSlots[i] - startSlots[i] + 1, [
                bitmapWithoutValidator[validatorIndexInEpoch],
              ])
            }
            await generateProofs(startSlots, endSlots)
            await assertRevert(
              slasher.slash(
                startSlots,
                endSlots,
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
        it("fails if the slots don't cover the SlashableDowntime window", async () => {
          const startSlots = [startBlock, startBlock + intervalSize]
          const endSlots = [
            startSlots[0] + intervalSize - 1,
            startSlots[1] + intervalSize - 1,
            startBlock + slashableDowntime - 1,
          ]
          for (let i = 0; i < startSlots.length; i += 1) {
            await presetParentSealForBlocks(startSlots[i], endSlots[i] - startSlots[i] + 1, [
              bitmapWithoutValidator[validatorIndexInEpoch],
            ])
          }
          await generateProofs(startSlots, endSlots)
          await assertRevert(
            slasher.slash(startSlots, endSlots, [validatorIndexInEpoch], 0, [], [], [], [], [], []),
            'the intervals are not covering the slashableDowntime window'
          )
        })
      })
      describe('when succeds', () => {
        let resp: any
        let startBlock: number
        beforeEach(async () => {
          startBlock = (epoch - 1) * epochBlockSize + 1
          const slotArrays = await makeBlockInfoSlashable(startBlock, [validatorIndexInEpoch])
          resp = await slasher.slash(
            slotArrays.startSlots,
            slotArrays.endSlots,
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

        it('decrements gold when success', async () => {
          const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
          assert.equal(balance.toNumber(), 40000)
        })
        it('also slashes group', async () => {
          const balance = await mockLockedGold.accountTotalLockedGold(groups[0])
          assert.equal(balance.toNumber(), 40000)
        })
        it('cannot be slashed twice in the same epoch', async () => {
          // Just to make sure that is was slashed
          const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
          assert.equal(balance.toNumber(), 40000)
          const newStartBlock = startBlock + slashableDowntime * 2
          const slotArrays = await makeBlockInfoSlashable(newStartBlock, [
            validatorIndexInEpoch,
            validatorIndexInEpoch,
          ])
          await assertRevert(
            slasher.slash(
              slotArrays.startSlots,
              slotArrays.endSlots,
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
        startBlock = (epoch - 1) * epochBlockSize + 1 - intervalSize
        await slasher.setEpochSigner(epoch, validatorIndexInEpoch, validatorList[0])
      })

      describe('when the last block was signed', () => {
        it("fails if it didn't switched indeces", async () => {
          await slasher.setEpochSigner(epoch - 1, validatorIndexInEpoch, validatorList[0])
          // All the other block are good
          await presetParentSealForBlocks(startBlock, slashableDowntime - 1, [
            bitmapWithoutValidator[validatorIndexInEpoch],
            bitmapWithoutValidator[validatorIndexInEpoch],
          ])
          // last block with everything signed
          await presetParentSealForBlocks(startBlock + slashableDowntime - 1, 1, [bitmapVI01])
          const slotArrays = await calculateEverySlot(startBlock)
          await assertRevert(
            slasher.slash(
              slotArrays.startSlots,
              slotArrays.endSlots,
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
        it('fails if it switched indeces', async () => {
          await slasher.setEpochSigner(epoch - 1, 1, validatorList[0])
          // All the blocks, changes the bitmap in the middle
          await presetParentSealForBlocks(startBlock, slashableDowntime - 1, [
            bitmapWithoutValidator[1],
            bitmapWithoutValidator[validatorIndexInEpoch],
          ])
          // last block with everything signed
          await presetParentSealForBlocks(startBlock + slashableDowntime - 1, 1, [bitmapVI01])
          const slotArrays = await calculateEverySlot(startBlock)
          await assertRevert(
            slasher.slash(
              slotArrays.startSlots,
              slotArrays.endSlots,
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
        it('success with validator index change', async () => {
          await slasher.setEpochSigner(epoch - 1, 1, validatorList[0])
          const slotArrays = await makeBlockInfoSlashable(startBlock, [1, validatorIndexInEpoch])
          await slasher.slash(
            slotArrays.startSlots,
            slotArrays.endSlots,
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
        it('success without validator index change', async () => {
          await slasher.setEpochSigner(epoch - 1, validatorIndexInEpoch, validatorList[0])
          const slotArrays = await makeBlockInfoSlashable(startBlock, [
            validatorIndexInEpoch,
            validatorIndexInEpoch,
          ])

          await slasher.slash(
            slotArrays.startSlots,
            slotArrays.endSlots,
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
        it("fails if the indeces don't match the same validator", async () => {
          await slasher.setEpochSigner(epoch - 1, 1, validatorList[0])
          await slasher.setEpochSigner(epoch, 1, validatorList[1])
          const slotArrays = await makeBlockInfoSlashable(startBlock, [1, validatorIndexInEpoch])
          await assertRevert(
            slasher.slash(
              slotArrays.startSlots,
              slotArrays.endSlots,
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
      describe('when succeds', () => {
        beforeEach(async () => {
          await slasher.setEpochSigner(epoch - 1, validatorIndexInEpoch, validatorList[0])
          const slotArrays = await makeBlockInfoSlashable(startBlock, [
            validatorIndexInEpoch,
            validatorIndexInEpoch,
          ])
          await slasher.slash(
            slotArrays.startSlots,
            slotArrays.endSlots,
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
        it('cannot be slashed twice if it shares at least a block', async () => {
          // Beginning of epoch + 1 (shares blocks with the cross epoch). +1 to avoid trying to generate the same intervals
          const newStartBlock = (epoch - 1) * epochBlockSize + 1 + 1

          // Just to make sure that is was slashed
          const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
          assert.equal(balance.toNumber(), 40000)
          const slotArrays = await makeBlockInfoSlashable(newStartBlock, [validatorIndexInEpoch])
          await assertRevert(
            slasher.slash(
              slotArrays.startSlots,
              slotArrays.endSlots,
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
