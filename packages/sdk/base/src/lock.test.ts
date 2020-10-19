import { sleep } from './async'
import { Lock } from './lock'

async function pause() {
  await sleep(Math.floor(Math.random() * 10))
}

test('lock', async () => {
  let canary: number | undefined
  const lock = new Lock()

  const race = async (id: number) => {
    await pause()
    await lock.acquire()
    canary = id
    await pause()
    expect(canary).toBe(id)
    lock.release()
  }

  const promises: Array<Promise<void>> = []
  for (let i = 0; i < 100; i++) {
    promises.push(race(i))
  }
  await Promise.all(promises)
})
