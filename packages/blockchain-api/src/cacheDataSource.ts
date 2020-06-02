import { DataSource, DataSourceConfig } from 'apollo-datasource'
import { KeyValueCache } from 'apollo-server-caching'

export default class CacheDataSource<T> extends DataSource {
  // @ts-ignore We can't express that initialize will definitely be called
  cache: KeyValueCache

  initialize(config: DataSourceConfig<T>) {
    this.cache = config.cache
  }

  async fetchFromCache(cacheKey: string, fetchFn: () => Promise<string>) {
    const existingValue = await this.cache.get(cacheKey)
    if (existingValue) {
      return existingValue
    }

    const fetchedValue = await fetchFn()
    await this.cache.set(cacheKey, fetchedValue)
    return fetchedValue
  }
}
