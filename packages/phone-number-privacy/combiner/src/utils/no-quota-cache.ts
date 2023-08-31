import { LRUCache } from 'lru-cache'

// Stores if an address does not have more quota with its totalQuota number
export class NoQuotaCache {
  private cache: LRUCache<string, number, any>
  constructor() {
    this.cache = new LRUCache({
      max: 500,
      ttl: 5 * 1000, // 5 seconds
      allowStale: false,
    })
  }

  maximumQuouaReached = (address: string): boolean => {
    const dek = this.cache.get(address)

    return dek !== undefined
  }

  getTotalQuota = (address: string): number | undefined => {
    return this.cache.get(address)
  }

  setNoMoreQuota = (address: string, totalQuota: number) => {
    const previousQuota = this.cache.get(address)
    // Checking if the quotas are not the same to avoid refreshing the ttl
    if (!previousQuota || previousQuota < totalQuota) {
      this.cache.set(address, totalQuota)
    }
  }
}
