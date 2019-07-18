import NetInfo from '@react-native-community/netinfo'
import { ConnectionInfo } from 'react-native'
import { REHYDRATE } from 'redux-persist/es/constants'
import { eventChannel } from 'redux-saga'
import { call, cancelled, put, spawn, take } from 'redux-saga/effects'
import { setNetworkConnectivity } from 'src/networkInfo/actions'
import Logger from 'src/utils/Logger'

const TAG = 'networkInfo/saga'

export function* waitForRehydrate() {
  yield take(REHYDRATE)
  return
}

function createNetworkStatusChannel() {
  return eventChannel((emit: any) => {
    NetInfo.addEventListener('connectionChange', emit)

    const removeEventListener = () => {
      NetInfo.removeEventListener('connectionChange', emit)
    }
    return removeEventListener
  })
}

const isConnected = (connectionInfo: ConnectionInfo) => {
  return !(connectionInfo.type === 'none')
}

function* subscribeToNetworkStatus() {
  yield call(waitForRehydrate)
  const networkStatusChannel = yield createNetworkStatusChannel()
  let connectionInfo = yield call(NetInfo.getConnectionInfo)
  yield put(setNetworkConnectivity(isConnected(connectionInfo)))
  while (true) {
    try {
      connectionInfo = yield take(networkStatusChannel)
      yield put(setNetworkConnectivity(isConnected(connectionInfo)))
    } catch (error) {
      Logger.error(`${TAG}@subscribeToNetworkStatus`, error)
    } finally {
      if (yield cancelled()) {
        networkStatusChannel.close()
      }
    }
  }
}

export function* networkInfoSaga() {
  yield spawn(subscribeToNetworkStatus)
}
