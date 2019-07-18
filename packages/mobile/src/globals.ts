import { AnyAction, Store } from 'redux'
import { PersistPartial } from 'redux-persist'

export type StoreType = Store<PersistPartial, AnyAction>
