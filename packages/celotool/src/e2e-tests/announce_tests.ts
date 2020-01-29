import { addStaticPeers, getContext, sleep } from './utils'

describe('announce tests', () => {
  const gethConfig = {
    migrate: false,
    instances: [
      { name: 'validator0', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
      { name: 'txnode0', validating: false, syncmode: 'full', port: 30305, rpcport: 8547 },
      { name: 'txnode1', validating: false, syncmode: 'full', port: 30307, rpcport: 8549 },
      { name: 'validator1', validating: true, syncmode: 'full', port: 30309, rpcport: 8551 },
    ],
    genesisConfig: {
      epoch: 10000, // Set the epoch to a high value, so that the validators don't send out a gossip message during this test case
    },
  }

  const context: any = getContext(gethConfig)

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(context.hooks.after)

  describe('when the p2p network is changing', () => {
    before(async function(this: any) {
      this.timeout(0)
      await context.hooks.restart()

      // Wait for a bit before setting the static peers, so that the validators
      // will send their initial gossip message (and hence cache it locally).
      await sleep(10)

      // The network topology is as follows:
      // Val0 <-> TxNode0 <-> TxNode1 <-> Val1
      // Set the peer connections

      for (const instance of gethConfig.instances) {
        switch (instance.name) {
          case 'validator0':
            addStaticPeers(instance, [8547])
            break
          case 'txnode0':
            addStaticPeers(instance, [8545, 8549])
            break
          case 'txnode1':
            addStaticPeers(instance, [8547, 8551])
            break
          case 'validator1':
            addStaticPeers(instance, [8549])
            break
        }
      }
    })

    it('the validators should learn of each others enodeUrls', async function(this: any) {
      this.timeout(0)
      await sleep(100000)
    })
  })
})
