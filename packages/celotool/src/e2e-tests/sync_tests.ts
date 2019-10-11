import { assert } from 'chai'
import Web3 from 'web3'
import {
  getEnode,
  GethInstanceConfig,
  getHooks,
  initAndStartGeth,
  killInstance,
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
    ],
  }
  const hooks = getHooks(gethConfig)

  before(async () => {
    // Start validator nodes and migrate contracts.
    await hooks.before()
    // Restart validator nodes.
    await hooks.restart()
    // Give validators time to connect to eachother.
    await sleep(40)
    const fullInstance = {
      name: 'full',
      validating: false,
      syncmode: 'full',
      lightserv: true,
      port: 30311,
      rpcport: 8553,
      peers: [await getEnode(8545)],
    }
    await initAndStartGeth(hooks.gethBinaryPath, fullInstance)
    await sleep(3)
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
          port: 30313,
          rpcport: 8555,
          lightserv: syncmode !== 'light' && syncmode !== 'ultralight',
          peers: [await getEnode(8553)],
        }
        await initAndStartGeth(hooks.gethBinaryPath, syncInstance)
      })

      afterEach(() => killInstance(syncInstance))

      it('should sync the latest block', async () => {
        const validatingWeb3 = new Web3(`http://localhost:8545`)
        const validatingFirstBlock = await validatingWeb3.eth.getBlock('latest')
        await sleep(20)
        const validatingLatestBlock = await validatingWeb3.eth.getBlock('latest')
        await sleep(3)
        const syncWeb3 = new Web3(`http://localhost:8555`)
        const syncLatestBlock = await syncWeb3.eth.getBlock('latest')
        assert.isAbove(validatingLatestBlock.number, 1)
        // Assert that the validator is still producing blocks.
        assert.isAbove(validatingLatestBlock.number, validatingFirstBlock.number)
        // Assert that the syncing node has synced with the validator.
        assert.isAtLeast(syncLatestBlock.number, validatingLatestBlock.number)
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
      await initAndStartGeth(hooks.gethBinaryPath, instance)
      await sleep(60) // wait for round change / resync
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
