import { sleep } from '../lib/test-utils'

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
