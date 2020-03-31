import { provider } from 'web3-core'

export function hasProperty<T>(object: any, property: string): object is T {
  return property in object
}

export function getProviderUrl(defaultProvider: any): any {
  if (defaultProvider.existingProvider) return getProviderUrl(defaultProvider.existingProvider)
  return defaultProvider.connection ? defaultProvider.connection.url : defaultProvider.host
}

export function stopProvider(defaultProvider: provider) {
  if (hasProperty<{ stop: () => void }>(defaultProvider, 'stop')) {
    defaultProvider.stop()
  } else {
    // Close the web3 connection or the CLI hangs forever.
    if (hasProperty<{ connection: any }>(defaultProvider, 'connection')) {
      const connection = defaultProvider.connection
      // WS
      if (hasProperty<{ close: () => void }>(connection, 'close')) {
        connection.close()
      } else if (connection.hasOwnProperty('_connection')) {
        connection._connection.close()
      }
      // Net (IPC provider)
      else if (hasProperty<{ destroy: () => void }>(connection, 'destroy')) {
        connection.destroy()
      }
      // TODO: more cases? default?
    }
  }
}
