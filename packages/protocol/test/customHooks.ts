import { sleep } from '../lib/test-utils'

// Handles flakey `error: Invalid JSON RPC response: ""` error that seems to be caused by port exhaustion in CI.
// See https://github.com/ethereum/web3.js/issues/3425 and https://github.com/ethereum/web3.js/issues/926.
export const beforeEachWithRetries = (
  title: string,
  numRetries: number,
  sleepMs: number,
  fn: () => any
) =>
  beforeEach(title, async () => {
    for (let i = 0; i < numRetries; i++) {
      try {
        await fn()
        return
      } catch (e) {
        if (i === numRetries) {
          throw new Error(e)
        }
        // tslint:disable no-console
        console.log(e)
        console.log(`Retry #${i} for beforeEachWithRetries hook ${title}`)
        if (sleepMs) {
          console.log(`Sleeping ${sleepMs} ms...`)
          await sleep(3000)
        }
      }
    }
  })
