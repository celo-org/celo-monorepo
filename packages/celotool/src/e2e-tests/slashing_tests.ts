// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3-celo.d.ts" />

import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { ensureLeading0x, NULL_ADDRESS } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import * as rlp from 'rlp'
import Web3 from 'web3'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { getHooks, sleep, waitForBlock } from './utils'

const headerHex =
  '0xf901a6a07285abd5b24742f184ad676e31f6054663b3529bc35ea2fcad8a3e0f642a46f7948888f1f195afa192cfee860698584c030f4c9db1a0ecc60e00b3fe5ce9f6e1a10e5469764daf51f1fe93c22ec3f9a7583a80357217a0d35d334d87c0cc0a202e3756bf81fae08b1575f286c7ee7a3f8df4f0f3afc55da056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b901000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001825208845c47775c80'

const TMP_PATH = '/tmp/e2e'

const safeMarginBlocks = 4

function headerArray(block: any) {
  return [
    block.parentHash,
    block.miner,
    block.stateRoot,
    block.transactionsRoot,
    block.receiptsRoot,
    block.logsBloom,
    block.number,
    block.gasUsed,
    block.timestamp,
    block.extraData,
  ]
}

function headerFromBlock(block: any) {
  return ensureLeading0x(rlp.encode(headerArray(block)).toString('hex'))
}

// Find a validator that double signed. Both blocks will have signatures from exactly 2F+1 validators.
async function findDoubleSignerIndex(
  kit: ContractKit,
  header: string,
  other: string
): Promise<number> {
  const slasher = await kit._web3Contracts.getDoubleSigningSlasher()
  const bitmap1 = await slasher.methods.getVerifiedSealBitmapFromHeader(header).call()
  const bitmap2 = await slasher.methods.getVerifiedSealBitmapFromHeader(other).call()

  let bmNum1 = new BigNumber(bitmap1).toNumber()
  let bmNum2 = new BigNumber(bitmap2).toNumber()
  bmNum1 = bmNum1 >> 1
  bmNum2 = bmNum2 >> 1
  let signerIdx = 1
  for (let i = 1; i < 5; i++) {
    if ((bmNum1 & 1) === 1 && (bmNum2 & 1) === 1) {
      break
    }
    signerIdx++
    bmNum1 = bmNum1 >> 1
    bmNum2 = bmNum2 >> 1
  }
  return signerIdx
}

async function generateValidIntervalArrays(
  startBlock: number,
  endBlock: number,
  startEpoch: number,
  slotSize: number,
  kit: ContractKit
): Promise<{
  startBlocks: number[]
  endBlocks: number[]
}> {
  const startBlocks: number[] = []
  const endBlocks: number[] = []

  const nextEpochStart = await kit.getFirstBlockNumberForEpoch(startEpoch + 1)
  for (let currentSlotStart = startBlock; currentSlotStart <= endBlock; ) {
    let currentSlotEnd = currentSlotStart + slotSize - 1
    currentSlotEnd = currentSlotEnd > endBlock ? endBlock : currentSlotEnd
    // avoids crossing the epoch
    currentSlotEnd =
      currentSlotEnd >= nextEpochStart && currentSlotStart < nextEpochStart
        ? nextEpochStart - 1
        : currentSlotEnd
    startBlocks.push(currentSlotStart)
    endBlocks.push(currentSlotEnd)
    currentSlotStart = currentSlotEnd + 1
  }

  return { startBlocks, endBlocks }
}

