import { sleep } from '@celo/base'
import { NoQuotaCache } from '../../src/utils/no-quota-cache'

describe(`NoQuotaCache`, () => {
  let noQuotaCache: NoQuotaCache
  beforeEach(() => {
    noQuotaCache = new NoQuotaCache(1)
  })

  it('should maintain a value', async () => {
    noQuotaCache.setNoMoreQuota('ADDRESS1', 10)

    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(true)
    expect(noQuotaCache.getTotalQuota('ADDRESS1')).toBe(10)
  })

  it('should return undefined if a key expired', async () => {
    noQuotaCache.setNoMoreQuota('ADDRESS1', 10)

    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(true)
    await sleep(1100)
    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(false)
    expect(noQuotaCache.getTotalQuota('ADDRESS1')).toBe(undefined)
  })

  it('should not refresh a key if it saves the same value', async () => {
    noQuotaCache.setNoMoreQuota('ADDRESS1', 10)

    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(true)
    await sleep(600)
    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(true)
    noQuotaCache.setNoMoreQuota('ADDRESS1', 10)
    await sleep(600)
    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(false)
    expect(noQuotaCache.getTotalQuota('ADDRESS1')).toBe(undefined)
  })

  it('should not refresh a key if it saves the value is smaller', async () => {
    noQuotaCache.setNoMoreQuota('ADDRESS1', 10)

    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(true)
    await sleep(600)
    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(true)
    noQuotaCache.setNoMoreQuota('ADDRESS1', 5)
    await sleep(600)
    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(false)
    expect(noQuotaCache.getTotalQuota('ADDRESS1')).toBe(undefined)
  })

  it('should refresh a key if it saves the value is bigger', async () => {
    noQuotaCache.setNoMoreQuota('ADDRESS1', 10)

    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(true)
    await sleep(600)
    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(true)
    noQuotaCache.setNoMoreQuota('ADDRESS1', 20)
    await sleep(600)
    expect(noQuotaCache.maximumQuotaReached('ADDRESS1')).toBe(true)
    expect(noQuotaCache.getTotalQuota('ADDRESS1')).toBe(20)
  })
})
