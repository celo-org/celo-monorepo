import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { eventChannel } from 'redux-saga'
import { call, cancelled, put, spawn, take } from 'redux-saga/effects'
import { setNetworkConnectivity } from 'src/networkInfo/actions'
import Logger from 'src/utils/Logger'

const TAG = 'networkInfo/saga'

function createNetworkStatusChannel() {
  return eventChannel((emit) => {
    return NetInfo.addEventListener((state) => emit(state))
  })
}

const isConnected = (connectionInfo: NetInfoState) => {
  return connectionInfo.type !== 'none'
}

function* subscribeToNetworkStatus() {
  const networkStatusChannel = yield createNetworkStatusChannel()
  let connectionInfo: NetInfoState = yield call(NetInfo.fetch)
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
