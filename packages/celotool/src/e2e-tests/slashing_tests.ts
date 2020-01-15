// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3.d.ts" />

import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { NULL_ADDRESS } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import * as rlp from 'rlp'
import Web3 from 'web3'
import { getContext, GethTestConfig, sleep } from './utils'

const headerHex =
  '0xf901f9a07285abd5b24742f184ad676e31f6054663b3529bc35ea2fcad8a3e0f642a46f7a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ecc60e00b3fe5ce9f6e1a10e5469764daf51f1fe93c22ec3f9a7583a80357217a0d35d334d87c0cc0a202e3756bf81fae08b1575f286c7ee7a3f8df4f0f3afc55da056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000001832fefd8825208845c47775c80a00000000000000000000000000000000000000000000000000000000000000000880000000000000000'

function headerArray(web3: Web3, block: any) {
  return [
    block.parentHash,
    block.sha3Uncles,
    block.miner,
    block.stateRoot,
    block.transactionsRoot,
    block.receiptsRoot,
    block.logsBloom,
    web3.utils.toHex(block.difficulty),
    block.number,
    block.gasLimit,
    block.gasUsed,
    block.timestamp,
    block.extraData,
    block.mixHash,
    block.nonce,
  ]
}

function headerFromBlock(web3: Web3, block: any) {
  return rlp.encode(headerArray(web3, block))
}

describe('slashing tests', function(this: any) {
  const gethConfigDown: GethTestConfig = {
    migrate: true,
    instances: [
      { name: 'validator0', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
      { name: 'validator1', validating: true, syncmode: 'full', port: 30305, rpcport: 8547 },
      { name: 'validator2', validating: true, syncmode: 'full', port: 30307, rpcport: 8549 },
      { name: 'validator3', validating: true, syncmode: 'full', port: 30309, rpcport: 8551 },
    ],
  }

  const gethConfig: GethTestConfig = {
    migrate: true,
    instances: gethConfigDown.instances.concat([
      // Validator 4 will be down in the downtime test
      { name: 'validator4', validating: true, syncmode: 'full', port: 30311, rpcport: 8553 },
    ]),
  }

  const context: any = getContext(gethConfig)
  const contextDown: any = getContext(gethConfigDown)
  let web3: any
  let kit: ContractKit

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(context.hooks.after)

  const restart = async () => {
    await context.hooks.restart()
    web3 = new Web3('http://localhost:8545')
    kit = newKitFromWeb3(web3)
    await sleep(1)
  }

  const restartWithDowntime = async () => {
    await contextDown.hooks.restart()
    web3 = new Web3('http://localhost:8545')
    kit = newKitFromWeb3(web3)
    await sleep(1)
  }

  const waitUntilBlock = async (bn: number) => {
    let blockNumber: number
    do {
      blockNumber = await web3.eth.getBlockNumber()
      await sleep(0.1)
    } while (blockNumber < bn)
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
      assert.equal(blockNumber, 1)
    })

    it('should parse blockNumber from current header', async () => {
      const contract = await kit._web3Contracts.getElection()
      const current = await kit.web3.eth.getBlockNumber()
      const block = await kit.web3.eth.getBlock(current)
      const rlpEncodedBlock = rlp.encode(headerArray(kit.web3, block))
      const blockNumber = await contract.methods.getBlockNumberFromHeader(rlpEncodedBlock).call()
      assert.equal(blockNumber, current)
    })

    it('should hash test header correctly', async () => {
      const contract = await kit._web3Contracts.getElection()
      const header = kit.web3.utils.hexToBytes(headerHex)
      const hash = await contract.methods.hashHeader(header).call()
      assert.equal(hash, '0xf5a450266c77dce47f7698959d8e7019db860ee19a5322b16a853fdf23607100')
    })

    it('should hash current header correctly', async () => {
      const contract = await kit._web3Contracts.getElection()
      const current = await kit.web3.eth.getBlockNumber()
      const block = await kit.web3.eth.getBlock(current)
      const rlpEncodedBlock = rlp.encode(headerArray(kit.web3, block))
      const blockHash = await contract.methods.hashHeader(rlpEncodedBlock).call()
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
      const blockNumber = await web3.eth.getBlockNumber()
      await waitUntilBlock(blockNumber + 20)

      // Store this block for testing double signing
      doubleSigningBlock = await web3.eth.getBlock(blockNumber + 15)

      const signer = await slasher.methods.validatorSignerAddressFromSet(4, blockNumber + 12).call()

      const validator = (await kit.web3.eth.getAccounts())[0]
      await kit.web3.eth.personal.unlockAccount(validator, '', 1000000)
      const lockedGold = await kit.contracts.getLockedGold()

      const validatorsContract = await kit._web3Contracts.getValidators()
      const history = await validatorsContract.methods.getMembershipHistory(signer).call()
      const historyIndex = history[0].length - 1

      await slasher.methods
        .slash(
          blockNumber + 12,
          4,
          4,
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
      // Penalty is defined to be 20 cGLD in migrations, locked gold is 10000 cGLD for a validator
      assert.equal(balance.toString(10), '9980000000000000000000')
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

      await waitUntilBlock(doubleSigningBlock.number)

      const other = headerFromBlock(web3, doubleSigningBlock)

      const num = await slasher.methods.getBlockNumberFromHeader(other).call()

      const header = headerFromBlock(web3, await web3.eth.getBlock(num))

      // Find a validator that double signed. Both blocks will have signatures from exactly 2F+1 validators.
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

      // Penalty is defined to be 100 cGLD in migrations, locked gold is 10000 cGLD for a validator
      const balance = await lockedGold.getAccountTotalLockedGold(signer)
      assert.equal(balance.toString(10), '9900000000000000000000')
    })
  })
})
