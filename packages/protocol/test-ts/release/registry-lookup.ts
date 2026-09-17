import { lookupRegistryAddress, RegistryCallClient } from '@celo/protocol/lib/registry-lookup'
import { assert } from 'chai'

const REGISTRY = '0x000000000000000000000000000000000000ce10' as `0x${string}`
const ACCOUNTS = '0x7d21685c17607338b313a7174bab6620bad0aab7'
const ZERO = '0x0000000000000000000000000000000000000000'

const encodedAddress = (address: string) =>
  `0x${address.slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`

/** A client whose `call` replays the given answers, one per attempt. */
const clientReturning = (...answers: Array<{ data?: `0x${string}` } | Error>) => {
  let calls = 0
  const client = {
    call: async () => {
      const answer = answers[Math.min(calls, answers.length - 1)]
      calls += 1
      if (answer instanceof Error) {
        throw answer
      }
      return answer
    },
  } as unknown as RegistryCallClient
  return { client, callCount: () => calls }
}

describe('#lookupRegistryAddress()', () => {
  it('returns the registered address', async () => {
    const { client } = clientReturning({ data: encodedAddress(ACCOUNTS) })
    const address = await lookupRegistryAddress(client, REGISTRY, 'Accounts', 3, 0)
    assert.equal(address.toLowerCase(), ACCOUNTS)
  })

  it('returns the zero address the registry answers for an unregistered name', async () => {
    const { client } = clientReturning({ data: encodedAddress(ZERO) })
    const address = await lookupRegistryAddress(client, REGISTRY, 'Missing', 3, 0)
    assert.equal(address.toLowerCase(), ZERO)
  })

  it('refuses to read a response without data as unregistered', async () => {
    const { client, callCount } = clientReturning({ data: undefined })
    try {
      await lookupRegistryAddress(client, REGISTRY, 'Accounts', 3, 0)
      assert.fail('expected the lookup to be reported as failed')
    } catch (error) {
      assert.include((error as Error).message, 'refusing to guess whether it is registered')
      assert.notInclude((error as Error).message, ZERO)
    }
    assert.equal(callCount(), 3, 'every attempt should be spent before giving up')
  })

  it('reports a lookup that keeps erroring instead of guessing', async () => {
    const { client, callCount } = clientReturning(new Error('rate limited'))
    try {
      await lookupRegistryAddress(client, REGISTRY, 'Accounts', 3, 0)
      assert.fail('expected the lookup to be reported as failed')
    } catch (error) {
      assert.include((error as Error).message, 'rate limited')
    }
    assert.equal(callCount(), 3)
  })

  it('retries a transient failure and returns the address it finally reads', async () => {
    const { client, callCount } = clientReturning(
      { data: undefined },
      { data: encodedAddress(ACCOUNTS) }
    )
    const address = await lookupRegistryAddress(client, REGISTRY, 'Accounts', 3, 0)
    assert.equal(address.toLowerCase(), ACCOUNTS)
    assert.equal(callCount(), 2)
  })
})
