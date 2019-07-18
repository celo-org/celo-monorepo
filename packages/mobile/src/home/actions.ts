import { ImageSourcePropType } from 'react-native'

export interface Notification {
  title: string
  subtitle: string
  icon: ImageSourcePropType
  cta?: string
  ctaOnPress?: () => void
  showAvatar?: boolean
  lastOfList?: boolean
}

export enum Actions {
  SET_LOADING = 'HOME/SET_LOADING',
  ADD_NOTIFICATION = 'HOME/ADD_NOTIFICATION',
  SET_NOTIFICATION = 'HOME/SET_NOTIFICATION',
  REFRESH_BALANCES = 'HOME/REFRESH_BALANCES',
}

export const setLoading = (loading: boolean) => ({
  type: Actions.SET_LOADING,
  loading,
})

export const addNotification = (notification: Notification) => {
  return {
    type: Actions.ADD_NOTIFICATION,
    payload: {
      notification,
    },
  }
}

export const setNotification = (notification: Notification, index: number) => ({
  type: Actions.SET_NOTIFICATION,
  payload: {
    notification,
    index,
  },
})

export const refreshAllBalances = () => ({
  type: Actions.REFRESH_BALANCES,
})
