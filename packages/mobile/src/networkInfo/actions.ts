export enum Actions {
  SET_CONNECTED = 'NETWORK_INFO/SET_CONNECTED',
}

interface SetNetworkConnected {
  type: Actions.SET_CONNECTED
  connected: boolean
}

export type ActionTypes = SetNetworkConnected

export const setNetworkConnectivity = (connected: boolean) => ({
  type: Actions.SET_CONNECTED,
  connected,
})
