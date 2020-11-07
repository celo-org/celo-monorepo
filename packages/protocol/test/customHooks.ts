import { retryAsync } from '@celo/utils/lib/async'

// Handles flakey `error: Invalid JSON RPC response: ""` error that seems to be caused by port exhaustion in CI.
// See https://github.com/ethereum/web3.js/issues/3425 and https://github.com/ethereum/web3.js/issues/926.
export const beforeEachWithRetries = (
  title: string,
  numRetries: number,
  sleepMs: number,
  fn: () => any
) =>
  beforeEach(title, async () => {
    await retryAsync(fn, numRetries, [], sleepMs)
  })
