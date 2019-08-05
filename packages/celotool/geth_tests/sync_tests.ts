import {
  getEnode,
  getHooks,
  initAndStartGeth,
  killPid,
  sleep,
} from '@celo/celotool/geth_tests/src/lib/utils'
import { assert } from 'chai'
import Web3 from 'web3'

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
      let gethPid: number | null = null
      beforeEach(async () => {
        const syncInstance = {
          name: syncmode,
          validating: false,
          syncmode,
          port: 30313,
          rpcport: 8555,
          lightserv: syncmode !== 'light' && syncmode !== 'ultralight',
          peers: [await getEnode(8553)],
        }
        gethPid = await initAndStartGeth(hooks.gethBinaryPath, syncInstance)
      })

      afterEach(() => {
        if (gethPid) {
          killPid(gethPid)
          gethPid = null
        }
      })

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
})
