import { assert } from 'chai'
import Web3 from 'web3'
import { connectPeers, initAndStartGeth } from '../lib/geth'
import { GethInstanceConfig } from '../lib/interfaces/geth-instance-config'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { getHooks, killInstance, sleep, waitToFinishInstanceSyncing } from './utils'

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

  const fullNode: GethInstanceConfig = {
    name: 'txfull',
    validating: false,
    syncmode: 'full',
    lightserv: true,
    port: 30311,
    rpcport: 8553,
  }

  const hooks = getHooks(gethConfig)

  before(async () => {
    // Start validator nodes and migrate contracts.
    await hooks.before()
    // Restart validator nodes.
    await hooks.restart()

    await initAndStartGeth(gethConfig, hooks.gethBinaryPath, fullNode, verbose)
    await connectPeers([...gethConfig.instances, fullNode], verbose)
    await waitToFinishInstanceSyncing(fullNode)
  })

  after(hooks.after)

  const syncModes = ['full', 'fast', 'light', 'ultralight']
  for (const syncmode of syncModes) {
    describe(`when syncing with a ${syncmode} node`, () => {
      let syncNode: GethInstanceConfig

      beforeEach(async () => {
        syncNode = {
          name: syncmode,
          validating: false,
          syncmode,
          port: 30313,
          wsport: 9555,
          rpcport: 8555,
          lightserv: syncmode !== 'light' && syncmode !== 'ultralight',
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
      await sleep(120, true) // wait for round change / resync
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
