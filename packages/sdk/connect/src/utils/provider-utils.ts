import { Provider } from '../types'

/** @internal */
export function hasProperty<T>(object: any, property: string): object is T {
  return property in object
}

/** @internal */
export function stopProvider(defaultProvider: Provider) {
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