describe('slashing tests', function(this: any) {
  const gethConfigDown: GethRunConfig = {
    network: 'local',
    networkId: 1101,
    runPath: TMP_PATH,
    migrate: true,
    instances: [
      {
        name: 'validator0',
        validating: true,
        syncmode: 'full',
        port: 30303,
        rpcport: 8545,
      },
      {
        name: 'validator1',
        validating: true,
        syncmode: 'full',
        port: 30305,
        rpcport: 8547,
      },
      {
        name: 'validator2',
        validating: true,
        syncmode: 'full',
        port: 30307,
        rpcport: 8549,
      },
      {
        name: 'validator3',
        validating: true,
        syncmode: 'full',
        port: 30309,
        rpcport: 8551,
      },
    ],
  }

  const gethConfig: GethRunConfig = {
    network: 'local',
    networkId: 1101,
    runPath: TMP_PATH,
    migrate: true,
    instances: gethConfigDown.instances.concat([
      // Validator 4 will be down in the downtime test
      {
        name: 'validator4',
        validating: true,
        syncmode: 'full',
        port: 30311,
        rpcport: 8553,
      },
    ]),
  }

  const hooks: any = getHooks(gethConfig)
  const hooksDown: any = getHooks(gethConfigDown)
  let web3: Web3
  let kit: ContractKit

  before(async function(this: any) {
    this.timeout(0)
    // Comment out the following line after a test run for a quick rerun.
    await hooks.before()
  })

  after(async function(this: any) {
    this.timeout(0)
    await hooks.after()
  })

  const restart = async () => {
    await hooks.restart()
    web3 = new Web3('http://localhost:8545')
    kit = newKitFromWeb3(web3)
    await sleep(1)
  }

  const restartWithDowntime = async () => {
    await hooksDown.restart()
    web3 = new Web3('http://localhost:8545')
    kit = newKitFromWeb3(web3)
    await sleep(1)
  }

  describe('when running a network', () => {
    before(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restartWithDowntime()
    })

    it('should parse blockNumber from test header', async () => {
      this.timeout(0)
      const contract = await kit._web3Contracts.getElection()
      const header = kit.web3.utils.hexToBytes(headerHex)

      const blockNumber = await contract.methods.getBlockNumberFromHeader(header).call()
      assert.equal(blockNumber, '1')
    })

    it('should parse blockNumber from current header', async () => {
      const contract = await kit._web3Contracts.getElection()
      const current = await kit.web3.eth.getBlockNumber()
      const block = await kit.web3.eth.getBlock(current)
      const header = headerFromBlock(block)
      const blockNumber = await contract.methods.getBlockNumberFromHeader(header).call()
      assert.equal(blockNumber, current.toString())
    })

    it('should hash test header correctly', async () => {
      const contract = await kit._web3Contracts.getElection()
      const header = kit.web3.utils.hexToBytes(headerHex)
      const hash = await contract.methods.hashHeader(header).call()
      assert.equal(hash, '0x2e14ef428293e41c5f81a108b5d36f892b2bee3e34aec4223474c4a31618ea69')
    })

    it('should hash current header correctly', async () => {
      const contract = await kit._web3Contracts.getElection()
      const current = await kit.web3.eth.getBlockNumber()
      const block = await kit.web3.eth.getBlock(current)
      const header = headerFromBlock(block)
      const blockHash = await contract.methods.hashHeader(header).call()
      assert.equal(blockHash, block.hash)
    })
  })

  let doubleSigningBlock: any

  describe('test slashing for downtime', () => {
    before(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restartWithDowntime()
    })

    it('slash for downtime', async function(this: any) {
      this.timeout(0) // Disable test timeout
      const slasher = await kit._web3Contracts.getDowntimeSlasher()
      const slashableDowntime = new BigNumber(await slasher.methods.slashableDowntime().call())
      const blockNumber = await web3.eth.getBlockNumber()
      await waitForBlock(web3, blockNumber + slashableDowntime.toNumber() + 2 * safeMarginBlocks)

      // Store this block for testing double signing
      doubleSigningBlock = await web3.eth.getBlock(blockNumber + 2 * safeMarginBlocks)

      const signer = await slasher.methods.validatorSignerAddressFromSet(4, blockNumber).call()

      const validator = (await kit.web3.eth.getAccounts())[0]
      await kit.web3.eth.personal.unlockAccount(validator, '', 1000000)
      const lockedGold = await kit.contracts.getLockedGold()

      const validatorsContract = await kit._web3Contracts.getValidators()
      const history = await validatorsContract.methods.getMembershipHistory(signer).call()
      const historyIndex = history[0].length - 1

      const slotSize = slashableDowntime.dividedToIntegerBy(3).toNumber()

      const startBlock = blockNumber + safeMarginBlocks
      const endBlock = startBlock + slashableDowntime.toNumber() - 1
      const startEpoch = await kit.getEpochNumberOfBlock(startBlock)

      const intervalArrays = await generateValidIntervalArrays(
        startBlock,
        endBlock,
        startEpoch,
        slotSize,
        kit
      )

      for (let i = 0; i < intervalArrays.startBlocks.length; i += 1) {
        await slasher.methods
          .setBitmapForInterval(intervalArrays.startBlocks[i], intervalArrays.endBlocks[i])
          .send({ from: validator, gas: 5000000 })
      }

      await slasher.methods
        .slash(
          intervalArrays.startBlocks,
          intervalArrays.endBlocks,
          [4, 4],
          historyIndex,
          [],
          [],
          [],
          [NULL_ADDRESS],
          [NULL_ADDRESS],
          [0]
        )
        .send({ from: validator, gas: 5000000 })

      const balance = await lockedGold.getAccountTotalLockedGold(signer)
      // Penalty is defined to be 100 cGLD in migrations, locked gold is 10000 cGLD for a validator
      assert.equal(balance.toString(10), '9900000000000000000000')
    })
  })

  describe('test slashing for downtime with contractkit', () => {
    before(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restartWithDowntime()
    })

    it('slash for downtime with contractkit', async function(this: any) {
      this.timeout(0) // Disable test timeout
      const slasher = await kit.contracts.getDowntimeSlasher()
      const blockNumber = await web3.eth.getBlockNumber()
      const slashableDowntime = await slasher.slashableDowntime()

      await waitForBlock(web3, blockNumber + slashableDowntime + 2 * safeMarginBlocks)

      const user = (await kit.web3.eth.getAccounts())[0]
      await kit.web3.eth.personal.unlockAccount(user, '', 1000000)

      const endBlock = blockNumber + safeMarginBlocks + slashableDowntime - 1
      const intervals = await slasher.slashableDowntimeIntervalsBefore(endBlock)

      for (const interval of intervals) {
        await slasher.setBitmapForInterval(interval).send({ from: user, gas: 5000000 })
      }

      const election = await kit.contracts.getElection()
      const signer = await election.validatorSignerAddressFromSet(4, intervals[0].start)

      const tx = await slasher.slashValidator(signer, intervals)
      const txResult = await tx.send({ from: user, gas: 5000000 })
      const txRcpt = await txResult.waitReceipt()
      assert.equal(txRcpt.status, true)

      const lockedGold = await kit.contracts.getLockedGold()
      const balance = await lockedGold.getAccountTotalLockedGold(signer)
      // Penalty is defined to be 100 cGLD in migrations, locked gold is 10000 cGLD for a validator
      assert.equal(balance.toString(10), '9900000000000000000000')
    })
  })

  describe('test slashing for double signing', () => {
    before(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restart()
    })

    it('slash for double signing', async function(this: any) {
      this.timeout(0) // Disable test timeout
      const slasher = await kit._web3Contracts.getDoubleSigningSlasher()

      await waitForBlock(web3, doubleSigningBlock.number)

      const other = headerFromBlock(doubleSigningBlock)

      const num = await slasher.methods.getBlockNumberFromHeader(other).call()

      const header = headerFromBlock(await web3.eth.getBlock(num))

      const signerIdx = await findDoubleSignerIndex(kit, header, other)
      const signer = await slasher.methods.validatorSignerAddressFromSet(signerIdx, num).call()
      const validator = (await kit.web3.eth.getAccounts())[0]
      await kit.web3.eth.personal.unlockAccount(validator, '', 1000000)

      const lockedGold = await kit.contracts.getLockedGold()
      const validatorsContract = await kit._web3Contracts.getValidators()
      const history = await validatorsContract.methods.getMembershipHistory(signer).call()
      const historyIndex = history[0].length - 1

      await slasher.methods
        .slash(
          signer,
          signerIdx,
          header,
          other,
          historyIndex,
          [],
          [],
          [],
          [NULL_ADDRESS],
          [NULL_ADDRESS],
          [0]
        )
        .send({ from: validator, gas: 5000000 })

      // Penalty is defined to be 9000 cGLD in migrations, locked gold is 10000 cGLD for a validator, so after slashing locked gold is 1000cGld
      const balance = await lockedGold.getAccountTotalLockedGold(signer)
      assert.equal(balance.toString(10), '1000000000000000000000')
    })
  })

  describe('test slashing for double signing with contractkit', () => {
    before(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restart()
    })

    it('slash for double signing with contractkit', async function(this: any) {
      this.timeout(0) // Disable test timeout
      const slasher = await kit.contracts.getDoubleSigningSlasher()
      const election = await kit.contracts.getElection()
      await waitForBlock(web3, doubleSigningBlock.number)

      const other = headerFromBlock(doubleSigningBlock)
      const num = await slasher.getBlockNumberFromHeader(other)
      const header = headerFromBlock(await web3.eth.getBlock(num))
      const signerIdx = await findDoubleSignerIndex(kit, header, other)
      const signer = await election.validatorSignerAddressFromSet(signerIdx, num)

      const validator = (await kit.web3.eth.getAccounts())[0]
      await kit.web3.eth.personal.unlockAccount(validator, '', 1000000)

      const tx = await slasher.slashSigner(signer, header, other)
      const txResult = await tx.send({ from: validator, gas: 5000000 })
      const txRcpt = await txResult.waitReceipt()
      assert.equal(txRcpt.status, true)

      // Penalty is defined to be 9000 cGLD in migrations, locked gold is 10000 cGLD for a validator, so after slashing locked gold is 1000cGld
      const lockedGold = await kit.contracts.getLockedGold()
      const balance = await lockedGold.getAccountTotalLockedGold(signer)
      assert.equal(balance.toString(10), '1000000000000000000000')
    })
  })
})
