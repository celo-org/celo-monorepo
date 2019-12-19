// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3.d.ts" />

import { ContractKit, newKit } from '@celo/contractkit'
import { assert } from 'chai'
import * as rlp from 'rlp'
import Web3 from 'web3'
import { getHooks, GethTestConfig, sleep } from './utils'

describe('Slashing tests', function(this: any) {
  this.timeout(0)

  let kit: ContractKit

  const gethConfig: GethTestConfig = {
    migrateTo: 18,
    instances: [
      { name: 'validator', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
    ],
  }
  const hooks = getHooks(gethConfig)
  before(hooks.before)
  after(hooks.after)

  const validatorAddress: string = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'

  const restartGeth = async () => {
    // Restart the validator node
    await hooks.restart()

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    kit = newKit('http://localhost:8545')
    await kit.web3.eth.personal.unlockAccount(validatorAddress, '', 1000)
  }

  describe('when running a node', () => {
    before(async () => {
      await restartGeth()
    })

    it('should parse blockNumber from test header', async () => {
      this.timeout(0)
      const contract = await kit._web3Contracts.getElection()
      const header = kit.web3.utils.hexToBytes(
        '0xf901f9a07285abd5b24742f184ad676e31f6054663b3529bc35ea2fcad8a3e0f642a46f7a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ecc60e00b3fe5ce9f6e1a10e5469764daf51f1fe93c22ec3f9a7583a80357217a0d35d334d87c0cc0a202e3756bf81fae08b1575f286c7ee7a3f8df4f0f3afc55da056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000001832fefd8825208845c47775c80a00000000000000000000000000000000000000000000000000000000000000000880000000000000000'
      )
      const blockNumber = await contract.methods.getBlockNumberFromHeader(header).call()
      assert.equal(blockNumber, 1)
    })

    it('should hash test header correctly', async () => {
      const contract = await kit._web3Contracts.getElection()
      const header = kit.web3.utils.hexToBytes(
        '0xf901f9a07285abd5b24742f184ad676e31f6054663b3529bc35ea2fcad8a3e0f642a46f7a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ecc60e00b3fe5ce9f6e1a10e5469764daf51f1fe93c22ec3f9a7583a80357217a0d35d334d87c0cc0a202e3756bf81fae08b1575f286c7ee7a3f8df4f0f3afc55da056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000001832fefd8825208845c47775c80a00000000000000000000000000000000000000000000000000000000000000000880000000000000000'
      )
      const hash = await contract.methods.hashHeader(header).call()
      assert.equal(hash, '0xf5a450266c77dce47f7698959d8e7019db860ee19a5322b16a853fdf23607100')
    })

    it('should hash current header correctly', async () => {
      const contract = await kit._web3Contracts.getElection()
      const current = await kit.web3.eth.getBlockNumber()
      const block = await kit.web3.eth.getBlock(current)
      const rlpEncodedBlock = rlp.encode(reconstructHeaderArray(kit.web3, block))
      const blockHash = await contract.methods.hashHeader(rlpEncodedBlock).call()
      assert.equal(blockHash, block.hash)
    })

    it('slashing four double signing', async () => {
      const contract = await kit._web3Contracts.getElection()
      const current = await kit.web3.eth.getBlockNumber()
      const block = await kit.web3.eth.getBlock(current)
      const doubleSignedBlock = await kit.web3.eth.getBlock(current)
      doubleSignedBlock.timestamp++
      const rlpEncodedBlock = rlp.encode(reconstructHeaderArray(kit.web3, block))
      const rlpEncodedDoubleSignedBlock = rlp.encode(
        reconstructHeaderArray(kit.web3, doubleSignedBlock)
      )
      const blockHash = await contract.methods.hashHeader(rlpEncodedBlock).call()
      const doubleSignedBlockHash = await contract.methods
        .hashHeader(rlpEncodedDoubleSignedBlock)
        .call()
      console.info('Canonical block hash: ' + blockHash)
      console.info('Double signed block hash: ' + doubleSignedBlockHash)
    })
  })
})

function reconstructHeaderArray(web3: Web3, block: any) {
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
