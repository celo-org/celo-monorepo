// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3.d.ts" />
import { newKitFromWeb3 } from '@celo/contractkit'
import { assert } from 'chai'
import Web3 from 'web3'
import { connectPeers, initAndStartGeth } from '../lib/geth'
import { GethInstanceConfig } from '../lib/interfaces/geth-instance-config'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import {
  getHooks,
  getValidatorGroupPrivateKey,
  killInstance,
  newMemberSwapper,
  sleep,
  waitToFinishInstanceSyncing,
} from './utils'

const EPOCH = 10
const TMP_PATH = '/tmp/e2e'
const verbose = false

describe('sync tests', function(this: any) {
  this.timeout(0)

  const gethConfig: GethRunConfig = {
    networkId: 1101,
    network: 'local',
    runPath: TMP_PATH,
    migrate: true,
    verbosity: 1,
    instances: [
      { name: 'validator0', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
      { name: 'validator1', validating: true, syncmode: 'full', port: 30305, rpcport: 8547 },
      { name: 'validator2', validating: true, syncmode: 'full', port: 30307, rpcport: 8549 },
      { name: 'validator3', validating: true, syncmode: 'full', port: 30309, rpcport: 8551 },
      { name: 'validator4', validating: true, syncmode: 'full', port: 30311, rpcport: 8553 },
      { name: 'validator5', validating: true, syncmode: 'full', port: 30313, rpcport: 8555 },
    ],
  }

  const hooks = getHooks(gethConfig)
  const fullNode: GethInstanceConfig = {
    name: 'txfull',
    validating: false,
    syncmode: 'full',
    lightserv: true,
    port: 30315,
    wsport: 8557,
    rpcport: 8559,
  }

  before(async () => {
    // Start validator nodes and migrate contracts.
    await hooks.before()
    // Restart validator nodes.
    await hooks.restart()
    const validatorKit = newKitFromWeb3(new Web3('http://localhost:8545'))
    const groupPrivateKey = await getValidatorGroupPrivateKey(validatorKit, gethConfig.instances[0])
    fullNode.privateKey = groupPrivateKey.slice(2)
    await initAndStartGeth(gethConfig, hooks.gethBinaryPath, fullNode, verbose)
    await connectPeers([...gethConfig.instances, fullNode], verbose)
    const validators = await (await validatorKit._web3Contracts.getValidators()).methods
      .getRegisteredValidators()
      .call()
    const web3 = new Web3('ws://localhost:8557')
    await sleep(10)
    await waitToFinishInstanceSyncing(fullNode)
    const kit = newKitFromWeb3(web3)
    // The validator set size at any one time will be 4, and we rotate two validators per epoch.
    // This means that if a node were to have a static view of the validator set, we guarantee that
    // the node were to return false when calling VerifyHeader().
    const memberSwapper0 = await newMemberSwapper(kit, [validators[0], validators[1]])
    const memberSwapper1 = await newMemberSwapper(kit, [validators[2], validators[3]])

    let errorWhileChangingValidatorSet = ''
    const changeValidatorSet = async (header: any) => {
      try {
        // At the start of epoch N, perform actions so the validator set is different for epoch N + 1.
        // Note that all of these actions MUST complete within the epoch.
        if (header.number % EPOCH === 0 && errorWhileChangingValidatorSet === '') {
          await memberSwapper0.swap()
          await memberSwapper1.swap()
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

  const syncModes = ['full', 'fast', 'light', 'lightest']
  for (const syncmode of syncModes) {
    describe(`when syncing with a ${syncmode} node`, () => {
      let syncNode: GethInstanceConfig

      beforeEach(async () => {
        syncNode = {
          name: syncmode,
          validating: false,
          syncmode,
          port: 30317,
          wsport: 8561,
          lightserv: syncmode !== 'light' && syncmode !== 'lightest',
        }
        await initAndStartGeth(gethConfig, hooks.gethBinaryPath, syncNode, verbose)
        await connectPeers([fullNode, syncNode], verbose)
        await waitToFinishInstanceSyncing(syncNode)
      })

      afterEach(() => killInstance(syncNode))

      it('should sync the latest block', async () => {
        const validatingWeb3 = new Web3(`http://localhost:8545`)
        const validatingFirstBlock = await validatingWeb3.eth.getBlockNumber()
        // Give the validators time to create more blocks.
        await sleep(20, true)
        const validatingLatestBlock = await validatingWeb3.eth.getBlockNumber()
        await sleep(20, true)
        const syncWeb3 = new Web3(`http://localhost:8555`)
        const syncLatestBlock = await syncWeb3.eth.getBlockNumber()
        assert.isAbove(validatingLatestBlock, 1)
        // Assert that the validator is still producing blocks.
        assert.isAbove(validatingLatestBlock, validatingFirstBlock)
        // Assert that the syncing node has synced with the validator.
        assert.isAtLeast(syncLatestBlock, validatingLatestBlock)
      })
    })
  }
  describe(`when a validator's data directory is deleted`, () => {
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
      // copy instance
      const additionalInstance = { ...instance }
      await initAndStartGeth(gethConfig, hooks.gethBinaryPath, additionalInstance, verbose)
      await connectPeers([gethConfig.instances[0], additionalInstance], verbose)
      await waitToFinishInstanceSyncing(additionalInstance)
      await sleep(180, true) // wait for round change / resync
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
