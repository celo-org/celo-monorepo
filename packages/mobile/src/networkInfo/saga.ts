import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { REHYDRATE } from 'redux-persist/es/constants'
import { eventChannel } from 'redux-saga'
import { call, cancelled, put, spawn, take } from 'redux-saga/effects'
import { waitForGethConnectivity } from 'src/geth/saga'
import { setNetworkConnectivity } from 'src/networkInfo/actions'
import Logger from 'src/utils/Logger'
import { waitForWeb3Sync } from 'src/web3/saga'

const TAG = 'networkInfo/saga'

export function* waitForRehydrate() {
  yield take(REHYDRATE)
  return
}

export function* waitWeb3LastBlock() {
  yield waitForGethConnectivity()
  yield waitForWeb3Sync()
}

function createNetworkStatusChannel() {
  return eventChannel((emit) => {
    NetInfo.addEventListener((state) => emit(state))
    return () => {
      Logger.info('Removed network status monitor')
    }
  })
}

const isConnected = (connectionInfo: NetInfoState) => {
  return !(connectionInfo.type === 'none')
}

function* subscribeToNetworkStatus() {
  yield call(waitForRehydrate)
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
