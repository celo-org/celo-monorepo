import { applyMiddleware, compose, createStore } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import storage from 'redux-persist/lib/storage'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'
import rootReducer from 'src/redux/reducers'
import { rootSaga } from 'src/redux/sagas'

const persistConfig = {
  key: 'root',
  version: -1, // default is -1, increment as we make migrations
  storage,
  blacklist: ['home', 'geth', 'exchange', 'networkInfo', 'alert'],
  stateReconciler: autoMergeLevel2,
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

declare var window: any

export const configureStore = (initialState = {}) => {
  const sagaMiddleware = createSagaMiddleware()
  const middlewares = [thunk, sagaMiddleware]

  const enhancers = [applyMiddleware(...middlewares)]

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  // @ts-ignore
  const createdStore = createStore(persistedReducer, initialState, composeEnhancers(...enhancers))

  const createdPersistor = persistStore(createdStore)
  sagaMiddleware.run(rootSaga)
  return { store: createdStore, persistor: createdPersistor }
}

const { store, persistor } = configureStore()

// TODO(cmcewen): remove once we we remove thunk
const reduxStore = store

export const getReduxStore = () => {
  return reduxStore
}

export { store, persistor }
