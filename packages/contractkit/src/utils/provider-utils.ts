import { Provider } from 'web3/providers'

function hasProperty<T>(object: any, property: string): object is T {
  return object.hasOwnProperty(property)
}

export function stopProvider(provider: Provider) {
  if (hasProperty<{ stop: () => void }>(provider, 'stop')) {
    provider.stop()
  } else {
    // Close the web3 connection or the CLI hangs forever.
    if (hasProperty<{ connection: any }>(provider, 'connection')) {
      const connection = provider.connection
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
