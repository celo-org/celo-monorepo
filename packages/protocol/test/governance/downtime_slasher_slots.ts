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
  const validator = accounts[1]
  const group = accounts[0]

  const blocksToWaitForTesting = 350
  const slashingPenalty = 10000
  const slashingReward = 100
  const slashableDowntime = 12
  const slotSize = 4
  const oncePerEpoch = true

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
    endSignerIndex: number,
    from: string
  ) {
    // just in case that a test changes the default
    const actualSlotSize = (await slasher.slotSize()).toNumber()
    const actualSlashableDowntime = (await slasher.slashableDowntime()).toNumber()
    const epochStart = (await slasher.getEpochNumberOfBlock(startBlock)).toNumber()
    // Epoch 1 starts in the block 1
    const blockEpochChange = epochStart * epochBlockSize

    for (let i = startBlock; i < startBlock + actualSlashableDowntime; i += actualSlotSize) {
      await slasher.isDownForSlot(
        i,
        i < blockEpochChange ? startSignerIndex : endSignerIndex,
        i + slotSize - 1 < blockEpochChange ? startSignerIndex : endSignerIndex,
        { from }
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
    await validators.affiliate(group, { from: validator })
    await validators.affiliate(accounts[3], { from: accounts[4] })
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

  describe('#slash()', () => {
    let blockNumber: number
    // let startBlock: number
    let startBlockFromEpoch: number
    // let changeBlock: number
    // Signed by validators 0 and 1
    const bitmapVI01 = '0x0000000000000000000000000000000000000000000000000000000000000003'
    // Signed by validator 1
    const bitmapVI1 = '0x0000000000000000000000000000000000000000000000000000000000000002'
    // Signed by validator 0
    const bitmapVI0 = '0x0000000000000000000000000000000000000000000000000000000000000001'
    const validatorIndexActualEpoch = 0
    const validatorIndexLastEpoch = 0
    const validatorIndexLast2Epoch = 1

    before(async () => {
      let bn: number = 0
      do {
        bn = await web3.eth.getBlockNumber()
        await jsonRpc(web3, 'evm_mine', [])
      } while (bn < blocksToWaitForTesting)
    })
    beforeEach(async () => {
      blockNumber = await web3.eth.getBlockNumber()
      const safeStartSlashableBlock = blockNumber - slashableDowntime - 1

      const epoch = (await slasher.getEpochNumberOfBlock(safeStartSlashableBlock)).toNumber()
      startBlockFromEpoch = (epoch - 1) * epochBlockSize + 1
      await slasher.setEpochSigner(epoch, validatorIndexActualEpoch, validator)
      await slasher.setEpochSigner(epoch - 1, validatorIndexLastEpoch, validator)
      await slasher.setEpochSigner(epoch - 2, validatorIndexLast2Epoch, validator)
      await slasher.setNumberValidators(2)
    })
    it("fails if the slash window didn't finished yet", async () => {
      await assertRevert(
        slasher.slash(
          blockNumber - 1,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          [],
          { from: accounts[0] }
        )
      )
    })
    // Test boundaries
    it('fails if the first block was signed', async () => {
      // Required to avoid Slots collisions for the same user from other tests
      const slasherAccount = accounts[0]
      // All the other block are good
      await presetParentSealForBlocks(
        startBlockFromEpoch + 1,
        slashableDowntime - 1,
        bitmapVI1,
        bitmapVI1
      )
      // first block with everything signed
      await presetParentSealForBlocks(startBlockFromEpoch, 1, bitmapVI01, bitmapVI01)
      await calculateEverySlot(
        startBlockFromEpoch,
        validatorIndexActualEpoch,
        validatorIndexActualEpoch,
        slasherAccount
      )
      await assertRevert(
        slasher.slash(
          startBlockFromEpoch,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          [],
          { from: slasherAccount }
        )
      )
    })
    describe('when the last block was signed', () => {
      it("fails if it didn't switched index", async () => {
        // Required to avoid Slots collisions for the same user from other tests
        const slasherAccount = accounts[1]
        // All the other block are good
        await presetParentSealForBlocks(
          startBlockFromEpoch,
          slashableDowntime - 1,
          bitmapVI1,
          bitmapVI1
        )
        // last block with everything signed
        await presetParentSealForBlocks(
          startBlockFromEpoch + slashableDowntime - 1,
          1,
          bitmapVI01,
          bitmapVI01
        )
        await calculateEverySlot(
          startBlockFromEpoch,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          slasherAccount
        )
        await assertRevert(
          slasher.slash(
            startBlockFromEpoch,
            validatorIndexActualEpoch,
            validatorIndexActualEpoch,
            0,
            [],
            [],
            [],
            [],
            [],
            [],
            { from: slasherAccount }
          )
        )
      })
      it('fails if it switched index', async () => {
        // Required to avoid Slots collisions for the same user from other tests
        const slasherAccount = accounts[2]
        const startBlockFromLast2Epoch = startBlockFromEpoch - epochBlockSize - slotSize
        // All the blocks, changes the bitmap in the middle
        await presetParentSealForBlocks(
          startBlockFromLast2Epoch,
          slashableDowntime - 1,
          bitmapVI0,
          bitmapVI1
        )
        // last block with everything signed
        await presetParentSealForBlocks(
          startBlockFromLast2Epoch + slashableDowntime - 1,
          1,
          bitmapVI01,
          bitmapVI01
        )
        await calculateEverySlot(
          startBlockFromLast2Epoch,
          validatorIndexLast2Epoch,
          validatorIndexLastEpoch,
          slasherAccount
        )
        await assertRevert(
          slasher.slash(
            startBlockFromLast2Epoch,
            validatorIndexLast2Epoch,
            validatorIndexLastEpoch,
            0,
            [],
            [],
            [],
            [],
            [],
            [],
            { from: slasherAccount }
          )
        )
      })
    })
    it('fails if one block in the middle was signed', async () => {
      // Required to avoid Slots collisions for the same user from other tests
      const slasherAccount = accounts[3]
      // All the other block are good
      await presetParentSealForBlocks(startBlockFromEpoch, slashableDowntime, bitmapVI1, bitmapVI1)
      // middle block with everything signed
      await presetParentSealForBlocks(startBlockFromEpoch + slotSize, 1, bitmapVI01, bitmapVI01)
      await calculateEverySlot(
        startBlockFromEpoch,
        validatorIndexActualEpoch,
        validatorIndexActualEpoch,
        slasherAccount
      )
      await assertRevert(
        slasher.slash(
          startBlockFromEpoch,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          [],
          { from: slasherAccount }
        )
      )
    })
    it('success with validator index change', async () => {
      // Required to avoid Slots collisions for the same user from other tests
      const slasherAccount = accounts[4]
      const startBlockFromLast2Epoch = startBlockFromEpoch - epochBlockSize - slotSize
      //  the other block are good
      await presetParentSealForBlocks(
        startBlockFromLast2Epoch,
        slashableDowntime,
        bitmapVI0,
        bitmapVI1
      )
      // Sign the outer limits to be 100% secure that the slots are ok
      await presetParentSealForBlocks(startBlockFromLast2Epoch - 1, 1, bitmapVI01, bitmapVI01)
      await presetParentSealForBlocks(
        startBlockFromLast2Epoch + slashableDowntime,
        1,
        bitmapVI01,
        bitmapVI01
      )
      await calculateEverySlot(
        startBlockFromLast2Epoch,
        validatorIndexLast2Epoch,
        validatorIndexLastEpoch,
        slasherAccount
      )
      await assertRevert(
        slasher.slash(
          startBlockFromLast2Epoch,
          validatorIndexLast2Epoch,
          validatorIndexLastEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          [],
          { from: slasherAccount }
        )
      )
      const balance = await mockLockedGold.accountTotalLockedGold(validator)
      assert.equal(balance.toNumber(), 40000)
    })
    describe('when succeds', () => {
      // Required to avoid Slots collisions for the same user from other tests
      let slasherAccount: string
      let index = 5
      beforeEach(async () => {
        // All the other block are good
        slasherAccount = accounts[index]
        index = index + 1
        await presetParentSealForBlocks(
          startBlockFromEpoch,
          slashableDowntime,
          bitmapVI1,
          bitmapVI1
        )
        // Sign the outer limits to be 100% secure that the slots are ok
        await presetParentSealForBlocks(startBlockFromEpoch - 1, 1, bitmapVI01, bitmapVI01)
        await presetParentSealForBlocks(
          startBlockFromEpoch + slashableDowntime,
          1,
          bitmapVI01,
          bitmapVI01
        )
        await calculateEverySlot(
          startBlockFromEpoch,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          slasherAccount
        )
      })
      it('should emit the corresponding event', async () => {
        const resp = await slasher.slash(
          startBlockFromEpoch,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          [],
          { from: slasherAccount }
        )
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'DowntimeSlashPerformed',
          args: {
            validator,
            startBlock: new BigNumber(startBlockFromEpoch),
          },
        })
      })

      it('decrements gold when success', async () => {
        await slasher.slash(
          startBlockFromEpoch,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          [],
          { from: slasherAccount }
        )
        const balance = await mockLockedGold.accountTotalLockedGold(validator)
        assert.equal(balance.toNumber(), 40000)
      })
      it('also slashes group', async () => {
        await slasher.slash(
          startBlockFromEpoch,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          [],
          { from: slasherAccount }
        )
        const balance = await mockLockedGold.accountTotalLockedGold(group)
        assert.equal(balance.toNumber(), 40000)
      })
      it('cannot be slashed twice', async () => {
        await slasher.slash(
          startBlockFromEpoch,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          [],
          { from: slasherAccount }
        )
        await presetParentSealForBlocks(
          startBlockFromEpoch + slashableDowntime,
          1,
          bitmapVI1,
          bitmapVI1
        )
        await calculateEverySlot(
          startBlockFromEpoch + 1,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          slasherAccount
        )
        await assertRevert(
          slasher.slash(
            startBlockFromEpoch + 1,
            validatorIndexActualEpoch,
            validatorIndexActualEpoch,
            0,
            [],
            [],
            [],
            [],
            [],
            [],
            { from: slasherAccount }
          )
        )
      })
      it('but can be slashed on another epoch', async () => {
        await slasher.slash(
          startBlockFromEpoch,
          validatorIndexActualEpoch,
          validatorIndexActualEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          [],
          { from: slasherAccount }
        )
        const startBlockFromLastEpoch = startBlockFromEpoch - epochBlockSize
        // All the other block are good
        await presetParentSealForBlocks(
          startBlockFromLastEpoch,
          slashableDowntime,
          bitmapVI1,
          bitmapVI1
        )
        // Sign the outer limits to be 100% secure that the slots are ok
        await presetParentSealForBlocks(startBlockFromLastEpoch - 1, 1, bitmapVI01, bitmapVI01)
        await presetParentSealForBlocks(
          startBlockFromLastEpoch + slashableDowntime,
          1,
          bitmapVI01,
          bitmapVI01
        )
        await calculateEverySlot(
          startBlockFromLastEpoch,
          validatorIndexLastEpoch,
          validatorIndexLastEpoch,
          slasherAccount
        )
        await slasher.slash(
          startBlockFromLastEpoch,
          validatorIndexLastEpoch,
          validatorIndexLastEpoch,
          0,
          [],
          [],
          [],
          [],
          [],
          [],
          { from: slasherAccount }
        )
      })
    })
  })
})
