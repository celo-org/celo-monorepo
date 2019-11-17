// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3.d.ts" />
import { newKitFromWeb3 } from '@celo/contractkit'
import { assert } from 'chai'
import Web3 from 'web3'
import {
  EPOCH,
  getEnode,
  GethInstanceConfig,
  getHooks,
  getValidatorGroupPrivateKey,
  initAndStartGeth,
  killInstance,
  newMemberSwapper,
  sleep,
} from './utils'

describe('sync tests', function(this: any) {
  this.timeout(0)

  const gethConfig = {
    migrate: true,
    instances: [
      { name: 'validator0', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
      { name: 'validator1', validating: true, syncmode: 'full', port: 30305, rpcport: 8547 },
      { name: 'validator2', validating: true, syncmode: 'full', port: 30307, rpcport: 8549 },
      { name: 'validator3', validating: true, syncmode: 'full', port: 30309, rpcport: 8551 },
      { name: 'validator4', validating: true, syncmode: 'full', port: 30311, rpcport: 8553 },
    ],
  }
  const hooks = getHooks(gethConfig)

  before(async () => {
    // Start validator nodes and migrate contracts.
    // await hooks.before()
    // Restart validator nodes.
    await hooks.restart()
    const validatorKit = newKitFromWeb3(new Web3('http://localhost:8545'))
    const groupPrivateKey = await getValidatorGroupPrivateKey(validatorKit, gethConfig.instances[0])
    console.log('group privatekey', groupPrivateKey)
    const fullInstance = {
      name: 'full',
      validating: false,
      syncmode: 'full',
      lightserv: true,
      port: 30313,
      wsport: 8555,
      rpcport: 8557,
      privateKey: groupPrivateKey.slice(2),
      peers: [await getEnode(8545)],
    }
    await initAndStartGeth(hooks.gethBinaryPath, fullInstance)
    const validators = await (await validatorKit._web3Contracts.getValidators()).methods
      .getRegisteredValidators()
      .call()
    const web3 = new Web3('ws://localhost:8555')
    // Give the full node time to sync.
    while (await web3.eth.isSyncing()) {
      await sleep(0.1)
    }
    const kit = newKitFromWeb3(web3)
    const membersToSwap = [validators[0], validators[1]]
    const memberSwapper = await newMemberSwapper(kit, membersToSwap)

    let errorWhileChangingValidatorSet = ''
    const changeValidatorSet = async (header: any) => {
      try {
        // At the start of epoch N, perform actions so the validator set is different for epoch N + 1.
        // Note that all of these actions MUST complete within the epoch.
        if (header.number % EPOCH === 0 && errorWhileChangingValidatorSet === '') {
          await memberSwapper.swap()
        }
      } catch (e) {
        console.error(e)
        errorWhileChangingValidatorSet = e
      }
    }

    const subscription = await web3.eth.subscribe('newBlockHeaders')
    subscription.on('data', changeValidatorSet)
    // Wait for a few epochs while changing the validator set.
    await sleep(30)
    ;(subscription as any).unsubscribe()
    assert.equal(errorWhileChangingValidatorSet, '')
  })

  after(hooks.after)

  const syncModes = ['full', 'fast', 'light', 'ultralight']
  for (const syncmode of syncModes) {
    describe(`when syncing with a ${syncmode} node`, () => {
      let syncInstance: GethInstanceConfig
      beforeEach(async () => {
        syncInstance = {
          name: syncmode,
          validating: false,
          syncmode,
          port: 30315,
          wsport: 8559,
          lightserv: syncmode !== 'light' && syncmode !== 'ultralight',
          peers: [await getEnode(8557)],
        }
        await initAndStartGeth(hooks.gethBinaryPath, syncInstance)
      })

      afterEach(() => killInstance(syncInstance))

      it('should sync the latest block', async () => {
        const validatorWeb3 = new Web3(`http://localhost:8545`)
        const validatorFirstBlock = await validatorWeb3.eth.getBlockNumber()
        const syncingWeb3 = new Web3('ws://localhost:8559')
        // Give the node time to sync.
        while (await syncingWeb3.eth.isSyncing()) {
          console.log('sycning')
          await sleep(0.1)
        }
        await sleep(5)

        const validatorLatestBlock = await validatorWeb3.eth.getBlockNumber()
        const syncLatestBlock = await syncingWeb3.eth.getBlockNumber()
        assert.isAbove(validatorLatestBlock, 1)
        // Assert that the validator is still producing blocks.
        assert.isAbove(validatorLatestBlock, validatorFirstBlock)
        // Assert that the syncing node has synced with the validator.
        assert.isAtLeast(syncLatestBlock, validatorLatestBlock)
      })
    })
  }
  describe.skip(`when a validator's data directory is deleted`, () => {
    let web3: any
    beforeEach(async function(this: any) {
      this.timeout(0) // Disable test timeout
      web3 = new Web3('http://localhost:8545')
      await hooks.restart()
    })

    it('should continue to block produce', async function(this: any) {
      this.timeout(0)
      const instance: GethInstanceConfig = gethConfig.instances[0]
      await killInstance(instance)
      await initAndStartGeth(hooks.gethBinaryPath, instance)
      await sleep(120) // wait for round change / resync
      const address = (await web3.eth.getAccounts())[0]
      const currentBlock = await web3.eth.getBlock('latest')
      for (let i = 0; i < gethConfig.instances.length; i++) {
        if ((await web3.eth.getBlock(currentBlock.number - i)).miner === address) {
          return // A block proposed by validator who lost randomness was found, hence randomness was recovered
        }
      }
      assert.fail('Reset validator did not propose any new blocks')
    })
  })
})
