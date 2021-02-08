import AsyncStorage from '@react-native-community/async-storage'
import * as Sentry from '@sentry/react-native'
import { applyMiddleware, compose, createStore } from 'redux'
import { createMigrate, getStoredState, persistReducer, persistStore } from 'redux-persist'
import FSStorage from 'redux-persist-fs-storage'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import createSagaMiddleware from 'redux-saga'
import { PerformanceEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { migrations } from 'src/redux/migrations'
import rootReducer from 'src/redux/reducers'
import { rootSaga } from 'src/redux/sagas'
import Logger from 'src/utils/Logger'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

const timeBetweenStoreSizeEvents = ONE_DAY_IN_MILLIS
let lastEventTime = Date.now()

const persistConfig: any = {
  key: 'root',
  version: 7, // default is -1, increment as we make migrations
  keyPrefix: `reduxStore-`, // the redux-persist default is `persist:` which doesn't work with some file systems.
  storage: FSStorage(),
  blacklist: ['geth', 'networkInfo', 'alert', 'fees', 'recipients', 'imports'],
  stateReconciler: autoMergeLevel2,
  migrate: createMigrate(migrations, { debug: true }),
  serialize: (data: any) => {
    // We're using this to send the size of the store to analytics while using the default implementation of JSON.stringify.
    const stringifiedData = JSON.stringify(data)
    // if data._persist or any other key is present the whole state is present (the content of the keys are
    // sometimes serialized independently).
    if (data._persist && Date.now() > lastEventTime + timeBetweenStoreSizeEvents) {
      lastEventTime = Date.now()
      ValoraAnalytics.track(PerformanceEvents.redux_store_size, {
        size: stringifiedData.length,
      })
    }
    return stringifiedData
  },
  deserialize: (data: string) => {
    // This is the default implementation, but overriding to maintain compatibility with the serialize function
    // in case the library changes.
    return JSON.parse(data)
  },
  timeout: null,
}

// We used to use AsyncStorage to save the state, but moved to file system storage because of problems with Android
// maximum size limits. To keep backwards compatibility, we first try to read from the file system but if nothing is found
// it means it's an old version so we read the state from AsyncStorage.
persistConfig.getStoredState = (config: any) =>
  getStoredState(config)
    .then(
      (state) =>
        state ?? getStoredState({ ...config, storage: AsyncStorage, keyPrefix: 'persist:' })
    )
    .catch((error) => {
      Sentry.captureException(error)
      Logger.error('redux/store', 'Failed to retrieve redux state.', error)
    })

const persistedReducer = persistReducer(persistConfig, rootReducer)

declare var window: any

export const configureStore = (initialState = {}) => {
  const sagaMiddleware = createSagaMiddleware()
  const middlewares = [sagaMiddleware]

  if (__DEV__) {
    const createDebugger = require('redux-flipper').default
    // Sending the whole state makes the redux debugger in flipper super slow!!
    // I suspect it's the exchange rates causing this!
    // For now exclude the `exchange` reducer.
    middlewares.push(
      createDebugger({
        stateWhitelist: [
          'app',
          'networkInfo',
          'alert',
          'goldToken',
          'stableToken',
          'send',
          'home',
          // "exchange",
          'transactions',
          'web3',
          'identity',
          'account',
          'invite',
          'geth',
          'escrow',
          'fees',
          'recipients',
          'localCurrency',
          'imports',
          'paymentRequest',
          'verify',
        ],
      })
    )
  }

  const enhancers = [applyMiddleware(...middlewares)]

  if (__DEV__) {
    const Reactotron = require('src/reactotronConfig').default
    enhancers.push(Reactotron.createEnhancer())
  }

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  // @ts-ignore
  const createdStore = createStore(persistedReducer, initialState, composeEnhancers(...enhancers))

  const createdPersistor = persistStore(createdStore)
  sagaMiddleware.run(rootSaga)
  return { store: createdStore, persistor: createdPersistor }
}

const { store, persistor } = configureStore()
export { store, persistor }
