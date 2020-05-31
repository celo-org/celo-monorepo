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
  TestDowntimeSlasherSlotsContract,
  TestDowntimeSlasherSlotsInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const DowntimeSlasherSlots: TestDowntimeSlasherSlotsContract = artifacts.require(
  'TestDowntimeSlasherSlots'
)
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
DowntimeSlasherSlots.numberFormat = 'BigNumber'

contract('DowntimeSlasherSlots', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: MockValidatorsInstance
  let registry: RegistryInstance
  let mockLockedGold: MockLockedGoldInstance
  let slasher: TestDowntimeSlasherSlotsInstance
  let epochBlockSize: number

  const nonOwner = accounts[1]
  const validatorList = [accounts[2], accounts[3], accounts[4]]
  const groups = [accounts[0], accounts[1]]

  const slashingPenalty = 10000
  const slashingReward = 100
  const slashableDowntime = 12
  const slotSize = 4
  // Defaults to false, otherwise testing it requires to wait for epochs for every test that slashes
  const oncePerEpoch = false

  async function presetParentSealForBlocks(
    fromBlock: number,
    numberOfBlocks: number,
    bitmap: string,
    bitmapIfEpochChanged: string
  ) {
    const epochStart = (await slasher.getEpochNumberOfBlock(fromBlock)).toNumber()
    // Epoch 1 starts in the block 1
    const blockEpochChange = epochStart * epochBlockSize + 1
    for (let i = fromBlock; i < fromBlock + numberOfBlocks; i++) {
      await slasher.setParentSealBitmap(i + 1, i < blockEpochChange ? bitmap : bitmapIfEpochChanged)
    }
  }

  async function calculateEverySlot(
    startBlock: number,
    startSignerIndex: number,
    endSignerIndex: number
  ) {
    // just in case that a test changes the default
    const actualSlotSize = (await slasher.slotSize()).toNumber()
    const actualSlashableDowntime = (await slasher.slashableDowntime()).toNumber()
    const epochStart = (await slasher.getEpochNumberOfBlock(startBlock)).toNumber()
    // Epoch 1 starts in the block 1
    const blockEpochChange = epochStart * epochBlockSize + 1

    for (let i = startBlock; i < startBlock + actualSlashableDowntime; i += actualSlotSize) {
      await slasher.isDownForSlot(
        i,
        i < blockEpochChange ? startSignerIndex : endSignerIndex,
        i + actualSlotSize - 1 < blockEpochChange ? startSignerIndex : endSignerIndex
      )
    }
  }

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    await Promise.all(accounts.map((account) => accountsInstance.createAccount({ from: account })))
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new()
    validators = await MockValidators.new()
    slasher = await DowntimeSlasherSlots.new()
    epochBlockSize = (await slasher.getEpochSize()).toNumber()
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, validators.address)
    await validators.affiliate(groups[0], { from: validatorList[0] })
    await validators.affiliate(groups[0], { from: validatorList[1] })
    await validators.affiliate(groups[1], { from: validatorList[2] })
    await slasher.initialize(
      registry.address,
      slashingPenalty,
      slashingReward,
      slashableDowntime,
      slotSize,
      oncePerEpoch
    )
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
    it('should have set slot size', async () => {
      const res = await slasher.slotSize()
      assert.equal(res.toNumber(), slotSize)
    })
    it('should have set oncePerEpoch flag', async () => {
      const res = await slasher.oncePerEpoch()
      assert.equal(res, oncePerEpoch)
    })
    it('can only be called once', async () => {
      await assertRevert(slasher.initialize(registry.address, 10000, 100, 2, 1, false))
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

  describe('#setSlotSize()', () => {
    it('can only be set by the owner', async () => {
      await assertRevert(slasher.setSlotSize(22, { from: nonOwner }))
    })
    it('slot size has to be smaller than epoch length', async () => {
      await assertRevert(slasher.setSlotSize(epochBlockSize))
    })
    it('should have set the slot size', async () => {
      await slasher.setSlotSize(22)
      const res = await slasher.slotSize()
      assert.equal(res.toNumber(), 22)
    })
    it('should emit the corresponding event', async () => {
      const resp = await slasher.setSlotSize(22)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'SlotSizeSet',
        args: {
          interval: new BigNumber(22),
        },
      })
    })
  })

  describe('#setOncePerEpoch()', () => {
    it('can only be set by the owner', async () => {
      await assertRevert(slasher.setOncePerEpoch(!oncePerEpoch, { from: nonOwner }))
    })
    it('should have set the oncePerEpoch flag', async () => {
      await slasher.setOncePerEpoch(!oncePerEpoch)
      const res = await slasher.oncePerEpoch()
      assert.equal(res, !oncePerEpoch)
    })
    it('should emit the corresponding event', async () => {
      const resp = await slasher.setOncePerEpoch(!oncePerEpoch)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'OncePerEpochSet',
        args: {
          oncePerEpoch: !oncePerEpoch,
        },
      })
    })
  })

  // describe('#isDownForSlot()', () => {
  //   let blockNumber: number
  //   let startBlock: number
  //   let changeBlock: number
  //   const validatorIndex = 0
  //   // Signed by validator indexes 0 and 1
  //   const bitmapVI01 = '0x0000000000000000000000000000000000000000000000000000000000000003'
  //   // Signed by validator index 1
  //   const bitmapVI1 = '0x0000000000000000000000000000000000000000000000000000000000000002'
  //   // Signed by validator index 0
  //   const bitmapVI0 = '0x0000000000000000000000000000000000000000000000000000000000000001'

  //   before(async () => {
  //     let bn: number = 0
  //     do {
  //       bn = await web3.eth.getBlockNumber()
  //       await jsonRpc(web3, 'evm_mine', [])
  //     } while (bn < blocksToWaitForTesting)
  //   })
  //   beforeEach(async () => {
  //     blockNumber = await web3.eth.getBlockNumber()
  //     startBlock = blockNumber - 50
  //     const epoch = (await slasher.getEpochNumberOfBlock(blockNumber)).toNumber()
  //     await slasher.setEpochSigner(epoch, validatorIndex, validator)
  //     await slasher.setEpochSigner(epoch - 1, validatorIndex, validator)
  //     await slasher.setEpochSigner(epoch - 2, 1, validator)
  //     await slasher.setEpochSigner(epoch + 1, validatorIndex, validator)
  //     await slasher.setNumberValidators(2)
  //     // when epoch-2 changes to epoch-1, the validator to be slashed is down, but our signer number changes
  //     // another validator is up around the epoch change
  //     // changeBlock = getFirstBlockNumberForEpoch(epoch - 1) - 3
  //     // async function prepareBlock(bn) {
  //     //   const parentEpoch = (await slasher.getEpochNumberOfBlock(bn - 1)).toNumber()
  //     //   await slasher.setParentSealBitmap(bn, parentEpoch === epoch - 2 ? bitmap3 : bitmap2)
  //     // }
  //     // for (let i = 0; i < 7; i++) {
  //     //   await prepareBlock(changeBlock + i)
  //     // }
  //   })
  // })

  // ***IMPORTANT INFO***
  // As every test, will use Slots, and each Slot is calculated only once and saved
  // to avoid collisions and possible flaky tests, we are assigning each Downtime blocks
  // and the validator of every test, knowing what the other tests will be using.
  // Take this in count for future updates
  describe('#slash()', () => {
    // It will have to reach this epoch to start the tests
    // It will put us in a safe zone for testing
    let epoch: number

    // Signed by validators 0 and 1
    const bitmapVI01 = '0x0000000000000000000000000000000000000000000000000000000000000003'
    // Signed by validator 1
    const bitmapVI1 = '0x0000000000000000000000000000000000000000000000000000000000000002'
    // Signed by validator 0
    const bitmapVI0 = '0x0000000000000000000000000000000000000000000000000000000000000001'
    const validatorIndexInEpoch: number = 0
    const bitmapWithoutValidator: string[] = [bitmapVI1, bitmapVI0]

    async function makeBlockInfoSlashable(startBlock: number, validatorIndexes: number[]) {
      await presetParentSealForBlocks(
        startBlock,
        slashableDowntime,
        bitmapWithoutValidator[validatorIndexes[0]],
        bitmapWithoutValidator[validatorIndexes[1]]
      )
      // Sign the outer limits to be 100% secure that the slots are ok
      await presetParentSealForBlocks(startBlock - 1, 1, bitmapVI01, bitmapVI01)
      await presetParentSealForBlocks(startBlock + slashableDowntime, 1, bitmapVI01, bitmapVI01)
      await calculateEverySlot(startBlock, validatorIndexes[0], validatorIndexes[1])
    }

    // This before will put us in a safe zone for testing
    // before(async () => {
    //   epoch = 3
    //   const blockToBeStableForTesting = epochBlockSize * 2 + slashableDowntime * 3
    //   let blockNumber: number = 0
    //   do {
    //     blockNumber = await web3.eth.getBlockNumber()
    //     await jsonRpc(web3, 'evm_mine', [])
    //   } while (blockNumber < blockToBeStableForTesting)

    //   epoch = (await slasher.getEpochNumberOfBlock(blockNumber)).toNumber()
    // startBlockFromEpoch[2] = epoch * epochBlockSize + 1
    // startBlockFromEpoch[1] = (epoch - 1) * epochBlockSize + 1
    // startBlockFromEpoch[0] = (epoch - 2) * epochBlockSize + 1

    // validatorIndexEpoch[2] = 0
    // validatorIndexEpoch[1] = 0
    // validatorIndexEpoch[0] = 1

    // // SEE IMPORTANT INFO at the beginning of the #slash test group
    // slotAssign = {
    //   inEpoch: {
    //     firstBlockSigned: {
    //       startBlock: startBlockFromEpoch[2] + (blockSpaceBetweenTests + slashableDowntime),
    //       validatorIndexes: [validatorIndexEpoch[2], validatorIndexEpoch[2]],
    //     },
    //     lastBlockSigned: {
    //       startBlock: startBlockFromEpoch[2] + (blockSpaceBetweenTests + slashableDowntime) * 2,
    //       validatorIndexes: [validatorIndexEpoch[2], validatorIndexEpoch[2]],
    //     },
    //     middleBlockSigned: {
    //       startBlock: startBlockFromEpoch[2] + (blockSpaceBetweenTests + slashableDowntime) * 3,
    //       validatorIndexes: [validatorIndexEpoch[2], validatorIndexEpoch[2]],
    //     },
    //     succeds: {
    //       emit: {
    //         startBlock: startBlockFromEpoch[2] + (blockSpaceBetweenTests + slashableDowntime) * 5,
    //         validatorIndexes: [validatorIndexEpoch[2], validatorIndexEpoch[2]],
    //       },
    //       decrementsGold: {
    //         startBlock: startBlockFromEpoch[2] + (blockSpaceBetweenTests + slashableDowntime) * 6,
    //         validatorIndexes: [validatorIndexEpoch[2], validatorIndexEpoch[2]],
    //       },
    //       slashedGroup: {
    //         startBlock: startBlockFromEpoch[2] + (blockSpaceBetweenTests + slashableDowntime) * 7,
    //         validatorIndexes: [validatorIndexEpoch[2], validatorIndexEpoch[2]],
    //       },
    //       // gives two slashableDowntime spaces
    //       slashedTwiceOncePerEpoch: {
    //         startBlock: startBlockFromEpoch[1] + (blockSpaceBetweenTests + slashableDowntime),
    //         validatorIndexes: [validatorIndexEpoch[1], validatorIndexEpoch[1]],
    //       },
    //       slashedTwiceMultiplePerEpoch: {
    //         startBlock: startBlockFromEpoch[1] + (blockSpaceBetweenTests + slashableDowntime) * 3,
    //         validatorIndexes: [validatorIndexEpoch[1], validatorIndexEpoch[1]],
    //       },
    //       slashedTwiceShareBlocks: {
    //         startBlock: startBlockFromEpoch[1] + (blockSpaceBetweenTests + slashableDowntime) * 5,
    //         validatorIndexes: [validatorIndexEpoch[1], validatorIndexEpoch[1]],
    //       },
    //     },
    //   },
    //   crossEpoch: {
    //     indexChange: {
    //       lastBlockSigned: {
    //         startBlock: startBlockFromEpoch[1] - slotSize,
    //         validatorIndexes: [validatorIndexEpoch[0], validatorIndexEpoch[1]],
    //       },
    //       succeds: {
    //         // as the slot don't start in the same blocks, the new slots will have to be calculated
    //         startBlock: startBlockFromEpoch[1] - slotSize - 1,
    //         validatorIndexes: [validatorIndexEpoch[0], validatorIndexEpoch[1]],
    //       },
    //     },
    //     sameIndex: {
    //       succeds: {
    //         startBlock: startBlockFromEpoch[2] - slotSize,
    //         validatorIndexes: [validatorIndexEpoch[1], validatorIndexEpoch[2]],
    //       },
    //       fails: {
    //         startBlock: startBlockFromEpoch[2] - slotSize - 1,
    //         validatorIndexes: [validatorIndexEpoch[1], validatorIndexEpoch[2]],
    //       },
    //     },
    //   },
    // }
    // })

    before(async () => {
      const actualEpoch = (
        await slasher.getEpochNumberOfBlock(await web3.eth.getBlockNumber())
      ).toNumber()
      // epoch 3 it will have "safe" blocks to test
      epoch = actualEpoch > 3 ? actualEpoch : 3
    })
    // this beforeEach at the beginnig will wait until a new epoch is reached
    // this way the blocks between the middle of epoch-1 and the middle of epoch
    // will never collide (middle to middle because a lot of tests need the epoch change)
    beforeEach(async () => {
      let blockNumber: number = 0
      // epoch - 1 => to be in the epoch
      const blockStableBetweenTests = (epoch - 1) * epochBlockSize
      do {
        blockNumber = await web3.eth.getBlockNumber()
        await jsonRpc(web3, 'evm_mine', [])
      } while (
        blockNumber < blockStableBetweenTests ||
        // blockNumber % epochBlockSize <= epochBlockSize * 0.5 => middle of the epoch
        blockNumber % epochBlockSize <= epochBlockSize * 0.5
      )
      await slasher.setEpochSigner(epoch, validatorIndexInEpoch, validatorList[0])
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

    it("fails if the slash window didn't finished yet", async () => {
      const actualBlockNumber = await web3.eth.getBlockNumber()
      await assertRevert(
        slasher.slash(
          actualBlockNumber - 3,
          validatorIndexInEpoch,
          validatorIndexInEpoch,
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
    // Test boundaries
    it('fails if the first block was signed', async () => {
      const startBlock = (epoch - 1) * epochBlockSize + 1
      // All the other block are good
      await presetParentSealForBlocks(
        startBlock + 1,
        slashableDowntime - 1,
        bitmapWithoutValidator[validatorIndexInEpoch],
        bitmapWithoutValidator[validatorIndexInEpoch]
      )
      // first block with everything signed
      await presetParentSealForBlocks(startBlock, 1, bitmapVI01, bitmapVI01)
      await calculateEverySlot(startBlock, validatorIndexInEpoch, validatorIndexInEpoch)
      await assertRevert(
        slasher.slash(
          startBlock,
          validatorIndexInEpoch,
          validatorIndexInEpoch,
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
    describe('when the last block was signed', () => {
      it('fails if it is in the same epoch', async () => {
        const startBlock = (epoch - 1) * epochBlockSize + 1
        // All the other block are good
        await presetParentSealForBlocks(
          startBlock,
          slashableDowntime - 1,
          bitmapWithoutValidator[validatorIndexInEpoch],
          bitmapWithoutValidator[validatorIndexInEpoch]
        )
        // last block with everything signed
        await presetParentSealForBlocks(
          startBlock + slashableDowntime - 1,
          1,
          bitmapVI01,
          bitmapVI01
        )
        await calculateEverySlot(startBlock, validatorIndexInEpoch, validatorIndexInEpoch)
        await assertRevert(
          slasher.slash(
            startBlock,
            validatorIndexInEpoch,
            validatorIndexInEpoch,
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
      it("fails if it didn't switched index and change the epoch", async () => {
        const startBlock = (epoch - 1) * epochBlockSize + 1 - slotSize
        await slasher.setEpochSigner(epoch - 1, validatorIndexInEpoch, validatorList[0])
        // All the other block are good
        await presetParentSealForBlocks(
          startBlock,
          slashableDowntime - 1,
          bitmapWithoutValidator[validatorIndexInEpoch],
          bitmapWithoutValidator[validatorIndexInEpoch]
        )
        // last block with everything signed
        await presetParentSealForBlocks(
          startBlock + slashableDowntime - 1,
          1,
          bitmapVI01,
          bitmapVI01
        )
        await calculateEverySlot(startBlock, validatorIndexInEpoch, validatorIndexInEpoch)
        await assertRevert(
          slasher.slash(
            startBlock,
            validatorIndexInEpoch,
            validatorIndexInEpoch,
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
      it('fails if it switched index', async () => {
        const startBlock = (epoch - 1) * epochBlockSize + 1 - slotSize
        await slasher.setEpochSigner(epoch - 1, 1, validatorList[0])
        // All the blocks, changes the bitmap in the middle
        await presetParentSealForBlocks(
          startBlock,
          slashableDowntime - 1,
          bitmapWithoutValidator[1],
          bitmapWithoutValidator[validatorIndexInEpoch]
        )
        // last block with everything signed
        await presetParentSealForBlocks(
          startBlock + slashableDowntime - 1,
          1,
          bitmapVI01,
          bitmapVI01
        )
        await calculateEverySlot(startBlock, 1, validatorIndexInEpoch)
        await assertRevert(
          slasher.slash(startBlock, 1, validatorIndexInEpoch, 0, [], [], [], [], [], [])
        )
      })
    })
    it('fails if one block in the middle was signed', async () => {
      const startBlock = (epoch - 1) * epochBlockSize + 1

      // All the other block are good
      await presetParentSealForBlocks(
        startBlock,
        slashableDowntime,
        bitmapWithoutValidator[validatorIndexInEpoch],
        bitmapWithoutValidator[validatorIndexInEpoch]
      )
      // middle block with everything signed
      await presetParentSealForBlocks(startBlock + slotSize, 1, bitmapVI01, bitmapVI01)
      await calculateEverySlot(startBlock, validatorIndexInEpoch, validatorIndexInEpoch)
      await assertRevert(
        slasher.slash(
          startBlock,
          validatorIndexInEpoch,
          validatorIndexInEpoch,
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
    it('success with validator index change', async () => {
      const startBlock = (epoch - 1) * epochBlockSize + 1 - slotSize
      await slasher.setEpochSigner(epoch - 1, 1, validatorList[0])
      await makeBlockInfoSlashable(startBlock, [1, validatorIndexInEpoch])
      await slasher.slash(startBlock, 1, validatorIndexInEpoch, 0, [], [], [], [], [], [])
      const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
      assert.equal(balance.toNumber(), 40000)
    })
    it('success with epoch change but without validator index change', async () => {
      const startBlock = (epoch - 1) * epochBlockSize + 1 - slotSize
      await slasher.setEpochSigner(epoch - 1, validatorIndexInEpoch, validatorList[0])
      await makeBlockInfoSlashable(startBlock, [validatorIndexInEpoch, validatorIndexInEpoch])

      await slasher.slash(
        startBlock,
        validatorIndexInEpoch,
        validatorIndexInEpoch,
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
    describe('when succeds', () => {
      let resp: any
      let startBlock: number
      beforeEach(async () => {
        startBlock = (epoch - 1) * epochBlockSize + 1
        await makeBlockInfoSlashable(startBlock, [validatorIndexInEpoch, validatorIndexInEpoch])
        resp = await slasher.slash(
          startBlock,
          validatorIndexInEpoch,
          validatorIndexInEpoch,
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
      it('cannot be slashed twice in the same epoch if oncePerEpoch is true', async () => {
        // Just to make sure that is was slashed
        const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
        assert.equal(balance.toNumber(), 40000)
        await slasher.setOncePerEpoch(true)
        const res = await slasher.oncePerEpoch()
        assert.equal(res, true)
        const newStartBlock = startBlock + slashableDowntime * 2
        await makeBlockInfoSlashable(newStartBlock, [validatorIndexInEpoch, validatorIndexInEpoch])
        await assertRevert(
          slasher.slash(
            newStartBlock,
            validatorIndexInEpoch,
            validatorIndexInEpoch,
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
      it('can be slashed twice in the same epoch if oncePerEpoch is false', async () => {
        // Just to make sure that is was slashed
        const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
        assert.equal(balance.toNumber(), 40000)
        await slasher.setOncePerEpoch(false)
        const res = await slasher.oncePerEpoch()
        assert.equal(res, false)
        const newStartBlock = startBlock + slashableDowntime * 2
        await makeBlockInfoSlashable(newStartBlock, [validatorIndexInEpoch, validatorIndexInEpoch])
        await slasher.slash(
          newStartBlock,
          validatorIndexInEpoch,
          validatorIndexInEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          []
        )
        const balance2nd = await mockLockedGold.accountTotalLockedGold(validatorList[0])
        assert.equal(balance2nd.toNumber(), 30000)
      })
      it('cannot be slashed twice if it shares at least a block', async () => {
        // Just to make sure that is was slashed
        const balance = await mockLockedGold.accountTotalLockedGold(validatorList[0])
        assert.equal(balance.toNumber(), 40000)
        const newStartBlock = startBlock + slashableDowntime - 1
        await makeBlockInfoSlashable(newStartBlock, [validatorIndexInEpoch, validatorIndexInEpoch])
        await assertRevert(
          slasher.slash(
            startBlock,
            validatorIndexInEpoch,
            validatorIndexInEpoch,
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
    })
  })
})
