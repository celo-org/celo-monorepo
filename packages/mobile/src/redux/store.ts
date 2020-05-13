import AsyncStorage from '@react-native-community/async-storage'
import { applyMiddleware, compose, createStore } from 'redux'
import { createMigrate, persistReducer, persistStore } from 'redux-persist'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import createSagaMiddleware from 'redux-saga'
import { migrations } from 'src/redux/migrations'
import rootReducer from 'src/redux/reducers'
import { rootSaga } from 'src/redux/sagas'

const persistConfig: any = {
  key: 'root',
  version: 1, // default is -1, increment as we make migrations
  storage: AsyncStorage,
  blacklist: ['home', 'geth', 'networkInfo', 'alert', 'fees', 'recipients', 'imports'],
  stateReconciler: autoMergeLevel2,
  migrate: createMigrate(migrations, { debug: true }),
}

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
