import { provider } from 'web3-core'

export function hasProperty<T>(object: any, property: string): object is T {
  return property in object
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
      }
      // Net (IPC provider)
      if (hasProperty<{ destroy: () => void }>(connection, 'destroy')) {
        connection.destroy()
      }
      // TODO: more cases? default?
    }
  }
}
