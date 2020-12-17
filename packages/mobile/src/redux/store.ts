import AsyncStorage from '@react-native-community/async-storage'
import { applyMiddleware, compose, createStore } from 'redux'
import { createMigrate, getStoredState, persistReducer, persistStore } from 'redux-persist'
import FSStorage from 'redux-persist-fs-storage'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import createSagaMiddleware from 'redux-saga'
import { PerformanceEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { APP_NAME } from 'src/config'
import { migrations } from 'src/redux/migrations'
import rootReducer from 'src/redux/reducers'
import { rootSaga } from 'src/redux/sagas'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

const timeBetweenStoreSizeEvents = ONE_DAY_IN_MILLIS
let lastEventTime = Date.now()

const persistConfig: any = {
  key: 'root',
  version: 7, // default is -1, increment as we make migrations
  keyPrefix: `${APP_NAME}-`, // the redux-persist default is `persist:` which doesn't work with some file systems.
  storage: FSStorage(),
  blacklist: ['home', 'geth', 'networkInfo', 'alert', 'fees', 'recipients', 'imports'],
  stateReconciler: autoMergeLevel2,
  migrate: createMigrate(migrations, { debug: true }),
  serialize: (data: any) => {
    // We're using this to send the size of the store to analytics while using the default implementation of JSON.stringify.
    const stringifiedData = JSON.stringify(data)
    // if data._persist or any other key is present the whole state is present (the content of the keys are
    // sometimes serialized independently).
    if (data._persist && lastEventTime + timeBetweenStoreSizeEvents > Date.now()) {
      lastEventTime = Date.now()
      ValoraAnalytics.track(PerformanceEvents.redux_store_size, {
        size: stringifiedData.length,
      })
    }
    return stringifiedData
  },
}

const fetchAsyncStorageState = (config: any) =>
  getStoredState({ ...config, storage: AsyncStorage, keyPrefix: 'persist:' })

persistConfig.getStoredState = (config: any) =>
  getStoredState(config)
    .then((state) => (state ? state : fetchAsyncStorageState(config)))
    .catch(() => fetchAsyncStorageState(config))

if (__DEV__) {
  persistConfig.timeout = 10000
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

declare var window: any

export const configureStore = (initialState = {}) => {
  const sagaMiddleware = createSagaMiddleware()
  const middlewares = [sagaMiddleware]

  const enhancers = [applyMiddleware(...middlewares)]

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  // @ts-ignore
  const createdStore = createStore(persistedReducer, initialState, composeEnhancers(...enhancers))

  const createdPersistor = persistStore(createdStore)
  sagaMiddleware.run(rootSaga)
  return { store: createdStore, persistor: createdPersistor }
}

const { store, persistor } = configureStore()
export { store, persistor }
