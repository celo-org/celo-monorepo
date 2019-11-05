import { assert } from 'chai'
import { getHooks, sleep } from './utils'

describe('sentry tests', function(this: any) {
  this.timeout(0)

  const gethConfig = {
    migrate: true,
    instances: [
      {
        name: 'validator0',
        validating: true,
        syncmode: 'full',
        port: 30303,
        rpcport: 8545,
        isProxied: true,
        sentry: 'sentry0',
      },
      {
        name: 'sentry0',
        validating: false,
        syncmode: 'full',
        port: 30304,
        sentryport: 30305,
        rpcport: 8546,
        isSentry: true,
      },
      {
        name: 'validator1',
        validating: true,
        syncmode: 'full',
        port: 30306,
        rpcport: 8547,
        isProxied: true,
        sentry: 'sentry1',
      },
      {
        name: 'sentry1',
        validating: false,
        syncmode: 'full',
        port: 30307,
        sentryport: 30308,
        rpcport: 8548,
        isSentry: true,
      },
      { name: 'validator2', validating: true, syncmode: 'full', port: 30309, rpcport: 8549 },
      { name: 'validator3', validating: true, syncmode: 'full', port: 30310, rpcport: 8550 },
    ],
    useBootnode: true,
  }
  const hooks = getHooks(gethConfig)

  before(async () => {
    // Start validator nodes and migrate contracts.
    await hooks.before()
    // Restart validator nodes.
    await hooks.restart()
    // Give validators time to connect to eachother.
    await sleep(60)
  })

  it('dummy test', async () => {
    assert.fail('test')
  })
})
