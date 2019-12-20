// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3.d.ts" />

import { ContractKit, newKit, newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import * as rlp from 'rlp'
import Web3 from 'web3'
import { getHooks, GethTestConfig, sleep } from './utils'
import { getContext, GethInstanceConfig, initAndStartGeth, waitToFinishSyncing } from './utils'

/*interface IstanbulAggregatedSeal {
  bitmap: number,
  signature: string,
  round: number,
}

interface IstanbulExtraData {
  addedValidators: string[],
  addedValidatorsPublicKeys: string[]
  removedValidators: number,
  seal: IstanbulAggregatedSeal,
  aggregatedSeal: IstanbulAggregatedSeal,
  parentAggregatedSeal: string,
  epochData: string,
}*/

describe('Slashing tests', function(this: any) {
  this.timeout(0)

  let kit: ContractKit
  let accounts: any
  let validators: any

  const gethConfig: GethTestConfig = {
    migrateTo: 18,
    instances: [
      { name: 'validator0', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
      { name: 'validator1', validating: true, syncmode: 'full', port: 30305, rpcport: 8547 },
      { name: 'validator2', validating: true, syncmode: 'full', port: 30307, rpcport: 8549 },
    ],
  }

  const context: any = getContext(gethConfig)
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
    validators = await kit._web3Contracts.getValidators()
    accounts = await kit._web3Contracts.getAccounts()
  }

  const waitForEpochTransition = async (epoch: number) => {
    let blockNumber: number
    do {
      blockNumber = await kit.web3.eth.getBlockNumber()
      await sleep(0.1)
    } while (blockNumber % epoch !== 1)
  }

  const getValidatorGroupMembers = async (blockNumber?: number) => {
    if (blockNumber) {
      const [groupAddress] = await validators.methods
        .getRegisteredValidatorGroups()
        .call({}, blockNumber)
      const groupInfo = await validators.methods
        .getValidatorGroup(groupAddress)
        .call({}, blockNumber)
      return groupInfo[0]
    } else {
      const [groupAddress] = await validators.methods.getRegisteredValidatorGroups().call()
      const groupInfo = await validators.methods.getValidatorGroup(groupAddress).call()
      return groupInfo[0]
    }
  }

  const getValidatorGroupPrivateKey = async () => {
    console.info('start1')
    const [groupAddress] = await validators.methods.getRegisteredValidatorGroups().call()
    console.info('start2 ' + groupAddress)
    const name = await accounts.methods.getName(groupAddress).call()
    console.info('start3 ' + name)
    const encryptedKeystore64 = name.split(' ')[1]
    const encryptedKeystore = JSON.parse(Buffer.from(encryptedKeystore64, 'base64').toString())
    console.info('start4 ' + name)
    // The validator group ID is the validator group keystore encrypted with validator 0's
    // private key.
    // @ts-ignore
    const encryptionKey = `0x${gethConfig.instances[0].privateKey}`
    const decryptedKeystore = kit.web3.eth.accounts.decrypt(encryptedKeystore, encryptionKey)
    console.info('start5 ' + name)
    return decryptedKeystore.privateKey
  }

  describe('when running a network', () => {
    before(async () => {
      await restartGeth()
    })

    it('should have registered validators', async () => {
      console.info('helo-1')
      const groupPrivateKey = await getValidatorGroupPrivateKey()
      console.info('helo-2')
      const additionalNodes: GethInstanceConfig[] = [
        {
          name: 'validatorGroup',
          validating: false,
          syncmode: 'full',
          port: 30313,
          wsport: 8555,
          rpcport: 8557,
          privateKey: groupPrivateKey.slice(2),
          peers: [8545],
        },
      ]
      console.info('helo-3')
      await Promise.all(
        additionalNodes.map((nodeConfig) =>
          initAndStartGeth(context.hooks.gethBinaryPath, nodeConfig)
        )
      )
      console.info('helo-4')

      const epoch = new BigNumber(await validators.methods.getEpochSize().call()).toNumber()
      console.info('Epoch size: ' + epoch)

      const validatorAccounts = await getValidatorGroupMembers()
      assert.equal(validatorAccounts.length, 3)

      // Wait for an epoch transition so we can activate our vote.
      await waitForEpochTransition(epoch)

      // Prepare for slashing.
      const groupWeb3 = new Web3('ws://localhost:8555')
      await waitToFinishSyncing(groupWeb3)
      const groupKit = newKitFromWeb3(groupWeb3)
      const group: string = (await groupWeb3.eth.getAccounts())[0]
      const txos = await (await groupKit.contracts.getElection()).activate(group)
      for (const txo of txos) {
        await txo.sendAndWaitForReceipt({ from: group })
      }

      // Wait for an extra epoch transition to ensure everyone is connected to one another.
      await waitForEpochTransition(epoch)

      const validatorsWrapper = await kit.contracts.getValidators()
      const validatorList = await validatorsWrapper.getRegisteredValidators()
      assert.equal(true, validatorList.length > 0)
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
      const rlpEncodedBlock = rlp.encode(headerArray(kit.web3, block))
      const blockHash = await contract.methods.hashHeader(rlpEncodedBlock).call()
      assert.equal(blockHash, block.hash)
    })

    it('slashing for double signing', async () => {
      const contract = await kit._web3Contracts.getElection()
      const current = await kit.web3.eth.getBlockNumber()
      const block = await kit.web3.eth.getBlock(current)
      //const blockIstanbulData = rlp.decode(block.extraData)
      //const parentAggregatedSeal = blockIstanbulData[5]

      const doubleSignedBlock = await kit.web3.eth.getBlock(current)
      doubleSignedBlock.timestamp++

      // aggregateSeal = aggregateSeal(validator0.sign(doubleSignedBlock), validator1.sign(doubleSignedBlock))
      // seal = validatorAddress.sign()

      // doubleSignedBlock.extraData = istanbulExtraDataArray({
      //   seal,                   // the ECDSA signature by the proposer
      //   aggregatedSeal,         // the aggregated BLS signature created via IBFT consensus.
      //   parentAggregatedSeal }) // the aggregated BLS signature for the previous block.

      const rlpEncodedBlock = rlp.encode(headerArray(kit.web3, block))
      const rlpEncodedDoubleSignedBlock = rlp.encode(headerArray(kit.web3, doubleSignedBlock))
      const blockHash = await contract.methods.hashHeader(rlpEncodedBlock).call()
      const doubleSignedBlockHash = await contract.methods
        .hashHeader(rlpEncodedDoubleSignedBlock)
        .call()
      console.info('Canonical block hash (blockNumber ' + current + '): ' + blockHash)
      console.info(
        'Double signed block hash (blockNumber  ' + current + '): ' + doubleSignedBlockHash
      )
      const validators = await kit.contracts.getValidators()
      const validatorList = await validators.getRegisteredValidators()
      for (const validator of validatorList) {
        console.info(validator)
      }
      console.info('end')

      // const slasher = await kit.contracts.getDoubleSigningSlasher()
      // slasher.checkForDoubleSigning(
      //   signer, // The signer to be slashed.
      //   index,  // Validator index at the block.
      //   blockA, // First double signed block.
      //   blockB, // Second double signed block.
      //   Block)  // number where double signing occured. Throws if no double signing is detected.
    })
  })
})

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

/*function istanbulExtraDataArray(ist: any) {
  return [
    ist.addedValidators,
    ist.addedValidatorsPublicKeys,
    ist.removedValidators,
    ist.seal,
    ist.aggregatedSeal,
    ist.parentAggregatedSeal,
    ist.epochData,
  ]
}*/
