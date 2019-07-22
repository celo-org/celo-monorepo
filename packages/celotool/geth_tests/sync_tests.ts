const assert = require('chai').assert
const Web3 = require('web3')
import {
  GethInstanceConfig,
  getHooks,
  getEnode,
  initAndStartGeth,
  sleep,
} from '@celo/celotool/geth_tests/src/lib/utils'

import { generateAccountAddressFromPrivateKey } from '@celo/celotool/src/lib/generate_utils'

describe('sync tests', () => {
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

  before(async function(this: any) {
    this.timeout(0)
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

  const beforeEachHook = async (test: any, syncmode: string) => {
    test.timeout(0)
    const syncInstance = {
      name: syncmode,
      validating: false,
      syncmode: syncmode,
      port: 30313,
      rpcport: 8555,
      lightserv: syncmode == 'light' || syncmode == 'ultralight' ? false : true,
      peers: [await getEnode(8553)],
    }
    await initAndStartGeth(hooks.gethBinaryPath, syncInstance)
  }

  const syncTest = async (test: any) => {
    test.timeout(0)
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
  }

  const syncModes = ['full', 'fast', 'light', 'ultralight']
  for (const syncMode of syncModes) {
    describe(`when syncing with a ${syncMode} node`, () => {
      beforeEach(async function(this: any) {
        await beforeEachHook(this, syncMode)
      })

      it('should sync the latest block', async function(this: any) {
        await syncTest(this)
      })
    })
  }
  describe('when losing datadir', () => {
    let web3: any
    beforeEach(async function(this: any) {
      this.timeout(0) // Disable test timeout
      web3 = new Web3('http://localhost:8547')
      await hooks.restart()
    })

    it('validators should be able to recover and continue proposing blocks', async function(this: any) {
      this.timeout(0)
      const instance: GethInstanceConfig = gethConfig.instances[1]
      await sleep(20)
      await hooks.restartInstance(instance)
      await sleep(100) // wait for round change / resync
      const address = generateAccountAddressFromPrivateKey(instance.privateKey || '')
      const currentBlock = await web3.eth.getBlock('latest')
      for (let i = 0; i < 10; i++) {
        if ((await web3.eth.getBlock(currentBlock.number - i)).miner == address) {
          return // A block proposed by validator who lost randomness was found, hence randomness was recovered
        }
      }
      assert.fail('Reset proposer did not produce any new blocks')
    })
  })
})
